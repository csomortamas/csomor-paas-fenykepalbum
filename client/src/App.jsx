import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Toolbar from './components/Toolbar';
import PhotoList from './components/PhotoList';
import AuthModal from './components/AuthModal';
import UploadModal from './components/UploadModal';
import PhotoModal from './components/PhotoModal';
import './App.css';

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [user, setUser] = useState(null);
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPhotos = async (targetPage = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await axios.get('/api/photos', {
        params: {
          sort,
          page: targetPage,
          limit: 20
        }
      });
      const items = res.data?.items || [];
      const pagination = res.data?.pagination || {};

      setPhotos((prev) => (append ? [...prev, ...items] : items));
      setPage(pagination.page || targetPage);
      setHasMore(Boolean(pagination.hasMore));
    } catch (err) {
      console.error(err);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const checkUser = async () => {
    try {
      const res = await axios.get('/api/user');
      setUser(res.data.user);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { checkUser(); }, []);
  useEffect(() => {
    setPhotos([]);
    setPage(1);
    setHasMore(false);
    loadPhotos(1, false);
  }, [sort]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    loadPhotos(page + 1, true);
  };

  const openPhoto = async (id) => {
    try {
      const res = await axios.get(`/api/photos/${id}`);
      setSelectedPhoto(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await axios.post('/api/logout');
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={user} onLogout={handleLogout} onShowAuth={() => setShowAuth(true)} />
      <Toolbar sort={sort} setSort={setSort} user={user} onShowUpload={() => setShowUpload(true)} />
      <PhotoList
        photos={photos}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        user={user}
        onOpenPhoto={openPhoto}
        onShowUpload={() => setShowUpload(true)}
        onLoadMore={handleLoadMore}
      />

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onAuth={(u) => setUser(u)} />
      )}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={() => loadPhotos(1, false)} />
      )}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          user={user}
          onDeleted={() => loadPhotos(1, false)}
        />
      )}
    </div>
  );
}