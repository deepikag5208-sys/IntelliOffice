import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { CheckSquare, Plus, Clock, User, AlertCircle, LayoutGrid, List as ListIcon, Trash2 } from 'lucide-react';

const TaskManagement = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigned_to_id: '',
    priority: 'Medium',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = `/tasks?`;
      if (statusFilter) url += `status_filter=${statusFilter}&`;
      if (priorityFilter) url += `priority_filter=${priorityFilter}&`;

      const res = await API.get(url);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/employees');
      setEmployees(res.data);
      if (res.data.length > 0) {
        setTaskForm(prev => ({ ...prev, assigned_to_id: res.data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load employee list:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, [statusFilter, priorityFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/tasks', {
        ...taskForm,
        assigned_to_id: parseInt(taskForm.assigned_to_id)
      });
      setIsModalOpen(false);
      setTaskForm({
        title: '', description: '', assigned_to_id: employees[0]?.id || '',
        priority: 'Medium', due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
      });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.detail || "Create task failed");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await API.put(`/tasks/${taskId}/status`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.detail || "Status update failed");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Delete this task assignment?")) {
      try {
        await API.delete(`/tasks/${taskId}`);
        fetchTasks();
      } catch (err) {
        alert(err.response?.data?.detail || "Delete task failed");
      }
    }
  };

  const columns = [
    { title: 'To Do', status: 'To Do', color: 'border-amber-500/30 text-amber-400 bg-amber-500/10' },
    { title: 'In Progress', status: 'In Progress', color: 'border-blue-500/30 text-blue-400 bg-blue-500/10' },
    { title: 'Completed', status: 'Completed', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 pb-12 animate-fade-in-up">
      <Header title="TASK MANAGEMENT & DEPLOYMENT" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Board</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>

            {/* Filters */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-2 px-3 rounded-xl glass-input text-xs font-medium bg-slate-900 text-white border-slate-700"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </select>
          </div>

          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Task</span>
            </button>
          )}
        </div>

        {/* Kanban Board View */}
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((col) => {
              const colTasks = tasks.filter(t => t.status === col.status);
              return (
                <div key={col.status} className="p-4 rounded-3xl glass-card border border-slate-800 flex flex-col space-y-4 min-h-[500px]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase border ${col.color}`}>
                      {col.title} ({colTasks.length})
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {colTasks.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs italic">No tasks in {col.title}</div>
                    ) : (
                      colTasks.map((t) => (
                        <div key={t.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-lg">
                          <div className="flex items-start justify-between">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                              t.priority === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              t.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {t.priority}
                            </span>

                            {(user?.role === 'admin' || user?.role === 'manager') && (
                              <button onClick={() => handleDeleteTask(t.id)} className="text-slate-500 hover:text-rose-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-white">{t.title}</h4>
                            {t.description && <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{t.description}</p>}
                          </div>

                          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <User className="w-3.5 h-3.5 text-blue-400" />
                              <span className="font-semibold">{t.assigned_to_name}</span>
                            </div>

                            <div className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{t.due_date}</span>
                            </div>
                          </div>

                          {/* Quick Status Shift Controls */}
                          <div className="pt-2 flex gap-1">
                            {col.status !== 'To Do' && (
                              <button
                                onClick={() => handleStatusChange(t.id, 'To Do')}
                                className="flex-1 py-1 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
                              >
                                ← To Do
                              </button>
                            )}
                            {col.status !== 'In Progress' && (
                              <button
                                onClick={() => handleStatusChange(t.id, 'In Progress')}
                                className="flex-1 py-1 rounded-lg bg-blue-600/20 text-[10px] font-bold text-blue-300 hover:bg-blue-600 hover:text-white"
                              >
                                In Progress
                              </button>
                            )}
                            {col.status !== 'Completed' && (
                              <button
                                onClick={() => handleStatusChange(t.id, 'Completed')}
                                className="flex-1 py-1 rounded-lg bg-emerald-600/20 text-[10px] font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white"
                              >
                                Completed ✓
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="p-6 rounded-3xl glass-card border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Task Title</th>
                    <th className="p-3">Assigned To</th>
                    <th className="p-3">Assigned By</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-white">{t.title}</td>
                      <td className="p-3 text-slate-300">{t.assigned_to_name}</td>
                      <td className="p-3 text-slate-400">{t.assigned_by_name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.priority === 'High' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{t.due_date}</td>
                      <td className="p-3">
                        <select
                          value={t.status}
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                          className="py-1 px-2 rounded-lg bg-slate-900 text-xs font-semibold text-white border border-slate-700"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                          <button onClick={() => handleDeleteTask(t.id)} className="text-slate-500 hover:text-rose-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Task Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Task Assignment"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-300 mb-1">Task Title</label>
              <input
                type="text"
                required
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="e.g. Implement OAuth2 Refresh Tokens"
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Provide detailed instructions..."
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Assign To Employee</label>
                <select
                  required
                  value={taskForm.assigned_to_id}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_to_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input bg-slate-900"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.designation})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Priority Level</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input bg-slate-900"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Due Deadline</label>
              <input
                type="date"
                required
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                Assign Task
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default TaskManagement;
