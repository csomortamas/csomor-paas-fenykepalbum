import React, { useState, useRef } from 'react';
import axios from 'axios';

export default function UploadModal({ onClose, onUploaded }) {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('válassz ki egy képet');
    if (!name.trim()) return setError('add meg a kép nevét');
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', name.trim().substring(0, 40));
      await axios.post('/api/upload', formData);
      onUploaded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'hiba a feltöltéskor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-50 border border-stone-200 rounded-lg w-full max-w-sm p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-normal text-stone-600 mb-6 text-center">feltöltés</h2>

        {error && (
          <div className="text-xs text-red-400 text-center mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition bg-white"
              placeholder="kép neve (max 40 karakter)"
              required
              autoFocus
            />
            <span className="text-[10px] text-stone-400 mt-1 block text-right">{name.length}/40</span>
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-stone-200 file:text-stone-700 hover:file:bg-stone-300 file:cursor-pointer file:transition"
            />
          </div>

          {preview && (
            <div className="flex justify-center">
              <img
                src={preview}
                alt="előnézet"
                className="max-h-36 rounded border border-stone-200 object-contain"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs py-2.5 rounded transition disabled:opacity-40 cursor-pointer border-none"
          >
            {loading ? '...' : 'feltöltés'}
          </button>
        </form>

        <div className="text-center mt-3">
          <button
            onClick={onClose}
            className="text-xs text-stone-400 hover:text-stone-600 transition bg-transparent border-none cursor-pointer underline underline-offset-2"
          >
            mégse
          </button>
        </div>
      </div>
    </div>
  );
}
