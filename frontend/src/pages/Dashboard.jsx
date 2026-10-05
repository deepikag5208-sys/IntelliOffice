import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import { 
  Users, CalendarCheck, CalendarDays, CheckSquare, 
  Video, Megaphone, ArrowUpRight, Sparkles, Clock, AlertCircle, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    pendingTasks: 0,
    upcomingMeetings: 0,
    announcementsCount: 0
  });

  const [meetings, setMeetings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [attRes, leaveRes, taskRes, meetRes, annRes, empRes] = await Promise.all([
          API.get('/attendance/stats'),
          API.get('/leaves/stats'),
          API.get('/tasks/stats'),
          API.get('/meetings?filter_type=upcoming'),
          API.get('/announcements'),
          API.get('/employees')
        ]);

        setStats({
          totalEmployees: empRes.data.length,
          presentToday: attRes.data.present_today || 0,
          pendingLeaves: leaveRes.data.pending || 0,
          pendingTasks: (taskRes.data.todo || 0) + (taskRes.data.in_progress || 0),
          upcomingMeetings: meetRes.data.length,
          announcementsCount: annRes.data.length
        });

        setMeetings(meetRes.data.slice(0, 3));
        setAnnouncements(annRes.data.slice(0, 3));
        setTasks(taskRes.data.slice(0, 4));
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Visual Chart Colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const attendanceData = [
    { day: 'Mon', Present: 5, Late: 1, Absent: 0 },
    { day: 'Tue', Present: 6, Late: 0, Absent: 0 },
    { day: 'Wed', Present: 4, Late: 2, Absent: 0 },
    { day: 'Thu', Present: 5, Late: 1, Absent: 0 },
    { day: 'Fri', Present: 6, Late: 0, Absent: 0 }
  ];

  const taskProgressData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'To Do').length || 2, color: '#f59e0b' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length || 3, color: '#3b82f6' },
    { name: 'Completed', value: tasks.filter(t => t.status === 'Completed').length || 4, color: '#10b981' }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 pb-12 animate-fade-in-up">
      <Header title={`${user?.role.toUpperCase()} DASHBOARD`} />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="relative p-6 rounded-3xl glass-card border border-blue-500/20 bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-slate-900 overflow-hidden animate-scale-in">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
                  Welcome back, {user?.name}
                </span>
                <span className="text-xs text-slate-400">• {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">
                Officegen Intelligent Management Workspace
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Monitor live office attendance, track team task velocities, schedule board meetings, and consult your natural language AI Assistant.
              </p>
            </div>
            
            <button
              onClick={() => navigate('/ai-assistant')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 border border-blue-400/30 flex items-center gap-2 shrink-0 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Launch Office AI Chat</span>
            </button>
          </div>
        </div>

        {/* KPI Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Staff"
            value={stats.totalEmployees}
            subtext="Active Employees"
            icon={Users}
            color="blue"
            className="animate-fade-in-up stagger-1"
          />
          <StatCard
            title="Present Today"
            value={stats.presentToday}
            subtext={`${stats.totalEmployees ? Math.round((stats.presentToday/stats.totalEmployees)*100) : 0}% Attendance`}
            icon={CalendarCheck}
            color="emerald"
            className="animate-fade-in-up stagger-2"
          />
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaves}
            subtext="Requires Approval"
            icon={CalendarDays}
            color="amber"
            className="animate-fade-in-up stagger-3"
          />
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            subtext="Active Pipeline"
            icon={CheckSquare}
            color="purple"
            className="animate-fade-in-up stagger-4"
          />
          <StatCard
            title="Upcoming Meetings"
            value={stats.upcomingMeetings}
            subtext="Next 7 Days"
            icon={Video}
            color="cyan"
            className="animate-fade-in-up stagger-5"
          />
          <StatCard
            title="Announcements"
            value={stats.announcementsCount}
            subtext="Office Broadcasts"
            icon={Megaphone}
            color="rose"
            className="animate-fade-in-up stagger-6"
          />
        </div>

        {/* Charts & Graphs Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Overview Chart */}
          <div className="lg:col-span-2 p-5 rounded-2xl glass-card border border-slate-800 animate-fade-in-up stagger-4 hover:border-slate-700/80 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Attendance Statistics</h3>
                <p className="text-xs text-slate-400">Daily check-in breakdown across departments</p>
              </div>
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 animate-pulse">
                +94% Average
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} 
                  />
                  <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Distribution Donut Chart */}
          <div className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col justify-between animate-fade-in-up stagger-5 hover:border-slate-700/80 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Task Progress</h3>
                <button onClick={() => navigate('/tasks')} className="text-xs text-blue-400 hover:underline flex items-center gap-0.5 group">
                  View All <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-4">Status of currently assigned deliverables</p>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskProgressData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taskProgressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">TO DO</span>
                <span className="text-sm font-extrabold text-amber-400">{taskProgressData[0].value}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">IN PROGRESS</span>
                <span className="text-sm font-extrabold text-blue-400">{taskProgressData[1].value}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">COMPLETED</span>
                <span className="text-sm font-extrabold text-emerald-400">{taskProgressData[2].value}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Feeds Section: Meetings & Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up stagger-6">
          {/* Upcoming Meetings Card */}
          <div className="p-5 rounded-2xl glass-card border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upcoming Meetings</h3>
              </div>
              <button onClick={() => navigate('/meetings')} className="text-xs text-cyan-400 hover:underline">
                Schedule <ChevronRight className="w-3 h-3 inline" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {meetings.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No upcoming meetings scheduled.</p>
              ) : (
                meetings.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-between group">
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">{m.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {m.meeting_date} • {m.start_time} - {m.end_time}
                      </p>
                    </div>
                    <a
                      href={m.location_or_link.includes('http') ? m.location_or_link : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 border border-cyan-500/30 transition-all transform hover:scale-105"
                    >
                      Join Link
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Announcements Card */}
          <div className="p-5 rounded-2xl glass-card border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-rose-400 animate-bounce-subtle" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Announcements</h3>
              </div>
              <button onClick={() => navigate('/announcements')} className="text-xs text-rose-400 hover:underline">
                View All <ChevronRight className="w-3 h-3 inline" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {announcements.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No announcements posted.</p>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 hover:-translate-y-0.5 transition-all group">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        a.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {a.priority}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mt-1.5 group-hover:text-rose-300 transition-colors">{a.title}</h4>
                    <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">{a.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
