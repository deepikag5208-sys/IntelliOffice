import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Header from '../components/Header';
import { CalendarCheck, Clock, CheckCircle, AlertTriangle, LogIn, LogOut, History, Calendar } from 'lucide-react';

const Attendance = () => {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total_employees: 0, present_today: 0, late_today: 0, absent_today: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const [todayRes, histRes, statsRes] = await Promise.all([
        API.get('/attendance/today'),
        API.get('/attendance/history'),
        API.get('/attendance/stats')
      ]);

      setTodayAttendance(todayRes.data);
      setHistory(histRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Attendance data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      await API.post('/attendance/check-in');
      fetchAttendanceData();
    } catch (err) {
      alert(err.response?.data?.detail || "Check-in failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      await API.post('/attendance/check-out');
      fetchAttendanceData();
    } catch (err) {
      alert(err.response?.data?.detail || "Check-out failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 pb-12 animate-fade-in-up">
      <Header title="ATTENDANCE MANAGEMENT" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Attendance Action & Live Status Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Check-In / Check-Out Widget */}
          <div className="md:col-span-2 p-6 rounded-3xl glass-card border border-slate-800 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Daily Time Punch</span>
                <h2 className="text-xl font-extrabold text-white mt-1">Today's Office Presence</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              {todayAttendance && (
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                  todayAttendance.status === 'Present' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  todayAttendance.status === 'Late' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  STATUS: {todayAttendance.status.toUpperCase()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 my-6 text-center">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">CHECK IN</span>
                <span className="text-sm font-extrabold text-white mt-1 block">
                  {todayAttendance?.check_in ? new Date(todayAttendance.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">CHECK OUT</span>
                <span className="text-sm font-extrabold text-white mt-1 block">
                  {todayAttendance?.check_out ? new Date(todayAttendance.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">WORKING HOURS</span>
                <span className="text-sm font-extrabold text-blue-400 mt-1 block">
                  {todayAttendance?.working_hours || '0h 0m'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCheckIn}
                disabled={actionLoading || (todayAttendance && todayAttendance.check_in)}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>{todayAttendance?.check_in ? 'Checked In' : 'Check In Now'}</span>
              </button>

              <button
                onClick={handleCheckOut}
                disabled={actionLoading || !todayAttendance?.check_in || todayAttendance?.check_out}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>{todayAttendance?.check_out ? 'Checked Out' : 'Check Out'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Summary */}
          <div className="p-6 rounded-3xl glass-card border border-slate-800 flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Attendance Overview</h3>

            <div className="space-y-4 my-2">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-300 font-semibold">Total Employees</span>
                <span className="text-sm font-extrabold text-white">{stats.total_employees}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-emerald-400 font-semibold">Present Today</span>
                <span className="text-sm font-extrabold text-emerald-400">{stats.present_today}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-amber-400 font-semibold">Late Arrivals</span>
                <span className="text-sm font-extrabold text-amber-400">{stats.late_today}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
              <span className="text-[11px] font-bold text-blue-300">
                Attendance Rate: {stats.attendance_rate || 100}%
              </span>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Attendance Logs & History</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Check In</th>
                  <th className="p-3">Check Out</th>
                  <th className="p-3">Working Hours</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-500">No attendance logs available.</td>
                  </tr>
                ) : (
                  history.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-white">{record.employee_name}</td>
                      <td className="p-3 text-slate-400">{record.department_name}</td>
                      <td className="p-3 text-slate-300">{record.date}</td>
                      <td className="p-3 text-emerald-400">
                        {record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="p-3 text-rose-400">
                        {record.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="p-3 text-blue-400 font-medium">{record.working_hours}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          record.status === 'Present' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          record.status === 'Late' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Attendance;
