import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, LogOut, LayoutDashboard } from 'lucide-react';
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
    <header className="fixed top-0 w-full z-50 glass border-b border-stone-200/50 h-20 flex items-center" data-testid="main-header">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group" data-testid="logo-link">
          <div className="bg-primary rounded-xl p-2.5 shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all duration-300">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">CabLib</span>
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
                  onClick={() => navigate(user.user_type === 'locataire' ? '/dashboard-locataire' : '/dashboard-proprietaire')}
                  data-testid="dashboard-menu-item"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Tableau de bord</span>
                </DropdownMenuItem>
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