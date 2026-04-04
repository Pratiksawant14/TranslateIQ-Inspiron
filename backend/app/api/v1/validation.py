from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict
from uuid import UUID

from app.database import get_db
from app.schemas.validation import ValidationReportResponse, ValidationIssueResponse
from app.services import validation_service
from app.services.project_service import get_project_by_id
from app.models.document import Document
from app.models.validation_issue import ValidationIssue

router = APIRouter()

@router.post("/{project_id}/documents/{document_id}/validate", response_model=ValidationReportResponse)
async def run_validation(
    project_id: UUID, 
    document_id: UUID, 
    db: AsyncSession = Depends(get_db)
):
    # Verify project exists
    await get_project_by_id(db, project_id)
    
    # Document verification
    doc_query = await db.execute(select(Document).where(Document.id == document_id, Document.project_id == project_id))
    document = doc_query.scalars().first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    report_dict = await validation_service.validate_document(db, str(document.id))
    return report_dict

@router.get("/{project_id}/documents/{document_id}/validation-report", response_model=ValidationReportResponse)
async def get_validation_report(
    project_id: UUID, 
    document_id: UUID, 
    db: AsyncSession = Depends(get_db)
):
    await get_project_by_id(db, project_id)
    
    doc_query = await db.execute(select(Document).where(Document.id == document_id, Document.project_id == project_id))
    document = doc_query.scalars().first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    issues_query = await db.execute(
        select(ValidationIssue)
        .where(ValidationIssue.document_id == document_id)
        .order_by(ValidationIssue.created_at.desc())
    )
    issues = issues_query.scalars().all()
    
    low = sum(1 for i in issues if i.severity == "low")
    medium = sum(1 for i in issues if i.severity == "medium")
    high = sum(1 for i in issues if i.severity == "high")
    
    return {
        "document_id": document_id,
        "total_issues": len(issues),
        "issues_by_severity": {"low": low, "medium": medium, "high": high},
        "issues": issues
    }

@router.post("/{project_id}/documents/{document_id}/issues/{issue_id}/resolve", response_model=ValidationIssueResponse)
async def resolve_validation_issue(
    project_id: UUID, 
    document_id: UUID, 
    issue_id: UUID, 
    db: AsyncSession = Depends(get_db)
):
    await get_project_by_id(db, project_id)
    
    issue_query = await db.execute(
        select(ValidationIssue).where(
            ValidationIssue.id == issue_id, 
            ValidationIssue.document_id == document_id
        )
    )
    issue = issue_query.scalars().first()
    
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
        
    issue.is_resolved = True
    await db.commit()
    await db.refresh(issue)
    
    return issue
