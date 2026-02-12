import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { MapPin, Users, Shield, ArrowRight, Sparkles, Building2, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white" data-testid="landing-page">
      <Header user={user} onLogout={onLogout} />

      {/* Hero Section - Apple Style */}
      <section className="pt-32 pb-24 px-6 overflow-hidden" data-testid="hero-section">
        <div className="container mx-auto max-w-6xl">
          {/* Logo CabLib - En haut, centré */}
          <div className="text-center mb-16 animate-fade-in-up">
            <h1 className="logo-text text-6xl md:text-7xl mb-4">
              CabLib
            </h1>
            <div className="w-24 h-1 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>

          {/* Titre principal */}
          <div className="text-center mb-12 animate-fade-in-up animate-delay-100">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-foreground mb-8">
              L'espace médical
              <br />
              <span className="text-gradient">qui vous ressemble.</span>
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground max-w-3xl mx-auto font-light">
              La première plateforme qui connecte les professionnels de santé 
              aux locaux parfaitement adaptés à leur pratique.
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="max-w-3xl mx-auto mb-12 animate-scale-in animate-delay-200" data-testid="hero-search">
            <SearchBar />
          </div>

          {/* Tags de confiance */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in-up animate-delay-300">
            <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>Matching intelligent</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full">
              <Shield className="h-4 w-4 text-purple-500" />
              <span>Validation RPPS</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full">
              <Heart className="h-4 w-4 text-pink-500" />
              <span>100% gratuit</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Break - Gradient Line */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>

      {/* Features Section - Apple Style Cards */}
      <section className="py-32 px-6 bg-gradient-to-b from-white to-gray-50/50" data-testid="features-section">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <p className="text-blue-500 font-medium mb-4 tracking-wide uppercase text-sm">Fonctionnalités</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground">
              Conçu pour vous.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group bg-white rounded-3xl p-10 shadow-sm hover-lift border border-gray-100" data-testid="feature-card-search">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Recherche géolocalisée</h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Trouvez des locaux dans un rayon précis autour de votre ville. Filtrez par type, surface et budget.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-white rounded-3xl p-10 shadow-sm hover-lift border border-gray-100" data-testid="feature-card-collab">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Équipe complémentaire</h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Découvrez les professionnels déjà présents et constituez une équipe pluridisciplinaire.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-white rounded-3xl p-10 shadow-sm hover-lift border border-gray-100" data-testid="feature-card-secure">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Environnement sécurisé</h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Accès exclusif aux professionnels de santé vérifiés par numéro RPPS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-foreground text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <p className="text-5xl md:text-6xl font-bold mb-2">500+</p>
              <p className="text-lg text-white/70">Locaux disponibles</p>
            </div>
            <div>
              <p className="text-5xl md:text-6xl font-bold mb-2">30</p>
              <p className="text-lg text-white/70">Villes couvertes</p>
            </div>
            <div>
              <p className="text-5xl md:text-6xl font-bold mb-2">100%</p>
              <p className="text-lg text-white/70">Professionnels vérifiés</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Apple Style */}
      <section className="py-32 px-6" data-testid="cta-section">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Rejoignez CabLib et trouvez l'espace idéal pour développer votre activité médicale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/auth')}
              className="btn-apple text-white rounded-full px-10 py-7 text-lg font-medium"
              data-testid="cta-register-button"
            >
              Créer un compte gratuit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              onClick={() => navigate('/search')}
              variant="outline"
              className="rounded-full px-10 py-7 text-lg font-medium border-2 border-foreground hover:bg-foreground hover:text-white transition-all duration-300"
            >
              Explorer les annonces
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - Minimal Apple Style */}
      <footer className="py-16 px-6 border-t border-gray-100" data-testid="footer">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <span className="logo-text text-3xl">CabLib</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 CabLib
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
