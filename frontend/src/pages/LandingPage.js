import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { MapPin, Users, Shield, ArrowRight, Sparkles, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E6' }} data-testid="landing-page">
      <Header user={user} onLogout={onLogout} />

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 overflow-hidden" data-testid="hero-section">
        <div className="container mx-auto max-w-6xl">
          {/* Logo CabLib - Script style */}
          <div className="text-center mb-16 animate-fade-in-up">
            <h1 className="logo-text text-7xl md:text-8xl mb-4">
              CabLib
            </h1>
            <div className="w-20 h-1 mx-auto rounded-full" style={{ backgroundColor: '#1A1F3D' }}></div>
          </div>

          {/* Titre principal */}
          <div className="text-center mb-12 animate-fade-in-up animate-delay-100">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-8" style={{ color: '#1A1F3D' }}>
              L'espace médical
              <br />
              <span className="text-gradient-navy">qui vous ressemble.</span>
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto font-light" style={{ color: '#4A5568' }}>
              La première plateforme qui connecte les professionnels de santé 
              aux locaux parfaitement adaptés à leur pratique.
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="max-w-3xl mx-auto mb-12 animate-scale-in animate-delay-200" data-testid="hero-search">
            <SearchBar />
          </div>

          {/* Tags de confiance */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm animate-fade-in-up animate-delay-300">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ backgroundColor: 'rgba(26, 31, 61, 0.08)' }}>
              <Sparkles className="h-4 w-4" style={{ color: '#1A1F3D' }} />
              <span style={{ color: '#1A1F3D' }}>Matching intelligent</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ backgroundColor: 'rgba(26, 31, 61, 0.08)' }}>
              <Shield className="h-4 w-4" style={{ color: '#1A1F3D' }} />
              <span style={{ color: '#1A1F3D' }}>Validation RPPS</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ backgroundColor: 'rgba(26, 31, 61, 0.08)' }}>
              <Heart className="h-4 w-4" style={{ color: '#1A1F3D' }} />
              <span style={{ color: '#1A1F3D' }}>100% gratuit</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Break */}
      <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, #1A1F3D20, transparent)' }}></div>

      {/* Features Section */}
      <section className="py-32 px-6" style={{ backgroundColor: '#F5F0E6' }} data-testid="features-section">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <p className="font-semibold mb-4 tracking-wide uppercase text-sm" style={{ color: '#1A1F3D' }}>Fonctionnalités</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight" style={{ color: '#1A1F3D' }}>
              Conçu pour vous.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group rounded-3xl p-10 shadow-sm hover-lift border" style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }} data-testid="feature-card-search">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#1A1F3D' }}>
                <MapPin className="h-8 w-8" style={{ color: '#F5F0E6' }} />
              </div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: '#1A1F3D' }}>Recherche géolocalisée</h3>
              <p className="text-lg leading-relaxed" style={{ color: '#5A6478' }}>
                Trouvez des locaux dans un rayon précis autour de votre ville. Filtrez par type, surface et budget.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group rounded-3xl p-10 shadow-sm hover-lift border" style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }} data-testid="feature-card-collab">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#1A1F3D' }}>
                <Users className="h-8 w-8" style={{ color: '#F5F0E6' }} />
              </div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: '#1A1F3D' }}>Équipe complémentaire</h3>
              <p className="text-lg leading-relaxed" style={{ color: '#5A6478' }}>
                Découvrez les professionnels déjà présents et constituez une équipe pluridisciplinaire.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group rounded-3xl p-10 shadow-sm hover-lift border" style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }} data-testid="feature-card-secure">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#1A1F3D' }}>
                <Shield className="h-8 w-8" style={{ color: '#F5F0E6' }} />
              </div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: '#1A1F3D' }}>Environnement sécurisé</h3>
              <p className="text-lg leading-relaxed" style={{ color: '#5A6478' }}>
                Accès exclusif aux professionnels de santé vérifiés par numéro RPPS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Navy */}
      <section className="py-24 px-6" style={{ backgroundColor: '#1A1F3D' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <p className="text-5xl md:text-6xl font-bold mb-2" style={{ color: '#F5F0E6' }}>500+</p>
              <p className="text-lg" style={{ color: 'rgba(245, 240, 230, 0.7)' }}>Locaux disponibles</p>
            </div>
            <div>
              <p className="text-5xl md:text-6xl font-bold mb-2" style={{ color: '#F5F0E6' }}>30</p>
              <p className="text-lg" style={{ color: 'rgba(245, 240, 230, 0.7)' }}>Villes couvertes</p>
            </div>
            <div>
              <p className="text-5xl md:text-6xl font-bold mb-2" style={{ color: '#F5F0E6' }}>100%</p>
              <p className="text-lg" style={{ color: 'rgba(245, 240, 230, 0.7)' }}>Professionnels vérifiés</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6" style={{ backgroundColor: '#F5F0E6' }} data-testid="cta-section">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6" style={{ color: '#1A1F3D' }}>
            Prêt à commencer ?
          </h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto" style={{ color: '#5A6478' }}>
            Rejoignez CabLib et trouvez l'espace idéal pour développer votre activité médicale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/auth')}
              className="btn-navy rounded-full px-10 py-7 text-lg font-medium"
              data-testid="cta-register-button"
            >
              Créer un compte gratuit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              onClick={() => navigate('/search')}
              className="btn-beige rounded-full px-10 py-7 text-lg font-medium"
            >
              Explorer les annonces
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t" style={{ backgroundColor: '#F5F0E6', borderColor: '#E8E0D5' }} data-testid="footer">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <span className="logo-text text-4xl">CabLib</span>
            </div>
            <div className="flex items-center gap-8 text-sm" style={{ color: '#5A6478' }}>
              <a href="#" className="hover:opacity-70 transition-opacity">Mentions légales</a>
              <a href="#" className="hover:opacity-70 transition-opacity">Confidentialité</a>
              <a href="#" className="hover:opacity-70 transition-opacity">Contact</a>
            </div>
            <p className="text-sm" style={{ color: '#5A6478' }}>
              © 2026 CabLib
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
