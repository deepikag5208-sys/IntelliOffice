import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, CalendarCheck, CalendarDays, CheckSquare, 
  Video, Megaphone, FileText, BarChart3, Bot, User, Settings, LogOut, ChevronLeft, ChevronRight, Building2
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
    { title: 'Employees', path: '/employees', icon: Users, roles: ['admin', 'manager'] },
    { title: 'Attendance', path: '/attendance', icon: CalendarCheck, roles: ['admin', 'manager', 'employee'] },
    { title: 'Leave Management', path: '/leaves', icon: CalendarDays, roles: ['admin', 'manager', 'employee'] },
    { title: 'Tasks', path: '/tasks', icon: CheckSquare, roles: ['admin', 'manager', 'employee'] },
    { title: 'Meetings', path: '/meetings', icon: Video, roles: ['admin', 'manager', 'employee'] },
    { title: 'Announcements', path: '/announcements', icon: Megaphone, roles: ['admin', 'manager', 'employee'] },
    { title: 'Documents', path: '/documents', icon: FileText, roles: ['admin', 'manager', 'employee'] },
    { title: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { title: 'AI Assistant', path: '/ai-assistant', icon: Bot, roles: ['admin', 'manager', 'employee'], badge: 'AI' },
    { title: 'Profile', path: '/profile', icon: User, roles: ['admin', 'manager', 'employee'] },
    { title: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'manager', 'employee'] },
  ];

  const filteredItems = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className={`relative glass-panel border-r border-slate-800 transition-all duration-300 flex flex-col z-20 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-wide text-white font-sans flex items-center gap-1.5">
                OfficeGen <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">Enterprise OS</span>
            </div>
          )}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User Badge */}
      {!collapsed && user && (
        <div className="p-3 mx-3 my-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
          <img 
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`} 
            alt={user.name} 
            className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/30"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">{user.name}</span>
            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">{user.role}</span>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 group relative ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30 scale-[1.02]' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 hover:translate-x-1'
              }`
            }

          >
            <item.icon className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-115 group-hover:rotate-6" />
            {!collapsed && <span className="truncate">{item.title}</span>}
            {item.badge && !collapsed && (
              <span className="ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout Action */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
