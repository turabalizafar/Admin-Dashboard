import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Media from './pages/Media';
import Devices from './pages/Devices';
import Playlists from './pages/Playlists';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="devices" element={<Devices />} />
              <Route path="media" element={<Media />} />
              <Route path="playlists" element={<Playlists />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
