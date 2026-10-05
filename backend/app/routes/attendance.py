from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.models import User, Employee, Attendance, AttendanceStatus, UserRole
from app.schemas import AttendanceOut
from app.auth import get_current_user, get_current_employee

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.post("/check-in", response_model=AttendanceOut)
def check_in(db: Session = Depends(get_db), current_employee: Employee = Depends(get_current_employee)):
    today = date.today()
    now = datetime.now()

    # Check if already checked in today
    attendance = db.query(Attendance).filter(
        Attendance.employee_id == current_employee.id,
        Attendance.date == today
    ).first()

    if attendance:
        if attendance.check_in:
            raise HTTPException(status_code=400, detail="Already checked in for today")
        attendance.check_in = now
    else:
        # Determine status (e.g. late if after 9:30 AM)
        att_status = AttendanceStatus.PRESENT.value
        if now.hour > 9 or (now.hour == 9 and now.minute > 30):
            att_status = AttendanceStatus.LATE.value

        attendance = Attendance(
            employee_id=current_employee.id,
            date=today,
            check_in=now,
            status=att_status,
            working_hours="0h 0m"
        )
        db.add(attendance)

    db.commit()
    db.refresh(attendance)

    dept_name = current_employee.department.name if current_employee.department else "N/A"
    return {
        "id": attendance.id,
        "employee_id": attendance.employee_id,
        "employee_name": f"{current_employee.first_name} {current_employee.last_name}",
        "department_name": dept_name,
        "date": attendance.date,
        "check_in": attendance.check_in,
        "check_out": attendance.check_out,
        "working_hours": attendance.working_hours,
        "status": attendance.status
    }

@router.post("/check-out", response_model=AttendanceOut)
def check_out(db: Session = Depends(get_db), current_employee: Employee = Depends(get_current_employee)):
    today = date.today()
    now = datetime.now()

    attendance = db.query(Attendance).filter(
        Attendance.employee_id == current_employee.id,
        Attendance.date == today
    ).first()

    if not attendance or not attendance.check_in:
        raise HTTPException(status_code=400, detail="You must check in first before checking out")

    if attendance.check_out:
        raise HTTPException(status_code=400, detail="Already checked out for today")

    attendance.check_out = now

    # Calculate duration
    duration = now - attendance.check_in
    hours, remainder = divmod(int(duration.total_seconds()), 3600)
    minutes, _ = divmod(remainder, 60)
    attendance.working_hours = f"{hours}h {minutes}m"

    db.commit()
    db.refresh(attendance)

    dept_name = current_employee.department.name if current_employee.department else "N/A"
    return {
        "id": attendance.id,
        "employee_id": attendance.employee_id,
        "employee_name": f"{current_employee.first_name} {current_employee.last_name}",
        "department_name": dept_name,
        "date": attendance.date,
        "check_in": attendance.check_in,
        "check_out": attendance.check_out,
        "working_hours": attendance.working_hours,
        "status": attendance.status
    }

@router.get("/today", response_model=Optional[AttendanceOut])
def get_today_attendance(db: Session = Depends(get_db), current_employee: Employee = Depends(get_current_employee)):
    today = date.today()
    attendance = db.query(Attendance).filter(
        Attendance.employee_id == current_employee.id,
        Attendance.date == today
    ).first()

    if not attendance:
        return None

    dept_name = current_employee.department.name if current_employee.department else "N/A"
    return {
        "id": attendance.id,
        "employee_id": attendance.employee_id,
        "employee_name": f"{current_employee.first_name} {current_employee.last_name}",
        "department_name": dept_name,
        "date": attendance.date,
        "check_in": attendance.check_in,
        "check_out": attendance.check_out,
        "working_hours": attendance.working_hours,
        "status": attendance.status
    }

@router.get("/history", response_model=List[AttendanceOut])
def get_attendance_history(
    employee_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Attendance)

    # Role filter: employees can only view their own history unless Admin/Manager
    if current_user.role == UserRole.EMPLOYEE.value:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if emp:
            query = query.filter(Attendance.employee_id == emp.id)
    elif employee_id:
        query = query.filter(Attendance.employee_id == employee_id)

    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)

    query = query.order_by(Attendance.date.desc())
    records = query.all()

    result = []
    for att in records:
        emp = db.query(Employee).filter(Employee.id == att.employee_id).first()
        emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
        dept_name = emp.department.name if emp and emp.department else "N/A"
        result.append({
            "id": att.id,
            "employee_id": att.employee_id,
            "employee_name": emp_name,
            "department_name": dept_name,
            "date": att.date,
            "check_in": att.check_in,
            "check_out": att.check_out,
            "working_hours": att.working_hours,
            "status": att.status
        })
    return result

@router.get("/stats")
def get_attendance_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    total_employees = db.query(Employee).count()
    today_records = db.query(Attendance).filter(Attendance.date == today).all()

    present_count = sum(1 for r in today_records if r.status in [AttendanceStatus.PRESENT.value, AttendanceStatus.LATE.value])
    late_count = sum(1 for r in today_records if r.status == AttendanceStatus.LATE.value)
    absent_count = max(0, total_employees - present_count)

    return {
        "total_employees": total_employees,
        "present_today": present_count,
        "late_today": late_count,
        "absent_today": absent_count,
        "attendance_rate": round((present_count / total_employees * 100) if total_employees > 0 else 0, 1)
    }
