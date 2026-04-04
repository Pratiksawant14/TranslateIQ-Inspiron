import requests
import json
import os
import time

BASE_URL = "http://localhost:8000/api/v1"

def run_pipeline():
    project_id_path = os.path.join(os.path.dirname(__file__), "project_id.txt")
    if not os.path.exists(project_id_path):
        print("Error: project_id.txt not found. Run seed_tm.py first.")
        return
        
    with open(project_id_path, "r") as f:
        project_id = f.read().strip()
        
    doc_path = os.path.join(os.path.dirname(__file__), "legal_contract.docx")
    if not os.path.exists(doc_path):
        print("Error: legal_contract.docx not found. Run create_test_docs.py first.")
        return

    print("=== TRANSLATEIQ PIPELINE TEST ===")
    print(f"Project ID: {project_id}")

    # 1. Upload
    print("\n--- 1. UPLOAD ---")
    url = f"{BASE_URL}/projects/{project_id}/documents/upload"
    with open(doc_path, "rb") as f:
        files = {"file": ("legal_contract.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        resp = requests.post(url, files=files)
    resp.raise_for_status()
    doc_data = resp.json()
    doc_id = doc_data["id"]
    print(f"SUCCESS: Uploaded document. Document ID: {doc_id}")

    # Give a bit of delay just in case
    time.sleep(1)

    # 2. Parse
    print("\n--- 2. PARSE ---")
    url = f"{BASE_URL}/projects/{project_id}/documents/{doc_id}/parse"
    resp = requests.post(url)
    resp.raise_for_status()
    parse_data = resp.json()
    print(f"SUCCESS: Parsed document. Total segments: {parse_data['total_segments']}")

    # 3. Validate
    print("\n--- 3. VALIDATE ---")
    url = f"{BASE_URL}/projects/{project_id}/documents/{doc_id}/validate"
    resp = requests.post(url)
    resp.raise_for_status()
    val_data = resp.json()
    issues = val_data["issues_by_severity"]
    print(f"SUCCESS: Validation complete. Total issues: {val_data['total_issues']}")
    print(f"         High: {issues.get('high', 0)}, Medium: {issues.get('medium', 0)}, Low: {issues.get('low', 0)}")

    # 4. Classify
    print("\n--- 4. CLASSIFY ---")
    url = f"{BASE_URL}/projects/{project_id}/documents/{doc_id}/classify"
    payload = {"source_language": "en", "target_language": "es"}
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    class_data = resp.json()
    print(f"SUCCESS: Classification complete.")
    print(f"         Exact Matches: {class_data['exact_count']}")
    print(f"         Fuzzy Matches: {class_data['fuzzy_count']}")
    print(f"         New Segments:  {class_data['new_count']}")

    # Get Style Profile to pass to Translate
    profiles_resp = requests.get(f"{BASE_URL}/projects/{project_id}/style-profiles")
    profiles_resp.raise_for_status()
    profiles = profiles_resp.json()
    style_id = None
    if profiles:
        style_id = profiles[0]["id"]
        print(f"         Found Style Profile: {style_id}")

    # 5. Translate
    print("\n--- 5. TRANSLATE ---")
    url = f"{BASE_URL}/projects/{project_id}/documents/{doc_id}/translate"
    payload = {
        "source_language": "en",
        "target_language": "es",
        "style_profile_id": style_id
    }
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    trans_data = resp.json()
    print(f"SUCCESS: Translation complete. Translated: {trans_data['translated_count']} | Skipped: {trans_data['skipped_count']}")

    # 6. Score
    print("\n--- 6. SCORE ---")
    url = f"{BASE_URL}/projects/{project_id}/documents/{doc_id}/score?target_language=es"
    resp = requests.post(url)
    resp.raise_for_status()
    score_data = resp.json()
    print(f"SUCCESS: Scoring complete.")
    print(f"         Average Confidence: {score_data['average_confidence']:.2f}")
    print(f"         Segments Needing Review: {score_data['segments_needing_review']}")

    # 7. Summary
    print("\n--- 7. SUMMARY TABLE ---")
    url = f"{BASE_URL}/projects/{project_id}/documents/{doc_id}/review"
    resp = requests.get(url)
    resp.raise_for_status()
    review_data = resp.json()
    
    print(f"{'Idx':<4} | {'Match':<8} | {'Status':<10} | {'Conf':<5} | {'Source':<30} | {'Target':<30}")
    print("-" * 100)
    for seg in review_data["segments"]:
        idx = seg["segment_index"]
        match = (seg.get("tm_match_type") or "NEW")[:8]
        status = seg["status"][:10]
        conf = f"{seg.get('confidence_score', 0):.2f}" if seg.get('confidence_score') is not None else "N/A"
        src = (seg["source_text"][:27] + "...") if len(seg["source_text"]) > 27 else seg["source_text"]
        tgt = ""
        if seg.get("translated_text"):
             tgt = (seg["translated_text"][:27] + "...") if len(seg["translated_text"]) > 27 else seg["translated_text"]
        print(f"{idx:<4} | {match:<8} | {status:<10} | {conf:<5} | {src:<30} | {tgt:<30}")
        
    print("\nPipeline tests finished successfully.")

if __name__ == "__main__":
    try:
        run_pipeline()
    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        if e.response is not None:
            print(f"Response: {e.response.text}")
