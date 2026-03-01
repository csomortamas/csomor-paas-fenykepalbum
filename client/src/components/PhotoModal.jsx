import React, { useState } from 'react';
import axios from 'axios';
import { formatDate } from '../utils';

export default function PhotoModal({ photo, onClose, user, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('biztosan törlöd?')) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/photos/${photo.id}`);
      onDeleted();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'hiba a törléskor');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-50 border border-stone-200 rounded-lg w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-stone-100 flex items-center justify-center" style={{ maxHeight: '60vh' }}>
          <img
            src={`data:image/jpeg;base64,${photo.image_data}`}
            alt={photo.name}
            className="max-w-full max-h-[55vh] object-contain"
          />
        </div>

        <div className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-sm text-stone-700">{photo.name}</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {formatDate(photo.upload_date)}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {user && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-red-400 hover:text-red-600 transition cursor-pointer bg-transparent border-none disabled:opacity-40 underline underline-offset-2"
              >
                {deleting ? '...' : 'törlés'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs text-stone-500 hover:text-stone-700 transition cursor-pointer bg-transparent border-none underline underline-offset-2"
            >
              bezárás
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
