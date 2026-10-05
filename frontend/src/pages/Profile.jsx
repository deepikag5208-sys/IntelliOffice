import React, { useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Building, Phone, Calendar, Key, CheckCircle } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 pb-12 animate-fade-in-up">
      <Header title="USER PROFILE & ACCOUNT" />

      <main className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Profile Card Header */}
        <div className="p-8 rounded-3xl glass-card border border-slate-800 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2563eb&color=fff`}
            alt={user?.name}
            className="w-24 h-24 rounded-3xl object-cover ring-4 ring-blue-500/30 shadow-2xl"
          />

          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h2 className="text-xl font-extrabold text-white">{user?.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-extrabold uppercase border border-blue-500/30">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{user?.designation}</p>
            <p className="text-xs text-blue-300 font-semibold">{user?.department} Department</p>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
              Personal Information
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-blue-400" /> Email</span>
                <span className="text-white font-semibold">{user?.email}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-blue-400" /> Employee Code</span>
                <span className="text-blue-400 font-bold">{user?.employee_code || 'EMP-001'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2"><Building className="w-3.5 h-3.5 text-blue-400" /> Department</span>
                <span className="text-white font-semibold">{user?.department}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
              Security & Credentials
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
              }}
              className="space-y-3 text-xs"
            >
              {success && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Password security updated successfully!
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
