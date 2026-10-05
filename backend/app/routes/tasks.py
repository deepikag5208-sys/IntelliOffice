from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Employee, Task, TaskStatus, TaskPriority, UserRole
from app.schemas import TaskCreate, TaskUpdateStatus, TaskOut
from app.auth import get_current_user, get_current_employee, require_roles

router = APIRouter(prefix="/tasks", tags=["Task Management"])

@router.post("", response_model=TaskOut)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value, UserRole.MANAGER.value]))
):
    creator_emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not creator_emp:
        raise HTTPException(status_code=400, detail="Creator employee profile not found")

    assignee_emp = db.query(Employee).filter(Employee.id == task_data.assigned_to_id).first()
    if not assignee_emp:
        raise HTTPException(status_code=404, detail="Assigned employee not found")

    task = Task(
        title=task_data.title,
        description=task_data.description,
        assigned_to_id=task_data.assigned_to_id,
        assigned_by_id=creator_emp.id,
        priority=task_data.priority,
        status=TaskStatus.TODO.value,
        due_date=task_data.due_date
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "assigned_to_id": task.assigned_to_id,
        "assigned_to_name": f"{assignee_emp.first_name} {assignee_emp.last_name}",
        "assigned_by_id": task.assigned_by_id,
        "assigned_by_name": f"{creator_emp.first_name} {creator_emp.last_name}",
        "priority": task.priority,
        "status": task.status,
        "due_date": task.due_date,
        "created_at": task.created_at
    }

@router.get("", response_model=List[TaskOut])
def list_tasks(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    assigned_to_me: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Task)
    current_emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    if current_user.role == UserRole.EMPLOYEE.value or assigned_to_me:
        if current_emp:
            query = query.filter(Task.assigned_to_id == current_emp.id)

    if status_filter:
        query = query.filter(Task.status == status_filter)

    if priority_filter:
        query = query.filter(Task.priority == priority_filter)

    query = query.order_by(Task.due_date.asc())
    tasks = query.all()

    result = []
    for t in tasks:
        assignee = db.query(Employee).filter(Employee.id == t.assigned_to_id).first()
        creator = db.query(Employee).filter(Employee.id == t.assigned_by_id).first()

        result.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "assigned_to_id": t.assigned_to_id,
            "assigned_to_name": f"{assignee.first_name} {assignee.last_name}" if assignee else "Unknown",
            "assigned_by_id": t.assigned_by_id,
            "assigned_by_name": f"{creator.first_name} {creator.last_name}" if creator else "System",
            "priority": t.priority,
            "status": t.status,
            "due_date": t.due_date,
            "created_at": t.created_at
        })
    return result

@router.put("/{task_id}/status", response_model=TaskOut)
def update_task_status(
    task_id: int,
    status_update: TaskUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    current_emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    # Permission check: Employees can update status of tasks assigned to them
    if current_user.role == UserRole.EMPLOYEE.value:
        if not current_emp or task.assigned_to_id != current_emp.id:
            raise HTTPException(status_code=403, detail="You can only update tasks assigned to you")

    if status_update.status not in [TaskStatus.TODO.value, TaskStatus.IN_PROGRESS.value, TaskStatus.COMPLETED.value]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    task.status = status_update.status
    db.commit()
    db.refresh(task)

    assignee = db.query(Employee).filter(Employee.id == task.assigned_to_id).first()
    creator = db.query(Employee).filter(Employee.id == task.assigned_by_id).first()

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "assigned_to_id": task.assigned_to_id,
        "assigned_to_name": f"{assignee.first_name} {assignee.last_name}" if assignee else "Unknown",
        "assigned_by_id": task.assigned_by_id,
        "assigned_by_name": f"{creator.first_name} {creator.last_name}" if creator else "System",
        "priority": task.priority,
        "status": task.status,
        "due_date": task.due_date,
        "created_at": task.created_at
    }

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value, UserRole.MANAGER.value]))
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}

@router.get("/stats")
def get_task_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Task)
    current_emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    if current_user.role == UserRole.EMPLOYEE.value and current_emp:
        query = query.filter(Task.assigned_to_id == current_emp.id)

    total = query.count()
    todo = query.filter(Task.status == TaskStatus.TODO.value).count()
    in_progress = query.filter(Task.status == TaskStatus.IN_PROGRESS.value).count()
    completed = query.filter(Task.status == TaskStatus.COMPLETED.value).count()

    return {
        "total_tasks": total,
        "todo": todo,
        "in_progress": in_progress,
        "completed": completed,
        "completion_rate": round((completed / total * 100) if total > 0 else 0, 1)
    }
