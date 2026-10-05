from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Employee, LeaveRequest, LeaveStatus, UserRole
from app.schemas import LeaveCreate, LeaveAction, LeaveOut
from app.auth import get_current_user, get_current_employee, require_roles

router = APIRouter(prefix="/leaves", tags=["Leave Management"])

@router.post("", response_model=LeaveOut)
def apply_leave(
    leave_data: LeaveCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    if leave_data.end_date < leave_data.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than start date")

    leave = LeaveRequest(
        employee_id=current_employee.id,
        leave_type=leave_data.leave_type,
        start_date=leave_data.start_date,
        end_date=leave_data.end_date,
        reason=leave_data.reason,
        status=LeaveStatus.PENDING.value
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    dept_name = current_employee.department.name if current_employee.department else "N/A"
    return {
        "id": leave.id,
        "employee_id": leave.employee_id,
        "employee_name": f"{current_employee.first_name} {current_employee.last_name}",
        "department_name": dept_name,
        "leave_type": leave.leave_type,
        "start_date": leave.start_date,
        "end_date": leave.end_date,
        "reason": leave.reason,
        "status": leave.status,
        "approved_by_id": None,
        "approver_name": None,
        "remarks": None,
        "created_at": leave.created_at
    }

@router.get("", response_model=List[LeaveOut])
def list_leaves(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LeaveRequest)

    # Employees can only view their own leave requests
    if current_user.role == UserRole.EMPLOYEE.value:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if emp:
            query = query.filter(LeaveRequest.employee_id == emp.id)
    elif current_user.role == UserRole.MANAGER.value:
        # Managers view team leave requests or all
        pass

    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)

    query = query.order_by(LeaveRequest.created_at.desc())
    leaves = query.all()

    result = []
    for l in leaves:
        emp = db.query(Employee).filter(Employee.id == l.employee_id).first()
        emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
        dept_name = emp.department.name if emp and emp.department else "N/A"

        approver_name = None
        if l.approved_by_id:
            approver = db.query(Employee).filter(Employee.id == l.approved_by_id).first()
            if approver:
                approver_name = f"{approver.first_name} {approver.last_name}"

        result.append({
            "id": l.id,
            "employee_id": l.employee_id,
            "employee_name": emp_name,
            "department_name": dept_name,
            "leave_type": l.leave_type,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "reason": l.reason,
            "status": l.status,
            "approved_by_id": l.approved_by_id,
            "approver_name": approver_name,
            "remarks": l.remarks,
            "created_at": l.created_at
        })
    return result

@router.put("/{leave_id}/action", response_model=LeaveOut)
def take_leave_action(
    leave_id: int,
    action: LeaveAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value, UserRole.MANAGER.value]))
):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if action.status not in [LeaveStatus.APPROVED.value, LeaveStatus.REJECTED.value]:
        raise HTTPException(status_code=400, detail="Invalid status action. Must be Approved or Rejected.")

    approver_emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    leave.status = action.status
    leave.remarks = action.remarks
    if approver_emp:
        leave.approved_by_id = approver_emp.id

    db.commit()
    db.refresh(leave)

    emp = db.query(Employee).filter(Employee.id == leave.employee_id).first()
    emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
    dept_name = emp.department.name if emp and emp.department else "N/A"
    approver_name = f"{approver_emp.first_name} {approver_emp.last_name}" if approver_emp else None

    return {
        "id": leave.id,
        "employee_id": leave.employee_id,
        "employee_name": emp_name,
        "department_name": dept_name,
        "leave_type": leave.leave_type,
        "start_date": leave.start_date,
        "end_date": leave.end_date,
        "reason": leave.reason,
        "status": leave.status,
        "approved_by_id": leave.approved_by_id,
        "approver_name": approver_name,
        "remarks": leave.remarks,
        "created_at": leave.created_at
    }

@router.get("/stats")
def get_leave_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(LeaveRequest)
    if current_user.role == UserRole.EMPLOYEE.value:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if emp:
            query = query.filter(LeaveRequest.employee_id == emp.id)

    total_requests = query.count()
    pending = query.filter(LeaveRequest.status == LeaveStatus.PENDING.value).count()
    approved = query.filter(LeaveRequest.status == LeaveStatus.APPROVED.value).count()
    rejected = query.filter(LeaveRequest.status == LeaveStatus.REJECTED.value).count()

    return {
        "total_requests": total_requests,
        "pending": pending,
        "approved": approved,
        "rejected": rejected
    }
