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
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPhotos = async () => {
    try {
      const res = await axios.get(`/api/photos?sort=${sort}`);
      setPhotos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
  useEffect(() => { loadPhotos(); }, [sort]);

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
        user={user}
        onOpenPhoto={openPhoto}
        onShowUpload={() => setShowUpload(true)}
      />

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onAuth={(u) => setUser(u)} />
      )}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={loadPhotos} />
      )}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          user={user}
          onDeleted={loadPhotos}
        />
      )}
    </div>
  );
}