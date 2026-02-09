import React from 'react';
import { Header } from '../components/Header';
import { User, Mail, Briefcase, Shield } from 'lucide-react';

export default function ProfilePage({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-stone-50" data-testid="profile-page">
      <Header user={user} onLogout={onLogout} />

      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">Mon profil</h1>
            <p className="text-lg text-muted-foreground">Informations sur votre compte</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
              <div className="bg-primary/10 rounded-full p-6">
                <User className="h-16 w-16 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-foreground" data-testid="user-name">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-lg text-muted-foreground" data-testid="user-profession">{user.profession}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-secondary/30 rounded-xl p-3">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                  <p className="text-lg text-foreground" data-testid="user-email">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-secondary/30 rounded-xl p-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Numéro RPPS</p>
                  <p className="text-lg text-foreground" data-testid="user-rpps">{user.rpps_number}</p>
                  <p className="text-sm text-green-600 mt-1">✓ Certifié</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-secondary/30 rounded-xl p-3">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Type de compte</p>
                  <p className="text-lg text-foreground capitalize" data-testid="user-type">{user.user_type}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
