import asyncio
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from rank_bm25 import BM25Okapi
from qdrant_client.http import models

from app.models.translation_memory import TranslationMemory
from app.config import settings
from app.qdrant_client import qdrant
from app.services.embedding_service import generate_embedding

async def retrieve_tm_matches(
    db: AsyncSession,
    project_id: UUID,
    source_language: str,
    target_language: str,
    source_text: str,
    top_k: int = 5
) -> dict:
    
    # Step 1: Fetch TM corpus
    tm_result = await db.execute(
        select(TranslationMemory).where(
            TranslationMemory.project_id == project_id,
            TranslationMemory.source_language == source_language,
            TranslationMemory.target_language == target_language
        )
    )
    tm_records = tm_result.scalars().all()
    
    if not tm_records:
        return {
            "matches": [],
            "has_exact": False,
            "best_match_type": "new",
            "best_match": None
        }

    # Map qdrant_vector_id back to actual TM record for merging later
    tm_record_map = {rec.qdrant_vector_id: rec for rec in tm_records}
    all_ids = set()

    # Step 2: BM25 Sparse Search
    corpus = [record.source_text for record in tm_records]
    tokenized_corpus = [doc.split() for doc in corpus]
    bm25 = BM25Okapi(tokenized_corpus)
    
    tokenized_query = source_text.split()
    bm25_scores = bm25.get_scores(tokenized_query)
    
    max_bm25_score = max(bm25_scores) if len(bm25_scores) > 0 and max(bm25_scores) > 0 else 1.0

    bm25_ranks = {}
    top_n_bm25 = sorted(enumerate(bm25_scores), key=lambda x: x[1], reverse=True)[:100]
    
    for rank, (idx, score) in enumerate(top_n_bm25):
        if score <= 0.0:
            continue
        record = tm_records[idx]
        bm25_ranks[record.qdrant_vector_id] = {
            "bm25_rank": rank + 1,
            "bm25_score": score
        }
        all_ids.add(record.qdrant_vector_id)

    # Step 3: Dense Vector Search
    qdrant_ranks = {}
    query_vector = await generate_embedding(source_text)
    
    qdrant_results = await qdrant.query(
        collection_name=settings.QDRANT_COLLECTION_NAME,
        query_vector=query_vector,
        query_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="project_id",
                    match=models.MatchValue(value=str(project_id)),
                ),
                models.FieldCondition(
                    key="source_language",
                    match=models.MatchValue(value=source_language),
                ),
                models.FieldCondition(
                    key="target_language",
                    match=models.MatchValue(value=target_language),
                ),
            ]
        ),
        limit=100
    )
    
    for rank, point in enumerate(qdrant_results):
        qdrant_ranks[str(point.id)] = {
            "dense_rank": rank + 1,
            "dense_score": point.score  # cosine sim [0, 1] usually
        }
        all_ids.add(str(point.id))

    # Step 4: Reciprocal Rank Fusion
    candidates = []
    for vid in all_ids:
        rrf_score = 0.0
        
        b_rank = bm25_ranks.get(vid, {}).get("bm25_rank")
        if b_rank is not None:
            rrf_score += 1.0 / (60 + b_rank)
            
        d_rank = qdrant_ranks.get(vid, {}).get("dense_rank")
        if d_rank is not None:
            rrf_score += 1.0 / (60 + d_rank)
            
        candidates.append({
            "vector_id": vid,
            "rrf_score": rrf_score
        })
        
    candidates.sort(key=lambda x: x["rrf_score"], reverse=True)
    top_candidates = candidates[:top_k]

    # Step 5: Classify each result
    matches = []
    for cand in top_candidates:
        vid = cand["vector_id"]
        record = tm_record_map.get(vid)
        
        # In the edge case where Qdrant has a stale record not in this project's DB table, skip it
        if not record:
            continue
            
        # BM25 Normalized
        b_score = bm25_ranks.get(vid, {}).get("bm25_score", 0.0)
        norm_b_score = b_score / max_bm25_score if max_bm25_score > 0 else 0.0
        
        # Dense Score
        d_score = qdrant_ranks.get(vid, {}).get("dense_score", 0.0)
        
        sim_score = (norm_b_score + d_score) / 2.0
        
        if sim_score >= settings.MATCH_EXACT_THRESHOLD:
            m_type = "exact"
        elif sim_score >= settings.MATCH_FUZZY_THRESHOLD:
            m_type = "fuzzy"
        else:
            continue
            
        matches.append({
            "source_text": record.source_text,
            "target_text": record.target_text,
            "match_type": m_type,
            "score": float(sim_score)
        })
        
    # Re-sort filtered matches by their final computed text similarity score rather than just RRF
    matches.sort(key=lambda x: x["score"], reverse=True)
    
    has_exact = any(m["match_type"] == "exact" for m in matches)
    if not matches:
        best_match_type = "new"
        best_match = None
    else:
        best_match = matches[0]
        best_match_type = best_match["match_type"]
        
    # Step 6: Return
    return {
        "matches": matches,
        "has_exact": has_exact,
        "best_match_type": best_match_type,
        "best_match": best_match
    }
