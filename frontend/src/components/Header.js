import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, LogOut, LayoutDashboard, BarChart3, Bell, MessageCircle, FileText, Menu, X, Shield, Users } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('cablib_token');
      const response = await axios.get(`${API}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'shadow-sm' 
          : ''
      }`} 
      style={{ 
        backgroundColor: scrolled ? 'rgba(245, 240, 230, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none'
      }}
      data-testid="main-header"
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
          <span className="logo-text text-3xl md:text-4xl">
            CabLib
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2 md:gap-4">
          {/* Search Link */}
          <Button 
            variant="ghost" 
            className="hidden md:flex rounded-full hover:bg-[#1A1F3D]/10"
            style={{ color: '#1A1F3D' }}
            onClick={() => navigate('/search')}
          >
            Explorer
          </Button>

          {user ? (
            <>
              {/* Messages Icon */}
              <Button 
                variant="ghost" 
                className="relative rounded-full hover:bg-[#1A1F3D]/10"
                onClick={() => navigate('/messages')}
                data-testid="messages-button"
              >
                <MessageCircle className="h-5 w-5" style={{ color: '#1A1F3D' }} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1A1F3D', color: '#F5F0E6' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="rounded-full gap-2 hover:bg-[#1A1F3D]/10" 
                    data-testid="user-menu-trigger"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: '#1A1F3D', color: '#F5F0E6' }}>
                      {user.first_name?.charAt(0)}
                    </div>
                    <span className="hidden md:inline" style={{ color: '#1A1F3D' }}>{user.first_name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2" style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }}>
                  <DropdownMenuItem 
                    onClick={() => navigate('/profile')} 
                    className="rounded-xl py-3 hover:bg-[#1A1F3D]/10"
                    data-testid="profile-menu-item"
                  >
                    <User className="mr-3 h-4 w-4" style={{ color: '#1A1F3D' }} />
                    <span style={{ color: '#1A1F3D' }}>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate(user.user_type === 'locataire' ? '/dashboard-locataire' : user.user_type === 'admin' ? '/analytics' : '/dashboard-proprietaire')}
                    className="rounded-xl py-3 hover:bg-[#1A1F3D]/10"
                    data-testid="dashboard-menu-item"
                  >
                    <LayoutDashboard className="mr-3 h-4 w-4" style={{ color: '#1A1F3D' }} />
                    <span style={{ color: '#1A1F3D' }}>Tableau de bord</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" style={{ backgroundColor: '#E8E0D5' }} />
                  <DropdownMenuItem 
                    onClick={() => navigate('/messages')} 
                    className="rounded-xl py-3 hover:bg-[#1A1F3D]/10"
                    data-testid="messages-menu-item"
                  >
                    <MessageCircle className="mr-3 h-4 w-4" style={{ color: '#1A1F3D' }} />
                    <span style={{ color: '#1A1F3D' }}>Messages</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1A1F3D', color: '#F5F0E6' }}>
                        {unreadCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate('/applications')} 
                    className="rounded-xl py-3 hover:bg-[#1A1F3D]/10"
                    data-testid="applications-menu-item"
                  >
                    <FileText className="mr-3 h-4 w-4" style={{ color: '#1A1F3D' }} />
                    <span style={{ color: '#1A1F3D' }}>Candidatures</span>
                  </DropdownMenuItem>
                  {user.user_type === 'proprietaire' && (
                    <DropdownMenuItem 
                      onClick={() => navigate('/owner-stats')} 
                      className="rounded-xl py-3 hover:bg-[#1A1F3D]/10"
                      data-testid="owner-stats-menu-item"
                    >
                      <BarChart3 className="mr-3 h-4 w-4" style={{ color: '#1A1F3D' }} />
                      <span style={{ color: '#1A1F3D' }}>Mes statistiques</span>
                    </DropdownMenuItem>
                  )}
                  {user.user_type === 'locataire' && (
                    <DropdownMenuItem 
                      onClick={() => navigate('/alerts')} 
                      className="rounded-xl py-3 hover:bg-[#1A1F3D]/10"
                      data-testid="alerts-menu-item"
                    >
                      <Bell className="mr-3 h-4 w-4" style={{ color: '#1A1F3D' }} />
                      <span style={{ color: '#1A1F3D' }}>Mes alertes</span>
                    </DropdownMenuItem>
                  )}
                  {user.user_type === 'admin' && (
                    <DropdownMenuItem 
                      onClick={() => navigate('/analytics')} 
                      className="rounded-xl py-3 hover:bg-[#1A1F3D]/10"
                      data-testid="analytics-menu-item"
                    >
                      <BarChart3 className="mr-3 h-4 w-4" style={{ color: '#1A1F3D' }} />
                      <span style={{ color: '#1A1F3D' }}>Analytics</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="my-2" style={{ backgroundColor: '#E8E0D5' }} />
                  <DropdownMenuItem 
                    onClick={onLogout} 
                    className="rounded-xl py-3 text-red-600 focus:text-red-600 hover:bg-red-50" 
                    data-testid="logout-menu-item"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              onClick={() => navigate('/auth')} 
              className="btn-navy rounded-full px-6 py-2 text-sm font-medium"
              data-testid="login-button"
            >
              Connexion
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};