from sqlalchemy import Column, Integer, String, Text, Date, Time, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"

class TaskPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class TaskStatus(str, enum.Enum):
    TODO = "To Do"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class LeaveStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class LeaveType(str, enum.Enum):
    CASUAL = "Casual Leave"
    SICK = "Sick Leave"
    ANNUAL = "Annual Leave"
    PAID = "Paid Leave"
    MATERNITY = "Maternity/Paternity Leave"

class AttendanceStatus(str, enum.Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LATE = "Late"
    HALF_DAY = "Half-Day"

class AnnouncementPriority(str, enum.Enum):
    NORMAL = "Normal"
    IMPORTANT = "Important"
    URGENT = "Urgent"

class DocumentCategory(str, enum.Enum):
    COMPANY_POLICIES = "Company Policies"
    HR_DOCUMENTS = "HR Documents"
    MEETING_DOCUMENTS = "Meeting Documents"
    OFFICE_NOTICES = "Office Notices"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.EMPLOYEE.value, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    employees = relationship("Employee", back_populates="department")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    designation = Column(String(100), nullable=False)
    role = Column(String(50), default=UserRole.EMPLOYEE.value, nullable=False)
    joining_date = Column(Date, nullable=False)
    status = Column(String(50), default="Active")
    avatar = Column(String(255), nullable=True)

    user = relationship("User", back_populates="employee")
    department = relationship("Department", back_populates="employees")
    attendances = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="employee", foreign_keys="LeaveRequest.employee_id", cascade="all, delete-orphan")
    assigned_tasks = relationship("Task", back_populates="assignee", foreign_keys="Task.assigned_to_id")
    created_tasks = relationship("Task", back_populates="creator", foreign_keys="Task.assigned_by_id")
    created_meetings = relationship("Meeting", back_populates="creator")
    meeting_participations = relationship("MeetingParticipant", back_populates="employee", cascade="all, delete-orphan")
    created_announcements = relationship("Announcement", back_populates="author")
    uploaded_documents = relationship("Document", back_populates="uploader")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    working_hours = Column(String(20), default="0h 0m")
    status = Column(String(50), default=AttendanceStatus.PRESENT.value)

    employee = relationship("Employee", back_populates="attendances")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default=LeaveStatus.PENDING.value)
    approved_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="leave_requests", foreign_keys=[employee_id])
    approver = relationship("Employee", foreign_keys=[approved_by_id])

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assigned_to_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    assigned_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    priority = Column(String(50), default=TaskPriority.MEDIUM.value)
    status = Column(String(50), default=TaskStatus.TODO.value)
    due_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    assignee = relationship("Employee", back_populates="assigned_tasks", foreign_keys=[assigned_to_id])
    creator = relationship("Employee", back_populates="created_tasks", foreign_keys=[assigned_by_id])

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    meeting_date = Column(Date, nullable=False)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    location_or_link = Column(String(255), nullable=False)
    created_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("Employee", back_populates="created_meetings")
    participants = relationship("MeetingParticipant", back_populates="meeting", cascade="all, delete-orphan")

class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)

    meeting = relationship("Meeting", back_populates="participants")
    employee = relationship("Employee", back_populates="meeting_participations")

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String(50), default=AnnouncementPriority.NORMAL.value)
    author_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("Employee", back_populates="created_announcements")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(String(50), nullable=False)
    file_type = Column(String(50), nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    uploader = relationship("Employee", back_populates="uploaded_documents")
