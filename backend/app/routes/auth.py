from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Employee
from app.schemas import LoginRequest, Token, UserOut
from app.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    # Support login by email OR employee code
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user:
        # Check if email field was actually an employee code
        employee = db.query(Employee).filter(Employee.employee_code == login_data.email).first()
        if employee:
            user = db.query(User).filter(User.id == employee.user_id).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/employee ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    employee = db.query(Employee).filter(Employee.user_id == user.id).first()
    access_token = create_access_token(data={"sub": user.email, "role": user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "employee_id": employee.id if employee else None,
            "employee_code": employee.employee_code if employee else None,
            "name": f"{employee.first_name} {employee.last_name}" if employee else user.email,
            "designation": employee.designation if employee else "System User",
            "department": employee.department.name if employee and employee.department else "N/A"
        }
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    emp_out = None
    if employee:
        emp_out = {
            "id": employee.id,
            "user_id": employee.user_id,
            "employee_code": employee.employee_code,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "phone": employee.phone,
            "department_id": employee.department_id,
            "department_name": employee.department.name if employee.department else None,
            "designation": employee.designation,
            "role": employee.role,
            "joining_date": employee.joining_date,
            "status": employee.status,
            "email": current_user.email,
            "avatar": employee.avatar
        }
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "employee": emp_out
    }
