import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, LogOut, LayoutDashboard, BarChart3, Bell, MessageCircle, FileText } from 'lucide-react';
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

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll every 30 seconds
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
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-border h-20 flex items-center shadow-sm" data-testid="main-header">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
          <span className="text-3xl font-bold tracking-tight text-primary" style={{ fontFamily: 'Source Sans Pro, sans-serif', letterSpacing: '-0.02em' }}>
            CabLib
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              {/* Messages Icon */}
              <Button 
                variant="ghost" 
                className="relative rounded-full"
                onClick={() => navigate('/messages')}
                data-testid="messages-button"
              >
                <MessageCircle className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full gap-2" data-testid="user-menu-trigger">
                    <User className="h-4 w-4" />
                    <span>{user.first_name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="profile-menu-item">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate(user.user_type === 'locataire' ? '/dashboard-locataire' : user.user_type === 'admin' ? '/analytics' : '/dashboard-proprietaire')}
                    data-testid="dashboard-menu-item"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Tableau de bord</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/messages')} data-testid="messages-menu-item">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/applications')} data-testid="applications-menu-item">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Candidatures</span>
                  </DropdownMenuItem>
                  {user.user_type === 'locataire' && (
                    <DropdownMenuItem onClick={() => navigate('/alerts')} data-testid="alerts-menu-item">
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Mes alertes</span>
                    </DropdownMenuItem>
                  )}
                  {user.user_type === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/analytics')} data-testid="analytics-menu-item">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Analytics</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-destructive" data-testid="logout-menu-item">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              onClick={() => navigate('/auth')} 
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 shadow-lg shadow-primary/20"
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