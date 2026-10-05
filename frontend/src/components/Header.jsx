import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Bot, Sparkles, User, ShieldCheck } from 'lucide-react';

const Header = ({ title = "Dashboard" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'New Leave Request', desc: 'David Miller requested 3 days Casual Leave', time: '10m ago' },
    { id: 2, title: 'Upcoming Meeting', desc: 'Weekly Sprint Planning starts in 30 mins', time: '25m ago' },
    { id: 3, title: 'Urgent Announcement', desc: 'Flexible Working Hours Policy 2026 published', time: '1h ago' }
  ];

  return (
    <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white tracking-tight font-sans">{title}</h1>
        {user && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            {user.role.toUpperCase()} MODE
          </span>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4">
        {/* Global AI Quick Launcher */}
        <button
          onClick={() => navigate('/ai-assistant')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 border border-indigo-400/30 transition-all transform hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="hidden md:inline">Ask AI Assistant</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all duration-200 group relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5 group-hover:animate-bell-ring" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-slate-900 animate-ping"></span>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-slate-900"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl glass-card p-4 shadow-2xl z-50 animate-scale-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 mb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold animate-pulse">3 New</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 hover:translate-x-0.5 transition-all border border-slate-700/30">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-white">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        {user && (
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-slate-800/60 transition-all transform hover:scale-105"
          >
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/40"
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-400">{user.designation}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
