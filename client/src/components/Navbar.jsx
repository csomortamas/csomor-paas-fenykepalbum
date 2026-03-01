import React from 'react';

export default function Navbar({ user, onLogout, onShowAuth }) {
  return (
    <nav className="border-b border-stone-200 sticky top-0 z-30 bg-stone-50/80 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <span className="text-sm tracking-wide text-stone-500 font-light">
          fényképalbum
        </span>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-xs text-stone-500">{user}</span>
              <button
                onClick={onLogout}
                className="text-xs text-stone-500 hover:text-stone-700 transition cursor-pointer bg-transparent border-none underline underline-offset-2"
              >
                kilépés
              </button>
            </>
          ) : (
            <button
              onClick={onShowAuth}
              className="text-xs text-stone-500 hover:text-stone-700 transition cursor-pointer bg-transparent border-none underline underline-offset-2"
            >
              belépés
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
