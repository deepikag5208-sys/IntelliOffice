import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { Users, Search, Plus, Filter, Edit, Trash2, Mail, Phone, Building, Briefcase, Calendar, Shield, CheckCircle } from 'lucide-react';

const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [formData, setFormData] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    password: 'password123',
    phone: '',
    department_id: '',
    designation: '',
    role: 'employee',
    joining_date: new Date().toISOString().split('T')[0]
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      let url = `/employees?`;
      if (selectedDept) url += `department_id=${selectedDept}&`;
      if (search) url += `search=${search}&`;

      const res = await API.get(url);
      setEmployees(res.data);
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await API.get('/employees/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [search, selectedDept]);

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setFormData({
      employee_code: `EMP-00${employees.length + 1}`,
      first_name: '',
      last_name: '',
      email: '',
      password: 'password123',
      phone: '',
      department_id: departments[0]?.id || '',
      designation: '',
      role: 'employee',
      joining_date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmp(emp);
    setFormData({
      employee_code: emp.employee_code,
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      password: '',
      phone: emp.phone || '',
      department_id: emp.department_id || '',
      designation: emp.designation,
      role: emp.role,
      joining_date: emp.joining_date
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmp) {
        await API.put(`/employees/${editingEmp.id}`, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          department_id: parseInt(formData.department_id),
          designation: formData.designation,
          role: formData.role
        });
      } else {
        await API.post('/employees', {
          ...formData,
          department_id: parseInt(formData.department_id)
        });
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.detail || "Operation failed");
    }
  };

  const handleDelete = async (empId) => {
    if (window.confirm("Are you sure you want to delete this employee account?")) {
      try {
        await API.delete(`/employees/${empId}`);
        fetchEmployees();
      } catch (err) {
        alert(err.response?.data?.detail || "Delete failed");
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 pb-12 animate-fade-in-up">
      <Header title="EMPLOYEE MANAGEMENT" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-slate-800 animate-scale-in">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, code or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs font-medium"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="py-2 px-3 rounded-xl glass-input text-xs font-medium bg-slate-900 text-white border-slate-700"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Employee Button (Admin Only) */}
          {user?.role === 'admin' && (
            <button
              onClick={handleOpenAdd}
              className="w-full md:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>

        {/* Employee Cards Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium animate-pulse">Loading employee directory...</div>
        ) : employees.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-medium">No employees found matching criteria.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp, index) => (
              <div key={emp.id} className={`p-5 rounded-2xl glass-card-hover border border-slate-800 flex flex-col justify-between group animate-fade-in-up stagger-${(index % 6) + 1}`}>
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.first_name + ' ' + emp.last_name)}&background=2563eb&color=fff`}
                        alt={emp.first_name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/30 group-hover:ring-blue-500/60 transition-all duration-300"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                          {emp.first_name} {emp.last_name}
                        </h3>
                        <span className="text-[11px] font-semibold text-slate-400 block">{emp.designation}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 inline-block mt-1">
                          {emp.employee_code}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      emp.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      emp.role === 'manager' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {emp.role}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{emp.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{emp.department_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Joined {emp.joining_date}</span>
                    </div>
                  </div>
                </div>

                {user?.role === 'admin' && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Edit Employee"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Delete Employee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal for Add / Edit */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingEmp ? "Edit Employee Details" : "Add New Employee"}
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Employee Code</label>
                <input
                  type="text"
                  required
                  disabled={!!editingEmp}
                  value={formData.employee_code}
                  onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input bg-slate-900"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>
            </div>

            {!editingEmp && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Department</label>
                <select
                  required
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input bg-slate-900"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Designation</label>
                <input
                  type="text"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Joining Date</label>
                <input
                  type="date"
                  required
                  value={formData.joining_date}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                Save Employee
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default Employees;
