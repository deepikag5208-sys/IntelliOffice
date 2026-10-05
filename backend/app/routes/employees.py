from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Employee, Department, UserRole
from app.schemas import EmployeeCreate, EmployeeUpdate, EmployeeOut, DepartmentOut, DepartmentCreate
from app.auth import get_current_user, require_roles, get_password_hash

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("/departments", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Department).all()

@router.post("/departments", response_model=DepartmentOut)
def create_department(
    dept_data: DepartmentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value]))
):
    existing = db.query(Department).filter(Department.name == dept_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name already exists")
    dept = Department(**dept_data.dict())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.get("", response_model=List[EmployeeOut])
def list_employees(
    department_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Employee)
    
    if department_id:
        query = query.filter(Employee.department_id == department_id)
        
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Employee.first_name.ilike(search_pattern)) |
            (Employee.last_name.ilike(search_pattern)) |
            (Employee.employee_code.ilike(search_pattern)) |
            (Employee.designation.ilike(search_pattern))
        )
        
    employees = query.all()
    result = []
    for emp in employees:
        user = db.query(User).filter(User.id == emp.user_id).first()
        result.append({
            "id": emp.id,
            "user_id": emp.user_id,
            "employee_code": emp.employee_code,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "phone": emp.phone,
            "department_id": emp.department_id,
            "department_name": emp.department.name if emp.department else "Unassigned",
            "designation": emp.designation,
            "role": emp.role,
            "joining_date": emp.joining_date,
            "status": emp.status,
            "email": user.email if user else "",
            "avatar": emp.avatar
        })
    return result

@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    user = db.query(User).filter(User.id == emp.user_id).first()
    return {
        "id": emp.id,
        "user_id": emp.user_id,
        "employee_code": emp.employee_code,
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "phone": emp.phone,
        "department_id": emp.department_id,
        "department_name": emp.department.name if emp.department else "Unassigned",
        "designation": emp.designation,
        "role": emp.role,
        "joining_date": emp.joining_date,
        "status": emp.status,
        "email": user.email if user else "",
        "avatar": emp.avatar
    }

@router.post("", response_model=EmployeeOut)
def create_employee(
    emp_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value]))
):
    # Check existing user email
    existing_user = db.query(User).filter(User.email == emp_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
        
    # Check existing code
    existing_code = db.query(Employee).filter(Employee.employee_code == emp_data.employee_code).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Employee code already in use")

    # Create user account
    user = User(
        email=emp_data.email,
        hashed_password=get_password_hash(emp_data.password),
        role=emp_data.role
    )
    db.add(user)
    db.flush()

    # Create employee profile
    employee = Employee(
        user_id=user.id,
        employee_code=emp_data.employee_code,
        first_name=emp_data.first_name,
        last_name=emp_data.last_name,
        phone=emp_data.phone,
        department_id=emp_data.department_id,
        designation=emp_data.designation,
        role=emp_data.role,
        joining_date=emp_data.joining_date,
        status="Active"
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    dept_name = employee.department.name if employee.department else None
    return {
        "id": employee.id,
        "user_id": employee.user_id,
        "employee_code": employee.employee_code,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "phone": employee.phone,
        "department_id": employee.department_id,
        "department_name": dept_name,
        "designation": employee.designation,
        "role": employee.role,
        "joining_date": employee.joining_date,
        "status": employee.status,
        "email": user.email,
        "avatar": employee.avatar
    }

@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int,
    emp_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value, UserRole.MANAGER.value]))
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_dict = emp_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(emp, key, value)

    # Sync role with user table if updated
    if emp_data.role:
        user = db.query(User).filter(User.id == emp.user_id).first()
        if user:
            user.role = emp_data.role

    db.commit()
    db.refresh(emp)

    user = db.query(User).filter(User.id == emp.user_id).first()
    return {
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
    }

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value]))
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    user = db.query(User).filter(User.id == emp.user_id).first()
    db.delete(emp)
    if user:
        db.delete(user)
    db.commit()
    return {"message": "Employee and user account deleted successfully"}
