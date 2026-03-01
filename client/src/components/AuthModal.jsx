import React, { useState } from 'react';
import axios from 'axios';

export default function AuthModal({ onClose, onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = isLogin ? '/api/login' : '/api/register';
      const res = await axios.post(url, { username, password });
      onAuth(res.data.username);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'hiba történt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-50 border border-stone-200 rounded-lg w-full max-w-sm p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-normal text-stone-600 mb-6 text-center">
          {isLogin ? 'belépés' : 'regisztráció'}
        </h2>

        {error && (
          <div className="text-xs text-red-400 text-center mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition bg-white"
              placeholder="felhasználónév"
              required
              autoFocus
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition bg-white"
              placeholder="jelszó"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs py-2.5 rounded transition disabled:opacity-40 cursor-pointer border-none"
          >
            {loading ? '...' : isLogin ? 'belépés' : 'regisztráció'}
          </button>
        </form>

        <div className="text-center mt-5">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs text-stone-500 hover:text-stone-700 transition bg-transparent border-none cursor-pointer underline underline-offset-2"
          >
            {isLogin ? 'nincs fiókod? regisztrálj' : 'van fiókod? lépj be'}
          </button>
        </div>

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
