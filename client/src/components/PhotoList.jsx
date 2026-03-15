import React from 'react';
import { formatDate } from '../utils';

export default function PhotoList({ photos, loading, loadingMore, hasMore, user, onOpenPhoto, onShowUpload, onLoadMore }) {
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center text-xs text-stone-400">
        betöltés...
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-xs text-stone-400 mb-3">még nincsenek képek</p>
        {user && (
          <button
            onClick={onShowUpload}
            className="text-xs text-stone-500 hover:text-stone-700 transition cursor-pointer bg-transparent border-none underline underline-offset-2"
          >
            tölts fel egyet
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pb-16">
      <div className="border-t border-stone-200">
        {photos.map((p) => (
          <div
            key={p.id}
            onClick={() => onOpenPhoto(p.id)}
            className="flex items-center justify-between py-3 px-2 border-b border-stone-100 hover:bg-stone-100/50 transition cursor-pointer group"
          >
            <span className="text-sm text-stone-700 group-hover:text-stone-900 transition truncate pr-4">
              {p.name}
            </span>
            <span className="text-xs text-stone-400 whitespace-nowrap flex-shrink-0">
              {formatDate(p.upload_date)}
            </span>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="pt-5 text-center">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-700 transition cursor-pointer bg-transparent border-none underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'betöltés...' : 'további képek'}
          </button>
        </div>
      )}
    </div>
  );
}
