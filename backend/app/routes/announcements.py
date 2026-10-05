from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Employee, Announcement, AnnouncementPriority, UserRole
from app.schemas import AnnouncementCreate, AnnouncementOut
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/announcements", tags=["Announcement Management"])

@router.post("", response_model=AnnouncementOut)
def create_announcement(
    ann_data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value, UserRole.MANAGER.value]))
):
    author_emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not author_emp:
        raise HTTPException(status_code=400, detail="Author employee profile not found")

    announcement = Announcement(
        title=ann_data.title,
        content=ann_data.content,
        priority=ann_data.priority,
        author_id=author_emp.id
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    return {
        "id": announcement.id,
        "title": announcement.title,
        "content": announcement.content,
        "priority": announcement.priority,
        "author_id": announcement.author_id,
        "author_name": f"{author_emp.first_name} {author_emp.last_name}",
        "created_at": announcement.created_at
    }

@router.get("", response_model=List[AnnouncementOut])
def list_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    announcements = db.query(Announcement).order_by(Announcement.created_at.desc()).all()
    result = []
    for a in announcements:
        author = db.query(Employee).filter(Employee.id == a.author_id).first()
        author_name = f"{author.first_name} {author.last_name}" if author else "Admin Office"
        result.append({
            "id": a.id,
            "title": a.title,
            "content": a.content,
            "priority": a.priority,
            "author_id": a.author_id,
            "author_name": author_name,
            "created_at": a.created_at
        })
    return result

@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value, UserRole.MANAGER.value]))
):
    ann = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    db.delete(ann)
    db.commit()
    return {"message": "Announcement deleted successfully"}
