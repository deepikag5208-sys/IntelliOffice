import React, { useState } from 'react';
import Header from '../components/Header';
import { Settings as SettingsIcon, Key, Bell, Shield, Database, CheckCircle, Sparkles } from 'lucide-react';

const Settings = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [saved, setSaved] = useState(false);

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 pb-12 animate-fade-in-up">
      <Header title="SYSTEM SETTINGS & CONFIGURATION" />

      <main className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Assistant Configuration</h3>
              <p className="text-xs text-slate-400">Configure Google Gemini API integration key for advanced generative answers</p>
            </div>
          </div>

          <form onSubmit={handleSaveApiKey} className="space-y-4 text-xs font-medium">
            {saved && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> AI configuration settings saved!
              </div>
            )}

            <div>
              <label className="block text-slate-300 mb-1">Google Gemini API Key (Optional)</label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                If left empty, OfficeGen AI automatically operates using its built-in database context analyzer RAG engine!
              </p>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg"
            >
              Save Configuration
            </button>
          </form>
        </div>

        {/* General System Information Card */}
        <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
            System & Security Status
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block font-semibold">AUTHENTICATION</span>
              <span className="text-emerald-400 font-bold mt-1 block">JWT Token Encryption (HS256)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block font-semibold">ROLE SECURITY</span>
              <span className="text-blue-400 font-bold mt-1 block">Admin, Manager, Employee RBAC</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block font-semibold">DATABASE ENGINE</span>
              <span className="text-purple-400 font-bold mt-1 block">SQLAlchemy ORM (SQLite / MySQL)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block font-semibold">AI RAG CONNECTOR</span>
              <span className="text-amber-400 font-bold mt-1 block">Active Dual-Engine Database Search</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
