from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models import User, Employee, Meeting, MeetingParticipant, UserRole
from app.schemas import MeetingCreate, MeetingOut, EmployeeOut
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/meetings", tags=["Meeting Management"])

@router.post("", response_model=MeetingOut)
def create_meeting(
    meeting_data: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value, UserRole.MANAGER.value]))
):
    creator_emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not creator_emp:
        raise HTTPException(status_code=400, detail="Creator employee profile not found")

    meeting = Meeting(
        title=meeting_data.title,
        description=meeting_data.description,
        meeting_date=meeting_data.meeting_date,
        start_time=meeting_data.start_time,
        end_time=meeting_data.end_time,
        location_or_link=meeting_data.location_or_link,
        created_by_id=creator_emp.id
    )
    db.add(meeting)
    db.flush()

    # Add participants
    participants_list = []
    for emp_id in meeting_data.participant_ids:
        part = MeetingParticipant(meeting_id=meeting.id, employee_id=emp_id)
        db.add(part)
        emp = db.query(Employee).filter(Employee.id == emp_id).first()
        if emp:
            user = db.query(User).filter(User.id == emp.user_id).first()
            participants_list.append({
                "id": emp.id,
                "user_id": emp.user_id,
                "employee_code": emp.employee_code,
                "first_name": emp.first_name,
                "last_name": emp.last_name,
                "phone": emp.phone,
                "department_id": emp.department_id,
                "department_name": emp.department.name if emp.department else None,
                "designation": emp.designation,
                "role": emp.role,
                "joining_date": emp.joining_date,
                "status": emp.status,
                "email": user.email if user else "",
                "avatar": emp.avatar
            })

    db.commit()
    db.refresh(meeting)

    return {
        "id": meeting.id,
        "title": meeting.title,
        "description": meeting.description,
        "meeting_date": meeting.meeting_date,
        "start_time": meeting.start_time,
        "end_time": meeting.end_time,
        "location_or_link": meeting.location_or_link,
        "created_by_id": meeting.created_by_id,
        "creator_name": f"{creator_emp.first_name} {creator_emp.last_name}",
        "participants": participants_list,
        "created_at": meeting.created_at
    }

@router.get("", response_model=List[MeetingOut])
def list_meetings(
    filter_type: Optional[str] = "upcoming", # "upcoming" or "past" or "all"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Meeting)
    today = date.today()

    current_emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    # Filter meetings: If employee, only show meetings created by them or where they are a participant
    if current_user.role == UserRole.EMPLOYEE.value and current_emp:
        participant_meeting_ids = [
            p.meeting_id for p in db.query(MeetingParticipant).filter(MeetingParticipant.employee_id == current_emp.id).all()
        ]
        query = query.filter(
            (Meeting.created_by_id == current_emp.id) | (Meeting.id.in_(participant_meeting_ids))
        )

    if filter_type == "upcoming":
        query = query.filter(Meeting.meeting_date >= today).order_by(Meeting.meeting_date.asc(), Meeting.start_time.asc())
    elif filter_type == "past":
        query = query.filter(Meeting.meeting_date < today).order_by(Meeting.meeting_date.desc())
    else:
        query = query.order_by(Meeting.meeting_date.desc())

    meetings = query.all()

    result = []
    for m in meetings:
        creator = db.query(Employee).filter(Employee.id == m.created_by_id).first()
        creator_name = f"{creator.first_name} {creator.last_name}" if creator else "System"

        participants_list = []
        for p in m.participants:
            emp = db.query(Employee).filter(Employee.id == p.employee_id).first()
            if emp:
                user = db.query(User).filter(User.id == emp.user_id).first()
                participants_list.append({
                    "id": emp.id,
                    "user_id": emp.user_id,
                    "employee_code": emp.employee_code,
                    "first_name": emp.first_name,
                    "last_name": emp.last_name,
                    "phone": emp.phone,
                    "department_id": emp.department_id,
                    "department_name": emp.department.name if emp.department else None,
                    "designation": emp.designation,
                    "role": emp.role,
                    "joining_date": emp.joining_date,
                    "status": emp.status,
                    "email": user.email if user else "",
                    "avatar": emp.avatar
                })

        result.append({
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "meeting_date": m.meeting_date,
            "start_time": m.start_time,
            "end_time": m.end_time,
            "location_or_link": m.location_or_link,
            "created_by_id": m.created_by_id,
            "creator_name": creator_name,
            "participants": participants_list,
            "created_at": m.created_at
        })

    return result

@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value, UserRole.MANAGER.value]))
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    db.delete(meeting)
    db.commit()
    return {"message": "Meeting cancelled successfully"}
