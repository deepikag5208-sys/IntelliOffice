import os
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.models import (
    User, Employee, Department, Attendance, LeaveRequest, Task, 
    Meeting, MeetingParticipant, Announcement, Document, 
    UserRole, TaskPriority, TaskStatus, LeaveStatus, LeaveType, 
    AttendanceStatus, AnnouncementPriority, DocumentCategory
)
from app.auth import get_password_hash

def seed_database(db: Session):
    # Check if database is already seeded
    if db.query(User).count() > 0:
        return

    print("Seeding initial database with demo records...")

    # 1. Departments
    dept_eng = Department(name="Engineering & IT", code="ENG", description="Software development & IT infrastructure")
    dept_hr = Department(name="Human Resources", code="HR", description="Employee relations, recruitment & policy")
    dept_mkt = Department(name="Marketing & Sales", code="MKT", description="Brand growth, client outreach & campaigns")
    dept_fin = Department(name="Finance & Accounts", code="FIN", description="Financial management & payroll processing")
    
    db.add_all([dept_eng, dept_hr, dept_mkt, dept_fin])
    db.flush()

    # 2. Users & Employees
    # Admin User
    user_admin = User(
        email="admin@office.com",
        hashed_password=get_password_hash("admin123"),
        role=UserRole.ADMIN.value
    )
    db.add(user_admin)
    db.flush()

    emp_admin = Employee(
        user_id=user_admin.id,
        employee_code="EMP-001",
        first_name="Alexander",
        last_name="Pierce",
        phone="+1 555-0101",
        department_id=dept_hr.id,
        designation="Chief Administrative Officer",
        role=UserRole.ADMIN.value,
        joining_date=date(2021, 1, 15),
        status="Active",
        avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
    )
    db.add(emp_admin)

    # Manager User
    user_manager = User(
        email="manager@office.com",
        hashed_password=get_password_hash("manager123"),
        role=UserRole.MANAGER.value
    )
    db.add(user_manager)
    db.flush()

    emp_manager = Employee(
        user_id=user_manager.id,
        employee_code="EMP-002",
        first_name="Sarah",
        last_name="Jenkins",
        phone="+1 555-0102",
        department_id=dept_eng.id,
        designation="Engineering Lead",
        role=UserRole.MANAGER.value,
        joining_date=date(2022, 3, 10),
        status="Active",
        avatar="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250"
    )
    db.add(emp_manager)

    # Employee Users
    employees_data = [
        ("employee@office.com", "employee123", "EMP-003", "David", "Miller", "+1 555-0103", dept_eng.id, "Full Stack Developer", UserRole.EMPLOYEE.value, date(2023, 5, 20), "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250"),
        ("priya.sharma@office.com", "priya123", "EMP-004", "Priya", "Sharma", "+1 555-0104", dept_mkt.id, "Senior Marketing Manager", UserRole.EMPLOYEE.value, date(2023, 8, 12), "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250"),
        ("robert.chen@office.com", "robert123", "EMP-005", "Robert", "Chen", "+1 555-0105", dept_fin.id, "Financial Analyst", UserRole.EMPLOYEE.value, date(2023, 11, 5), "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250"),
        ("emily.watson@office.com", "emily123", "EMP-006", "Emily", "Watson", "+1 555-0106", dept_hr.id, "HR Specialist", UserRole.EMPLOYEE.value, date(2024, 2, 1), "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250")
    ]

    emp_list = [emp_admin, emp_manager]

    for email, pwd, code, fname, lname, phone, dept_id, desig, role, join_d, av in employees_data:
        u = User(email=email, hashed_password=get_password_hash(pwd), role=role)
        db.add(u)
        db.flush()
        e = Employee(
            user_id=u.id, employee_code=code, first_name=fname, last_name=lname,
            phone=phone, department_id=dept_id, designation=desig, role=role,
            joining_date=join_d, status="Active", avatar=av
        )
        db.add(e)
        emp_list.append(e)

    db.flush()

    # 3. Attendance Records for past 7 days
    today = date.today()
    for i in range(7):
        att_date = today - timedelta(days=i)
        # Skip weekends
        if att_date.weekday() in [5, 6]:
            continue

        for emp in emp_list:
            status_val = AttendanceStatus.PRESENT.value if (emp.id + i) % 5 != 0 else AttendanceStatus.LATE.value
            in_time = datetime.combine(att_date, datetime.min.time()).replace(hour=9, minute=0 if status_val == AttendanceStatus.PRESENT.value else 45)
            out_time = datetime.combine(att_date, datetime.min.time()).replace(hour=17, minute=30)
            
            att = Attendance(
                employee_id=emp.id,
                date=att_date,
                check_in=in_time,
                check_out=out_time if att_date < today else None,
                working_hours="8h 30m" if att_date < today else "In Progress",
                status=status_val
            )
            db.add(att)

    # 4. Leave Requests
    leave1 = LeaveRequest(
        employee_id=emp_list[2].id, # David
        leave_type=LeaveType.CASUAL.value,
        start_date=today + timedelta(days=5),
        end_date=today + timedelta(days=7),
        reason="Attending family function in hometown",
        status=LeaveStatus.PENDING.value
    )
    leave2 = LeaveRequest(
        employee_id=emp_list[3].id, # Priya
        leave_type=LeaveType.SICK.value,
        start_date=today - timedelta(days=3),
        end_date=today - timedelta(days=2),
        reason="Fever and doctor rest advice",
        status=LeaveStatus.APPROVED.value,
        approved_by_id=emp_manager.id,
        remarks="Approved. Get well soon!"
    )
    leave3 = LeaveRequest(
        employee_id=emp_list[4].id, # Robert
        leave_type=LeaveType.ANNUAL.value,
        start_date=today + timedelta(days=12),
        end_date=today + timedelta(days=16),
        reason="Annual vacation trip",
        status=LeaveStatus.PENDING.value
    )
    db.add_all([leave1, leave2, leave3])

    # 5. Tasks
    task1 = Task(
        title="Migrate Backend API to FastAPI Async",
        description="Optimize database connection pooling and update route handlers for non-blocking I/O.",
        assigned_to_id=emp_list[2].id, # David
        assigned_by_id=emp_manager.id,
        priority=TaskPriority.HIGH.value,
        status=TaskStatus.IN_PROGRESS.value,
        due_date=today + timedelta(days=3)
    )
    task2 = Task(
        title="Q3 Financial Audit Preparation",
        description="Gather balance statements, vendor invoices, and tax compliance certificates.",
        assigned_to_id=emp_list[4].id, # Robert
        assigned_by_id=emp_admin.id,
        priority=TaskPriority.HIGH.value,
        status=TaskStatus.TODO.value,
        due_date=today + timedelta(days=5)
    )
    task3 = Task(
        title="Quarterly Employee Performance Survey",
        description="Design Google Forms questionnaire and distribute to all department leads.",
        assigned_to_id=emp_list[5].id, # Emily
        assigned_by_id=emp_admin.id,
        priority=TaskPriority.MEDIUM.value,
        status=TaskStatus.COMPLETED.value,
        due_date=today - timedelta(days=1)
    )
    task4 = Task(
        title="Launch Product Teaser Social Campaign",
        description="Prepare LinkedIn & Twitter creative banners for NextGen v2 product release.",
        assigned_to_id=emp_list[3].id, # Priya
        assigned_by_id=emp_manager.id,
        priority=TaskPriority.MEDIUM.value,
        status=TaskStatus.IN_PROGRESS.value,
        due_date=today + timedelta(days=4)
    )
    db.add_all([task1, task2, task3, task4])

    # 6. Meetings
    m1 = Meeting(
        title="Weekly Sprint Planning & Sync",
        description="Review engineering velocity, sprint deliverables, and resolve blockers.",
        meeting_date=today + timedelta(days=1),
        start_time="10:00 AM",
        end_time="11:00 AM",
        location_or_link="Conference Room A / https://meet.google.com/xyz-abc-def",
        created_by_id=emp_manager.id
    )
    m2 = Meeting(
        title="All Hands Quarterly Town Hall",
        description="CEO address on Q3 milestones, strategic direction, and team awards.",
        meeting_date=today + timedelta(days=4),
        start_time="02:00 PM",
        end_time="03:30 PM",
        location_or_link="Auditorium Main Hall",
        created_by_id=emp_admin.id
    )
    db.add_all([m1, m2])
    db.flush()

    p1 = MeetingParticipant(meeting_id=m1.id, employee_id=emp_list[2].id)
    p2 = MeetingParticipant(meeting_id=m1.id, employee_id=emp_manager.id)
    p3 = MeetingParticipant(meeting_id=m2.id, employee_id=emp_list[0].id)
    p4 = MeetingParticipant(meeting_id=m2.id, employee_id=emp_list[1].id)
    p5 = MeetingParticipant(meeting_id=m2.id, employee_id=emp_list[2].id)
    db.add_all([p1, p2, p3, p4, p5])

    # 7. Announcements
    a1 = Announcement(
        title="New Flexible Working Hours Policy 2026",
        content="We are excited to announce updated flexible working hours! Core office hours are now set between 10:00 AM to 4:00 PM with hybrid remote options.",
        priority=AnnouncementPriority.URGENT.value,
        author_id=emp_admin.id
    )
    a2 = Announcement(
        title="Annual Office Outing & Team Building Day",
        content="Join us this coming Friday for our annual retreat at Palm Grove Resort! Transportation and meals will be provided.",
        priority=AnnouncementPriority.IMPORTANT.value,
        author_id=emp_admin.id
    )
    a3 = Announcement(
        title="IT Infrastructure Security Update",
        content="Please ensure your workstation passwords are updated by end of this week. Mandatory 2FA is now enabled on all corporate email accounts.",
        priority=AnnouncementPriority.NORMAL.value,
        author_id=emp_manager.id
    )
    db.add_all([a1, a2, a3])

    # 8. Documents
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    dummy_doc_path = os.path.join(uploads_dir, "Employee_Handbook_2026.pdf")
    with open(dummy_doc_path, "w") as f:
        f.write("%PDF-1.4 Mock Employee Handbook Document Content")

    doc1 = Document(
        title="Employee Code of Conduct & HR Policy 2026",
        category=DocumentCategory.COMPANY_POLICIES.value,
        file_path=dummy_doc_path,
        file_size="1.4 MB",
        file_type="PDF",
        uploaded_by_id=emp_admin.id
    )
    doc2 = Document(
        title="IT & Cybersecurity Guidelines",
        category=DocumentCategory.HR_DOCUMENTS.value,
        file_path=dummy_doc_path,
        file_size="850 KB",
        file_type="PDF",
        uploaded_by_id=emp_admin.id
    )
    doc3 = Document(
        title="Q3 Strategy Meeting Deck",
        category=DocumentCategory.MEETING_DOCUMENTS.value,
        file_path=dummy_doc_path,
        file_size="3.2 MB",
        file_type="PPTX",
        uploaded_by_id=emp_manager.id
    )
    db.add_all([doc1, doc2, doc3])

    db.commit()
    print("Database seeding successfully completed!")
