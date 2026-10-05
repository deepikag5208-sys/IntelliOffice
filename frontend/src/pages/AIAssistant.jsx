import React, { useState, useRef, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { Bot, Send, Trash2, Sparkles, User, Database, ShieldAlert, CornerDownLeft } from 'lucide-react';

const AIAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello ${user?.name || 'there'}! I am your **Office AI Assistant**. Ask me anything about your pending tasks, attendance, leave balance, upcoming meetings, or office announcements in natural language.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "What are my pending tasks?",
    "How many leave days do I have?",
    "What meetings do I have today?",
    "Show my attendance this month.",
    "What are the latest announcements?",
    "Show pending leave requests."
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await API.post('/ai-assistant/query', { message: queryText });
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.data.response,
        context_used: res.data.context_used,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Sorry, I encountered an error retrieving data: ${err.response?.data?.detail || "Connection issue"}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        text: `Chat session reset. How can I assist you with office management today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-950 overflow-hidden animate-fade-in-up">
      <Header title="OFFICE AI ASSISTANT" />

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col h-[calc(100vh-4rem)]">
        {/* Chat Box Container */}
        <div className="flex-1 glass-card rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl relative">
          {/* Chat Header Bar */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 transform hover:rotate-6 transition-transform">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  Office AI Engine <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">RAG ACTIVE</span>
                </h3>
                <p className="text-[11px] text-slate-400">Role: <strong className="text-slate-200">{user?.role.toUpperCase()}</strong> • Real-time DB Context</p>
              </div>
            </div>

            <button
              onClick={handleClearChat}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-all flex items-center gap-1 text-xs font-semibold hover:scale-105"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl animate-scale-in ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                }`}>
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`p-4 rounded-2xl text-xs leading-relaxed transition-all ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20 font-medium'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none space-y-2 hover:border-slate-700'
                }`}>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div className={`text-[10px] ${m.sender === 'user' ? 'text-blue-200' : 'text-slate-500'} text-right mt-1`}>
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 text-xs text-slate-400 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-[11px] text-slate-400 ml-1">Analyzing database context...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompt Pills */}
          <div className="px-6 py-2 border-t border-slate-800/60 bg-slate-900/30 flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-blue-600/30 hover:border-blue-500/40 text-slate-300 text-[11px] font-medium border border-slate-700/60 transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about tasks, attendance, leave status, or office meetings..."
                className="flex-1 py-3 px-4 rounded-xl glass-input text-xs font-medium"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAssistant;
