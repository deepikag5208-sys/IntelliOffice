from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

# Employee Schemas
class EmployeeBase(BaseModel):
    employee_code: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: str
    role: str
    joining_date: date

class EmployeeCreate(EmployeeBase):
    email: str
    password: str

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

class EmployeeOut(EmployeeBase):
    id: int
    user_id: int
    status: str
    email: str
    department_name: Optional[str] = None
    avatar: Optional[str] = None

    class Config:
        from_attributes = True

# User Schemas
class UserOut(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    employee: Optional[EmployeeOut] = None

    class Config:
        from_attributes = True

# Attendance Schemas
class CheckInRequest(BaseModel):
    pass

class AttendanceOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    department_name: Optional[str] = None
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    working_hours: str
    status: str

    class Config:
        from_attributes = True

# Leave Schemas
class LeaveCreate(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: str

class LeaveAction(BaseModel):
    status: str  # Approved or Rejected
    remarks: Optional[str] = None

class LeaveOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    department_name: Optional[str] = None
    leave_type: str
    start_date: date
    end_date: date
    reason: str
    status: str
    approved_by_id: Optional[int] = None
    approver_name: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Task Schemas
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to_id: int
    priority: str
    due_date: date

class TaskUpdateStatus(BaseModel):
    status: str

class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    assigned_to_id: int
    assigned_to_name: Optional[str] = None
    assigned_by_id: int
    assigned_by_name: Optional[str] = None
    priority: str
    status: str
    due_date: date
    created_at: datetime

    class Config:
        from_attributes = True

# Meeting Schemas
class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    meeting_date: date
    start_time: str
    end_time: str
    location_or_link: str
    participant_ids: List[int]

class MeetingOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    meeting_date: date
    start_time: str
    end_time: str
    location_or_link: str
    created_by_id: int
    creator_name: Optional[str] = None
    participants: List[EmployeeOut] = []
    created_at: datetime

    class Config:
        from_attributes = True

# Announcement Schemas
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: str = "Normal"

class AnnouncementOut(BaseModel):
    id: int
    title: str
    content: str
    priority: str
    author_id: int
    author_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Document Schemas
class DocumentOut(BaseModel):
    id: int
    title: str
    category: str
    file_path: str
    file_size: str
    file_type: Optional[str] = None
    uploaded_by_id: int
    uploader_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# AI Assistant Schemas
class AIChatRequest(BaseModel):
    message: str

class AIChatResponse(BaseModel):
    response: str
    context_used: Optional[str] = None
