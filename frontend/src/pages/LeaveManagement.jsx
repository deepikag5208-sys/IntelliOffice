import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { CalendarDays, Plus, CheckCircle, XCircle, Clock, Filter, MessageSquare, AlertCircle } from 'lucide-react';

const LeaveManagement = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({ total_requests: 0, pending: 0, approved: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Apply Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leave_type: 'Casual Leave',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  // Action Modal (Approve/Reject)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState('Approved');
  const [remarks, setRemarks] = useState('');

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      let url = `/leaves?`;
      if (statusFilter) url += `status_filter=${statusFilter}`;

      const [listRes, statsRes] = await Promise.all([
        API.get(url),
        API.get('/leaves/stats')
      ]);

      setLeaves(listRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/leaves', applyForm);
      setIsApplyModalOpen(false);
      setApplyForm({ leave_type: 'Casual Leave', start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], reason: '' });
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.detail || "Apply leave failed");
    }
  };

  const handleOpenAction = (leave, type) => {
    setSelectedLeave(leave);
    setActionType(type);
    setRemarks('');
    setIsActionModalOpen(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/leaves/${selectedLeave.id}/action`, {
        status: actionType,
        remarks: remarks
      });
      setIsActionModalOpen(false);
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.detail || "Action failed");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 pb-12 animate-fade-in-up">
      <Header title="LEAVE MANAGEMENT" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl glass-card border border-blue-500/20">
            <span className="text-xs text-slate-400 font-semibold block uppercase">Total Requests</span>
            <span className="text-xl font-extrabold text-white mt-1 block">{stats.total_requests}</span>
          </div>
          <div className="p-4 rounded-2xl glass-card border border-amber-500/20">
            <span className="text-xs text-amber-400 font-semibold block uppercase">Pending Approval</span>
            <span className="text-xl font-extrabold text-amber-400 mt-1 block">{stats.pending}</span>
          </div>
          <div className="p-4 rounded-2xl glass-card border border-emerald-500/20">
            <span className="text-xs text-emerald-400 font-semibold block uppercase">Approved Leaves</span>
            <span className="text-xl font-extrabold text-emerald-400 mt-1 block">{stats.approved}</span>
          </div>
          <div className="p-4 rounded-2xl glass-card border border-rose-500/20">
            <span className="text-xs text-rose-400 font-semibold block uppercase">Rejected Leaves</span>
            <span className="text-xl font-extrabold text-rose-400 mt-1 block">{stats.rejected}</span>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-xl glass-input text-xs font-medium bg-slate-900 text-white border-slate-700"
            >
              <option value="">All Leave Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>

        {/* Leaves Table */}
        <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-500">No leave requests found.</td>
                  </tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-white">{leave.employee_name}</td>
                      <td className="p-3 text-slate-400">{leave.department_name}</td>
                      <td className="p-3 font-medium text-blue-300">{leave.leave_type}</td>
                      <td className="p-3 text-slate-300">
                        {leave.start_date} <span className="text-slate-500">to</span> {leave.end_date}
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          leave.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          leave.status === 'Rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {leave.status === 'Pending' && (user?.role === 'admin' || user?.role === 'manager') ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenAction(leave, 'Approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[11px] font-bold border border-emerald-500/30 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenAction(leave, 'Rejected')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-[11px] font-bold border border-rose-500/30 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {leave.remarks || leave.approver_name ? `${leave.remarks || 'No remarks'} (${leave.approver_name || 'System'})` : '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Apply Leave Modal */}
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title="Apply for Leave"
        >
          <form onSubmit={handleApplySubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-300 mb-1">Leave Type</label>
              <select
                value={applyForm.leave_type}
                onChange={(e) => setApplyForm({ ...applyForm, leave_type: e.target.value })}
                className="w-full p-2.5 rounded-xl glass-input bg-slate-900"
              >
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Annual Leave">Annual Leave</option>
                <option value="Paid Leave">Paid Leave</option>
                <option value="Maternity/Paternity Leave">Maternity/Paternity Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={applyForm.start_date}
                  onChange={(e) => setApplyForm({ ...applyForm, start_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={applyForm.end_date}
                  onChange={(e) => setApplyForm({ ...applyForm, end_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Reason for Leave</label>
              <textarea
                required
                rows={3}
                value={applyForm.reason}
                onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                placeholder="State your reason for leave application..."
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                Submit Application
              </button>
            </div>
          </form>
        </Modal>

        {/* Action Modal (Approve/Reject) */}
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title={`Confirm ${actionType} Leave`}
        >
          <form onSubmit={handleActionSubmit} className="space-y-4 text-xs font-medium">
            <p className="text-slate-300">
              You are about to set status to <span className={`font-bold ${actionType === 'Approved' ? 'text-emerald-400' : 'text-rose-400'}`}>{actionType}</span> for leave request by <span className="text-white font-bold">{selectedLeave?.employee_name}</span>.
            </p>

            <div>
              <label className="block text-slate-300 mb-1">Manager Remarks / Comments</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks (e.g. Approved. Get well soon)..."
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsActionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-5 py-2 rounded-xl font-bold text-white ${
                  actionType === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirm {actionType}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default LeaveManagement;
