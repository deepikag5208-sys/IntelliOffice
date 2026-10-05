import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { Megaphone, Plus, Bell, Trash2, Calendar, UserCheck } from 'lucide-react';

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'Normal'
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await API.get('/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/announcements', form);
      setIsModalOpen(false);
      setForm({ title: '', content: '', priority: 'Normal' });
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.detail || "Broadcast failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this announcement?")) {
      try {
        await API.delete(`/announcements/${id}`);
        fetchAnnouncements();
      } catch (err) {
        alert(err.response?.data?.detail || "Delete failed");
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 pb-12 animate-fade-in-up">
      <Header title="OFFICE ANNOUNCEMENTS & NOTICES" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Controls Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
            <Bell className="w-4 h-4 text-rose-400" />
            <span>Corporate Announcements Stream (Newest First)</span>
          </div>

          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Announcement</span>
            </button>
          )}
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading announcements stream...</div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">No announcements broadcasted yet.</div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <div key={a.id} className="p-6 rounded-3xl glass-card border border-slate-800 hover:border-slate-700 transition-all space-y-3 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase border ${
                      a.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                      a.priority === 'Important' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}>
                      {a.priority}
                    </span>

                    <h3 className="text-base font-bold text-white tracking-tight">{a.title}</h3>
                  </div>

                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <button onClick={() => handleDelete(a.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">{a.content}</p>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Posted by <strong className="text-slate-200">{a.author_name}</strong></span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Corporate Announcement"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-300 mb-1">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Notice headline..."
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Priority Level</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full p-2.5 rounded-xl glass-input bg-slate-900"
              >
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Notice Content</label>
              <textarea
                required
                rows={5}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write full announcement details..."
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
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Broadcast Announcement
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default Announcements;
