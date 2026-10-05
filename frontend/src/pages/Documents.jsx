import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { FileText, Search, Plus, Download, Trash2, Filter, Folder, FileCheck } from 'lucide-react';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Company Policies');
  const [selectedFile, setSelectedFile] = useState(null);

  const categories = [
    'Company Policies',
    'HR Documents',
    'Meeting Documents',
    'Office Notices'
  ];

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let url = `/documents?`;
      if (category) url += `category=${category}&`;
      if (search) url += `search=${search}&`;

      const res = await API.get(url);
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [category, search]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('category', uploadCategory);
    formData.append('file', selectedFile);

    try {
      await API.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsModalOpen(false);
      setUploadTitle('');
      setSelectedFile(null);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed");
    }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const response = await API.get(`/documents/${docId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download file");
    }
  };

  const handleDelete = async (docId) => {
    if (window.confirm("Delete this document from catalog?")) {
      try {
        await API.delete(`/documents/${docId}`);
        fetchDocuments();
      } catch (err) {
        alert(err.response?.data?.detail || "Delete failed");
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 pb-12 animate-fade-in-up">
      <Header title="DOCUMENT MANAGEMENT CENTER" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-slate-800">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search document title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs font-medium"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="py-2 px-3 rounded-xl glass-input text-xs font-medium bg-slate-900 text-white border-slate-700"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          )}
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              category === '' ? 'bg-blue-600 text-white' : 'glass-card text-slate-400 hover:text-white'
            }`}
          >
            All Documents ({documents.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                category === c ? 'bg-blue-600 text-white' : 'glass-card text-slate-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading document repository...</div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">No documents uploaded.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div key={doc.id} className="p-5 rounded-2xl glass-card border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{doc.title}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold inline-block mt-1">
                          {doc.category}
                        </span>
                      </div>
                    </div>

                    {user?.role === 'admin' && (
                      <button onClick={() => handleDelete(doc.id)} className="text-slate-500 hover:text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Format: <strong>{doc.file_type}</strong></span>
                    <span>Size: <strong>{doc.file_size}</strong></span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">By {doc.uploader_name}</span>
                  <button
                    onClick={() => handleDownload(doc.id, `${doc.title}.${doc.file_type?.toLowerCase() || 'pdf'}`)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs border border-blue-500/30 flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Upload Corporate Document"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-300 mb-1">Document Title</label>
              <input
                type="text"
                required
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Employee Handbook 2026"
                className="w-full p-2.5 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Category</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input bg-slate-900"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Select File</label>
              <input
                type="file"
                required
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full p-2 rounded-xl glass-input text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white"
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
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                Upload File
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default Documents;
