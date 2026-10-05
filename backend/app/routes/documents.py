import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Employee, Document, DocumentCategory, UserRole
from app.schemas import DocumentOut
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/documents", tags=["Document Management"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=DocumentOut)
async def upload_document(
    title: str = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value, UserRole.MANAGER.value]))
):
    uploader_emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not uploader_emp:
        raise HTTPException(status_code=400, detail="Uploader profile not found")

    if category not in [c.value for c in DocumentCategory]:
        category = DocumentCategory.COMPANY_POLICIES.value

    # Save file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Format file size
    size_bytes = os.path.getsize(file_path)
    if size_bytes < 1024 * 1024:
        size_str = f"{round(size_bytes / 1024, 1)} KB"
    else:
        size_str = f"{round(size_bytes / (1024 * 1024), 2)} MB"

    ext = os.path.splitext(file.filename)[1].replace(".", "").upper()

    doc = Document(
        title=title,
        category=category,
        file_path=file_path,
        file_size=size_str,
        file_type=ext if ext else "FILE",
        uploaded_by_id=uploader_emp.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "title": doc.title,
        "category": doc.category,
        "file_path": doc.file_path,
        "file_size": doc.file_size,
        "file_type": doc.file_type,
        "uploaded_by_id": doc.uploaded_by_id,
        "uploader_name": f"{uploader_emp.first_name} {uploader_emp.last_name}",
        "created_at": doc.created_at
    }

@router.get("", response_model=List[DocumentOut])
def list_documents(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document)

    if category:
        query = query.filter(Document.category == category)

    if search:
        query = query.filter(Document.title.ilike(f"%{search}%"))

    docs = query.order_by(Document.created_at.desc()).all()

    result = []
    for d in docs:
        uploader = db.query(Employee).filter(Employee.id == d.uploaded_by_id).first()
        uploader_name = f"{uploader.first_name} {uploader.last_name}" if uploader else "HR Department"
        result.append({
            "id": d.id,
            "title": d.title,
            "category": d.category,
            "file_path": d.file_path,
            "file_size": d.file_size,
            "file_type": d.file_type,
            "uploaded_by_id": d.uploaded_by_id,
            "uploader_name": uploader_name,
            "created_at": d.created_at
        })
    return result

@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found")

    filename = os.path.basename(doc.file_path)
    return FileResponse(path=doc.file_path, filename=filename, media_type='application/octet-stream')

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value]))
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
