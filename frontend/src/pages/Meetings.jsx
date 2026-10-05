import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { Video, Plus, Clock, MapPin, Users, Calendar as CalendarIcon, Trash2, Link } from 'lucide-react';

const Meetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filterType, setFilterType] = useState('upcoming'); // 'upcoming' or 'past'
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    meeting_date: new Date().toISOString().split('T')[0],
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    location_or_link: 'Google Meet: https://meet.google.com/xyz-abc-def',
    participant_ids: []
  });

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/meetings?filter_type=${filterType}`);
      setMeetings(res.data);
    } catch (err) {
      console.error("Failed to load meetings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchEmployees();
  }, [filterType]);

  const handleToggleParticipant = (empId) => {
    setMeetingForm(prev => {
      const exists = prev.participant_ids.includes(empId);
      if (exists) {
        return { ...prev, participant_ids: prev.participant_ids.filter(id => id !== empId) };
      } else {
        return { ...prev, participant_ids: [...prev.participant_ids, empId] };
      }
    });
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (meetingForm.participant_ids.length === 0) {
      alert("Please select at least one participant");
      return;
    }

    try {
      await API.post('/meetings', meetingForm);
      setIsModalOpen(false);
      setMeetingForm({
        title: '', description: '', meeting_date: new Date().toISOString().split('T')[0],
        start_time: '10:00 AM', end_time: '11:00 AM',
        location_or_link: 'Google Meet: https://meet.google.com/xyz-abc-def',
        participant_ids: []
      });
      fetchMeetings();
    } catch (err) {
      alert(err.response?.data?.detail || "Schedule meeting failed");
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (window.confirm("Cancel this meeting?")) {
      try {
        await API.delete(`/meetings/${meetingId}`);
        fetchMeetings();
      } catch (err) {
        alert(err.response?.data?.detail || "Cancel meeting failed");
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 pb-12 animate-fade-in-up">
      <Header title="MEETING MANAGEMENT & SCHEDULING" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setFilterType('upcoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterType === 'upcoming' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Upcoming Meetings
            </button>
            <button
              onClick={() => setFilterType('past')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterType === 'past' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Past Archive
            </button>
          </div>

          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Meeting</span>
            </button>
          )}
        </div>

        {/* Meetings Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading meeting calendar...</div>
        ) : meetings.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">No {filterType} meetings found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((m) => (
              <div key={m.id} className="p-5 rounded-2xl glass-card border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{m.title}</h3>
                        <span className="text-[10px] text-slate-400 font-semibold">Organized by {m.creator_name}</span>
                      </div>
                    </div>

                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <button onClick={() => handleDeleteMeeting(m.id)} className="text-slate-500 hover:text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {m.description && <p className="text-xs text-slate-300 mt-3 line-clamp-2">{m.description}</p>}

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{m.meeting_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{m.start_time} - {m.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="truncate">{m.location_or_link}</span>
                    </div>
                  </div>

                  {/* Participants Avatars */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">Participants ({m.participants.length})</span>
                    <div className="flex items-center -space-x-2 overflow-hidden">
                      {m.participants.map((p) => (
                        <img
                          key={p.id}
                          src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.first_name)}&background=2563eb&color=fff`}
                          alt={p.first_name}
                          title={`${p.first_name} ${p.last_name}`}
                          className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-900"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3">
                  <a
                    href={m.location_or_link.includes('http') ? m.location_or_link.split(' ').find(w => w.startsWith('http')) : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white font-bold text-xs border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span>Join Online Meeting</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Schedule Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Schedule New Office Meeting"
        >
          <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-300 mb-1">Meeting Title</label>
              <input
                type="text"
                required
                value={meetingForm.title}
                onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                placeholder="e.g. Q3 Sprint Planning"
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Description / Agenda</label>
              <textarea
                rows={2}
                value={meetingForm.description}
                onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                placeholder="Meeting goals and agenda..."
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Meeting Date</label>
                <input
                  type="date"
                  required
                  value={meetingForm.meeting_date}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Start Time</label>
                <input
                  type="text"
                  required
                  value={meetingForm.start_time}
                  onChange={(e) => setMeetingForm({ ...meetingForm, start_time: e.target.value })}
                  placeholder="10:00 AM"
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">End Time</label>
                <input
                  type="text"
                  required
                  value={meetingForm.end_time}
                  onChange={(e) => setMeetingForm({ ...meetingForm, end_time: e.target.value })}
                  placeholder="11:00 AM"
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Location or Video Link</label>
              <input
                type="text"
                required
                value={meetingForm.location_or_link}
                onChange={(e) => setMeetingForm({ ...meetingForm, location_or_link: e.target.value })}
                placeholder="e.g. Conference Room A or https://meet.google.com/xyz"
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            {/* Participant Selection */}
            <div>
              <label className="block text-slate-300 mb-1.5">Select Participants</label>
              <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-900 border border-slate-800">
                {employees.map((e) => {
                  const selected = meetingForm.participant_ids.includes(e.id);
                  return (
                    <div
                      key={e.id}
                      onClick={() => handleToggleParticipant(e.id)}
                      className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        selected ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{e.first_name} {e.last_name} ({e.designation})</span>
                      <span className="text-[10px] font-bold">{selected ? '✓ Selected' : '+ Add'}</span>
                    </div>
                  );
                })}
              </div>
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
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
              >
                Schedule Meeting
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default Meetings;
