from sqlalchemy.orm import Session
from datetime import date, datetime
import requests
import json
import logging
from app.config import settings
from app.models import User, Employee, Department, Attendance, LeaveRequest, Task, Meeting, Announcement, Document, UserRole

logger = logging.getLogger("ai_service")

class OfficeAIService:
    @staticmethod
    def get_role_context(db: Session, current_user: User, user_message: str) -> dict:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        user_name = f"{emp.first_name} {emp.last_name}" if emp else current_user.email
        user_role = current_user.role

        msg_lower = user_message.lower()
        context_data = {
            "user_name": user_name,
            "user_role": user_role,
            "current_date": str(date.today()),
            "details": []
        }

        # 1. Tasks context
        if any(k in msg_lower for k in ["task", "todo", "in progress", "assigned"]):
            task_query = db.query(Task)
            if user_role == UserRole.EMPLOYEE.value and emp:
                task_query = task_query.filter(Task.assigned_to_id == emp.id)
            
            tasks = task_query.all()
            task_summary = []
            for t in tasks:
                assignee = db.query(Employee).filter(Employee.id == t.assigned_to_id).first()
                task_summary.append(
                    f"Task ID {t.id}: '{t.title}' | Status: {t.status} | Priority: {t.priority} | Due: {t.due_date} | Assigned to: {assignee.first_name if assignee else 'Unknown'}"
                )
            context_data["details"].append("TASKS:\n" + ("\n".join(task_summary) if task_summary else "No tasks found."))

        # 2. Leave context
        if any(k in msg_lower for k in ["leave", "vacation", "off", "holiday"]):
            leave_query = db.query(LeaveRequest)
            if user_role == UserRole.EMPLOYEE.value and emp:
                leave_query = leave_query.filter(LeaveRequest.employee_id == emp.id)
            
            leaves = leave_query.order_by(LeaveRequest.created_at.desc()).limit(10).all()
            leave_summary = []
            for l in leaves:
                le_emp = db.query(Employee).filter(Employee.id == l.employee_id).first()
                leave_summary.append(
                    f"Leave ID {l.id}: Employee {le_emp.first_name if le_emp else ''} | Type: {l.leave_type} | {l.start_date} to {l.end_date} | Status: {l.status} | Reason: {l.reason}"
                )
            context_data["details"].append("LEAVE REQUESTS:\n" + ("\n".join(leave_summary) if leave_summary else "No leave records found."))

        # 3. Attendance context
        if any(k in msg_lower for k in ["attendance", "check in", "present", "absent", "late"]):
            today = date.today()
            if user_role == UserRole.EMPLOYEE.value and emp:
                att_records = db.query(Attendance).filter(Attendance.employee_id == emp.id).order_by(Attendance.date.desc()).limit(10).all()
                att_summary = [f"Date: {a.date} | CheckIn: {a.check_in.strftime('%H:%M') if a.check_in else 'N/A'} | Hours: {a.working_hours} | Status: {a.status}" for a in att_records]
                context_data["details"].append(f"MY ATTENDANCE (Recent):\n" + ("\n".join(att_summary) if att_summary else "No recent attendance records."))
            else:
                today_atts = db.query(Attendance).filter(Attendance.date == today).all()
                total_emps = db.query(Employee).count()
                present_cnt = sum(1 for a in today_atts if a.status in ["Present", "Late"])
                context_data["details"].append(f"COMPANY ATTENDANCE TODAY ({today}): Total Employees: {total_emps}, Present Today: {present_cnt}, Absent: {total_emps - present_cnt}")

        # 4. Meetings context
        if any(k in msg_lower for k in ["meeting", "schedule", "call"]):
            meetings = db.query(Meeting).filter(Meeting.meeting_date >= date.today()).order_by(Meeting.meeting_date.asc()).limit(5).all()
            m_summary = [f"Title: '{m.title}' | Date: {m.meeting_date} | Time: {m.start_time}-{m.end_time} | Location/Link: {m.location_or_link}" for m in meetings]
            context_data["details"].append("UPCOMING MEETINGS:\n" + ("\n".join(m_summary) if m_summary else "No upcoming meetings scheduled."))

        # 5. Announcements context
        if any(k in msg_lower for k in ["announcement", "notice", "news", "update"]):
            announcements = db.query(Announcement).order_by(Announcement.created_at.desc()).limit(5).all()
            a_summary = [f"[{a.priority.upper()}] '{a.title}': {a.content} (Posted: {a.created_at.strftime('%Y-%m-%d')})" for a in announcements]
            context_data["details"].append("RECENT ANNOUNCEMENTS:\n" + ("\n".join(a_summary) if a_summary else "No announcements posted."))

        # 6. Employees / Headcount context (Admins & Managers)
        if any(k in msg_lower for k in ["employee", "staff", "who is", "team", "department", "headcount"]):
            if user_role in [UserRole.ADMIN.value, UserRole.MANAGER.value]:
                employees = db.query(Employee).all()
                e_summary = [f"{e.first_name} {e.last_name} ({e.employee_code}) - {e.designation} in {e.department.name if e.department else 'N/A'}" for e in employees[:15]]
                context_data["details"].append("EMPLOYEE DIRECTORY:\n" + "\n".join(e_summary))
            else:
                context_data["details"].append("SECURITY RESTRICTION: Confidential employee directory access is restricted to Admins and Managers.")

        # Default fallback summary if no specific keyword matched
        if not context_data["details"]:
            total_emps = db.query(Employee).count()
            open_tasks = db.query(Task).filter(Task.status != "Completed").count()
            pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "Pending").count()
            context_data["details"].append(
                f"OVERALL SUMMARY: Total Employees: {total_emps}, Open Tasks: {open_tasks}, Pending Leave Requests: {pending_leaves}"
            )

        return context_data

    @classmethod
    def generate_ai_response(cls, db: Session, current_user: User, user_message: str) -> tuple[str, str]:
        context_data = cls.get_role_context(db, current_user, user_message)
        context_str = "\n\n".join(context_data["details"])

        system_prompt = f"""You are the intelligent Office AI Assistant for our company's Office Management System.
You answer questions clearly, professionally, and concisely using retrieved real-time database context.
User Name: {context_data['user_name']}
User Role: {context_data['user_role']}
Current Date: {context_data['current_date']}

Strict Rules:
1. Always respect security and role permissions. If user asks for info beyond their role level, state access boundaries politely.
2. Be helpful, direct, formatted with markdown bullet points if listing multiple items.
"""

        # Check if Gemini API key exists
        if settings.GEMINI_API_KEY:
            try:
                # Call Gemini API via HTTP REST or SDK
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                headers = {"Content-Type": "application/json"}
                prompt_content = f"{system_prompt}\n\nRETRIEVED DATABASE CONTEXT:\n{context_str}\n\nUSER QUESTION: {user_message}"
                payload = {
                    "contents": [{"parts": [{"text": prompt_content}]}]
                }
                res = requests.post(url, json=payload, headers=headers, timeout=10)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"], context_str
            except Exception as e:
                logger.warning(f"Gemini API request failed, switching to local RAG synthesis engine: {e}")

        # Local RAG Synthesis Fallback Engine
        msg_lower = user_message.lower()
        if "pending task" in msg_lower or "my task" in msg_lower or "tasks" in msg_lower:
            ans = f"Hello **{context_data['user_name']}**, here is the task information retrieved from the system database:\n\n"
            ans += context_str
        elif "leave" in msg_lower:
            ans = f"Here is the leave information for **{context_data['user_name']}** ({context_data['user_role'].capitalize()}):\n\n"
            ans += context_str
        elif "attendance" in msg_lower:
            ans = f"Attendance summary record:\n\n"
            ans += context_str
        elif "meeting" in msg_lower:
            ans = f"Here are the upcoming scheduled office meetings:\n\n"
            ans += context_str
        elif "announcement" in msg_lower or "notice" in msg_lower:
            ans = f"Latest corporate notices & office announcements:\n\n"
            ans += context_str
        elif any(k in msg_lower for k in ["who", "employee", "team", "staff"]):
            ans = f"Employee directory context:\n\n"
            ans += context_str
        else:
            ans = f"Hello **{context_data['user_name']}**! I am your AI Office Assistant. Here is your current office summary:\n\n"
            ans += context_str + "\n\n*Feel free to ask me specifically about your pending tasks, attendance, leave balance, scheduled meetings, or announcements!*"

        return ans, context_str
