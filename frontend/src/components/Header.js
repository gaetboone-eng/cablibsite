import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, BarChart3, Bell } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();

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
                <DropdownMenuItem onClick={onLogout} className="text-destructive" data-testid="logout-menu-item">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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