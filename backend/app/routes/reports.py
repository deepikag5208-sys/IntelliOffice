from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.database import get_db
from app.models import User, Employee, Department, Attendance, LeaveRequest, Task, AttendanceStatus, LeaveStatus, TaskStatus
from app.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
def get_report_summary(
    department_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp_query = db.query(Employee)
    if department_id:
        emp_query = emp_query.filter(Employee.department_id == department_id)
    
    employees = emp_query.all()
    employee_ids = [e.id for e in employees]

    # Attendance Stats
    att_query = db.query(Attendance).filter(Attendance.employee_id.in_(employee_ids)) if employee_ids else db.query(Attendance)
    if start_date:
        att_query = att_query.filter(Attendance.date >= start_date)
    if end_date:
        att_query = att_query.filter(Attendance.date <= end_date)

    att_records = att_query.all()
    total_att = len(att_records)
    present_cnt = sum(1 for a in att_records if a.status in [AttendanceStatus.PRESENT.value, AttendanceStatus.LATE.value])
    late_cnt = sum(1 for a in att_records if a.status == AttendanceStatus.LATE.value)
    absent_cnt = sum(1 for a in att_records if a.status == AttendanceStatus.ABSENT.value)

    # Leave Stats
    leave_query = db.query(LeaveRequest).filter(LeaveRequest.employee_id.in_(employee_ids)) if employee_ids else db.query(LeaveRequest)
    if start_date:
        leave_query = leave_query.filter(LeaveRequest.start_date >= start_date)
    if end_date:
        leave_query = leave_query.filter(LeaveRequest.end_date <= end_date)

    leave_records = leave_query.all()
    pending_leaves = sum(1 for l in leave_records if l.status == LeaveStatus.PENDING.value)
    approved_leaves = sum(1 for l in leave_records if l.status == LeaveStatus.APPROVED.value)
    rejected_leaves = sum(1 for l in leave_records if l.status == LeaveStatus.REJECTED.value)

    # Task Stats
    task_query = db.query(Task).filter(Task.assigned_to_id.in_(employee_ids)) if employee_ids else db.query(Task)
    task_records = task_query.all()
    todo_tasks = sum(1 for t in task_records if t.status == TaskStatus.TODO.value)
    in_prog_tasks = sum(1 for t in task_records if t.status == TaskStatus.IN_PROGRESS.value)
    completed_tasks = sum(1 for t in task_records if t.status == TaskStatus.COMPLETED.value)

    # Department distribution
    departments = db.query(Department).all()
    dept_distribution = []
    for d in departments:
        cnt = db.query(Employee).filter(Employee.department_id == d.id).count()
        dept_distribution.append({"name": d.name, "count": cnt})

    return {
        "employee_count": len(employees),
        "attendance": {
            "total_records": total_att,
            "present": present_cnt,
            "late": late_cnt,
            "absent": absent_cnt,
            "rate": round((present_cnt / total_att * 100) if total_att > 0 else 0, 1)
        },
        "leaves": {
            "total_requests": len(leave_records),
            "pending": pending_leaves,
            "approved": approved_leaves,
            "rejected": rejected_leaves
        },
        "tasks": {
            "total_tasks": len(task_records),
            "todo": todo_tasks,
            "in_progress": in_prog_tasks,
            "completed": completed_tasks,
            "completion_rate": round((completed_tasks / len(task_records) * 100) if len(task_records) > 0 else 0, 1)
        },
        "department_distribution": dept_distribution
    }
