import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Header from '../components/Header';
import { BarChart3, Download, Printer, Filter, Users, CalendarCheck, CalendarDays, CheckSquare } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    try {
      const res = await API.get('/employees/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      let url = `/reports/summary?`;
      if (selectedDept) url += `department_id=${selectedDept}&`;
      if (startDate) url += `start_date=${startDate}&`;
      if (endDate) url += `end_date=${endDate}&`;

      const res = await API.get(url);
      setReport(res.data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedDept, startDate, endDate]);

  const exportCSV = () => {
    if (!report) return;
    const csvRows = [
      ["Metric Category", "Metric Name", "Value"],
      ["Employees", "Total Count", report.employee_count],
      ["Attendance", "Total Log Records", report.attendance.total_records],
      ["Attendance", "Present", report.attendance.present],
      ["Attendance", "Late", report.attendance.late],
      ["Attendance", "Absent", report.attendance.absent],
      ["Leaves", "Total Requests", report.leaves.total_requests],
      ["Leaves", "Approved", report.leaves.approved],
      ["Leaves", "Pending", report.leaves.pending],
      ["Tasks", "Total Tasks", report.tasks.total_tasks],
      ["Tasks", "Completed", report.tasks.completed]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Office_Management_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#rose-500'];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 pb-12 animate-fade-in-up">
      <Header title="EXECUTIVE REPORTS & ANALYTICS" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-slate-800">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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

            {/* Date Filters */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="py-1.5 px-3 rounded-xl glass-input text-xs font-medium"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="py-1.5 px-3 rounded-xl glass-input text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={exportCSV}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {loading || !report ? (
          <div className="py-12 text-center text-slate-400 text-xs">Generating report data...</div>
        ) : (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl glass-card border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Total Headcount</span>
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-white mt-2">{report.employee_count}</h3>
                <span className="text-[11px] text-blue-400 font-semibold mt-1 block">Active Workforce</span>
              </div>

              <div className="p-5 rounded-2xl glass-card border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Attendance Rate</span>
                  <CalendarCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-2">{report.attendance.rate}%</h3>
                <span className="text-[11px] text-slate-400 font-semibold mt-1 block">{report.attendance.present} Present Logged</span>
              </div>

              <div className="p-5 rounded-2xl glass-card border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Pending Leave Requests</span>
                  <CalendarDays className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-amber-400 mt-2">{report.leaves.pending}</h3>
                <span className="text-[11px] text-slate-400 font-semibold mt-1 block">Out of {report.leaves.total_requests} Total Requests</span>
              </div>

              <div className="p-5 rounded-2xl glass-card border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Task Completion</span>
                  <CheckSquare className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-purple-400 mt-2">{report.tasks.completion_rate}%</h3>
                <span className="text-[11px] text-slate-400 font-semibold mt-1 block">{report.tasks.completed} Completed Tasks</span>
              </div>
            </div>

            {/* Department Headcount Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-3xl glass-card border border-slate-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Department Distribution</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.department_distribution}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Attendance Breakdown */}
              <div className="p-5 rounded-3xl glass-card border border-slate-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Attendance Log Statuses</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Present', value: report.attendance.present, color: '#10b981' },
                          { name: 'Late', value: report.attendance.late, color: '#f59e0b' },
                          { name: 'Absent', value: report.attendance.absent, color: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Present', color: '#10b981' },
                          { name: 'Late', color: '#f59e0b' },
                          { name: 'Absent', color: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;
