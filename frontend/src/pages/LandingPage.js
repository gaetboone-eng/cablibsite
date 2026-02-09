import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { Building2, Users, TrendingUp, Shield, MapPin, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-emerald-50/50" data-testid="landing-page">
      <Header user={user} onLogout={onLogout} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6" data-testid="hero-section">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-foreground mb-6">
              Trouvez votre local
              <br />
              <span className="text-primary">médical idéal</span>
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-8">
              CabLib met en relation les professionnels de santé avec des structures adaptées à leur pratique. Maisons de santé, cabinets médicaux, trouvez l'espace qui correspond à vos besoins.
            </p>
          </div>

          <div className="max-w-3xl mx-auto mb-8" data-testid="hero-search">
            <SearchBar />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Recherche gratuite</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Validation RPPS</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>100% professionnels de santé</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6" data-testid="features-section">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
              Pourquoi choisir CabLib ?
            </h2>
            <p className="text-lg text-muted-foreground">Une plateforme conçue spécialement pour les professionnels de santé</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-stone-50/50 rounded-3xl p-8 border border-white/50 backdrop-blur-sm" data-testid="feature-card-search">
              <div className="bg-primary/10 rounded-2xl p-4 w-fit mb-6">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-medium text-foreground mb-4">Recherche ciblée</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Filtrez par ville, type de structure (MSP ou cabinet), surface et professions présentes pour trouver l'emplacement parfait.
              </p>
            </div>

            <div className="bg-stone-50/50 rounded-3xl p-8 border border-white/50 backdrop-blur-sm" data-testid="feature-card-collab">
              <div className="bg-primary/10 rounded-2xl p-4 w-fit mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-medium text-foreground mb-4">Collaboration</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Découvrez les professionnels déjà installés et les profils recherchés pour constituer une équipe complémentaire.
              </p>
            </div>

            <div className="bg-stone-50/50 rounded-3xl p-8 border border-white/50 backdrop-blur-sm" data-testid="feature-card-secure">
              <div className="bg-primary/10 rounded-2xl p-4 w-fit mb-6">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-medium text-foreground mb-4">Sécurisé</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Accès réservé aux professionnels de santé avec validation du numéro RPPS pour garantir la qualité des échanges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6" data-testid="cta-section">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-3xl p-12 shadow-[0_20px_50px_rgb(0,0,0,0.08)] text-center">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6">
              Prêt à trouver votre local ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez CabLib et accédez à des centaines d'annonces de locaux médicaux partout en France.
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-primary/20"
              data-testid="cta-register-button"
            >
              Créer un compte gratuitement
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-stone-200" data-testid="footer">
        <div className="container mx-auto text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">CabLib</span>
          </div>
          <p className="text-sm">
            © 2026 CabLib. Plateforme de mise en relation pour professionnels de santé.
          </p>
        </div>
      </footer>
    </div>
  );
}
