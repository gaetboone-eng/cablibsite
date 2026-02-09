import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Mail, Lock, User, Briefcase, UserCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    rpps_number: '',
    profession: '',
    user_type: 'locataire'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? `${API}/auth/login` : `${API}/auth/register`;
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(endpoint, payload);
      const { access_token, user } = response.data;

      onLogin(access_token, user);
      toast.success(isLogin ? 'Connexion réussie !' : 'Compte créé avec succès !');
      
      // Small delay to ensure state is updated before redirect
      setTimeout(() => {
        // Redirect based on user type and action
        if (user.user_type === 'locataire') {
          navigate(isLogin ? '/search' : '/dashboard-locataire');
        } else {
          navigate('/dashboard-proprietaire');
        }
      }, 100);
    } catch (error) {
      const message = error.response?.data?.detail || 'Une erreur est survenue';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-emerald-50/50 flex items-center justify-center px-6 py-12" data-testid="auth-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-primary rounded-xl p-3 shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-foreground">CabLib</span>
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="text-muted-foreground">Réservé aux professionnels de santé</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5" data-testid="auth-form">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      className="rounded-xl mt-2"
                      data-testid="first-name-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      className="rounded-xl mt-2"
                      data-testid="last-name-input"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="rpps_number">Numéro RPPS</Label>
                  <Input
                    id="rpps_number"
                    name="rpps_number"
                    value={formData.rpps_number}
                    onChange={handleChange}
                    placeholder="11 chiffres"
                    maxLength="11"
                    required
                    className="rounded-xl mt-2"
                    data-testid="rpps-input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Format: 11 chiffres</p>
                </div>

                <div>
                  <Label htmlFor="profession">Profession</Label>
                  <Select 
                    value={formData.profession} 
                    onValueChange={(value) => setFormData({ ...formData, profession: value })}
                    required
                  >
                    <SelectTrigger id="profession" className="rounded-xl mt-2" data-testid="profession-select">
                      <SelectValue placeholder="Sélectionnez votre profession" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Médecin généraliste">Médecin généraliste</SelectItem>
                      <SelectItem value="Infirmier(ère)">Infirmier(ère)</SelectItem>
                      <SelectItem value="Kinésithérapeute">Kinésithérapeute</SelectItem>
                      <SelectItem value="Ostéopathe">Ostéopathe</SelectItem>
                      <SelectItem value="Psychologue">Psychologue</SelectItem>
                      <SelectItem value="Dentiste">Dentiste</SelectItem>
                      <SelectItem value="Sage-femme">Sage-femme</SelectItem>
                      <SelectItem value="Pharmacien">Pharmacien</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="user_type">Type de compte</Label>
                  <Select 
                    value={formData.user_type} 
                    onValueChange={(value) => setFormData({ ...formData, user_type: value })}
                  >
                    <SelectTrigger id="user_type" className="rounded-xl mt-2" data-testid="user-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="locataire">Locataire (je cherche un local)</SelectItem>
                      <SelectItem value="proprietaire">Propriétaire (je propose un local)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="rounded-xl mt-2"
                data-testid="email-input"
              />
            </div>

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="rounded-xl mt-2"
                data-testid="password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-6 shadow-lg shadow-primary/20"
              data-testid="auth-submit-button"
            >
              {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline text-sm font-medium"
              data-testid="toggle-auth-mode"
            >
              {isLogin ? 'Pas encore de compte ? Inscrivez-vous' : 'Déjà un compte ? Connectez-vous'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
