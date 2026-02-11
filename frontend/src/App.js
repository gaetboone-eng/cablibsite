import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import LandingPage from './pages/LandingPage';
import SearchResults from './pages/SearchResults';
import ListingDetail from './pages/ListingDetail';
import AuthPage from './pages/AuthPage';
import DashboardLocataire from './pages/DashboardLocataire';
import DashboardProprietaire from './pages/DashboardProprietaire';
import ProfilePage from './pages/ProfilePage';
import CreateListing from './pages/CreateListing';
import AnalyticsPage from './pages/AnalyticsPage';
import AlertsPage from './pages/AlertsPage';
import { Toaster } from './components/ui/sonner';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cablib_token');
    const userData = localStorage.getItem('cablib_user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('cablib_token', token);
    localStorage.setItem('cablib_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('cablib_token');
    localStorage.removeItem('cablib_user');
    setUser(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage user={user} onLogout={handleLogout} />} />
          <Route path="/search" element={<SearchResults user={user} onLogout={handleLogout} />} />
          <Route path="/listing/:id" element={<ListingDetail user={user} onLogout={handleLogout} />} />
          <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage onLogin={handleLogin} />} />
          <Route 
            path="/dashboard-locataire" 
            element={user && user.user_type === 'locataire' ? <DashboardLocataire user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/dashboard-proprietaire" 
            element={user && user.user_type === 'proprietaire' ? <DashboardProprietaire user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/create-listing" 
            element={user && user.user_type === 'proprietaire' ? <CreateListing user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/analytics" 
            element={user && user.user_type === 'admin' ? <AnalyticsPage user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/alerts" 
            element={user && user.user_type === 'locataire' ? <AlertsPage user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
          <Route path="/profile" element={user ? <ProfilePage user={user} onLogout={handleLogout} /> : <Navigate to="/auth" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
