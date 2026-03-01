import React from 'react';

export default function Toolbar({ sort, setSort, user, onShowUpload }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
      <div className="flex gap-1">
        <button
          onClick={() => setSort('name')}
          className={`px-3 py-1.5 text-xs rounded transition cursor-pointer border-none ${
            sort === 'name'
              ? 'bg-stone-800 text-stone-100'
              : 'bg-transparent text-stone-500 hover:text-stone-700 underline underline-offset-2'
          }`}
        >
          név
        </button>
        <button
          onClick={() => setSort('date')}
          className={`px-3 py-1.5 text-xs rounded transition cursor-pointer border-none ${
            sort === 'date'
              ? 'bg-stone-800 text-stone-100'
              : 'bg-transparent text-stone-500 hover:text-stone-700 underline underline-offset-2'
          }`}
        >
          dátum
        </button>
      </div>
      {user && (
        <button
          onClick={onShowUpload}
          className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-700 transition cursor-pointer bg-transparent border-none underline underline-offset-2"
        >
          + feltöltés
        </button>
      )}
    </div>
  );
}
