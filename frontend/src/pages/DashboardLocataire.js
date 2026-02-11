import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { ListingCard } from '../components/ListingCard';
import { Heart, Search, Loader2, Sparkles, Calendar, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DashboardLocataire({ user, onLogout }) {
  const [favorites, setFavorites] = useState([]);
  const [listings, setListings] = useState([]);
  const [topMatches, setTopMatches] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('cablib_token');
      
      // Fetch favorites
      const favResponse = await axios.get(`${API}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const listingPromises = favResponse.data.map(fav => 
        axios.get(`${API}/listings/${fav.listing_id}`)
      );
      const listingResponses = await Promise.all(listingPromises);
      setListings(listingResponses.map(res => res.data));
      setFavorites(favResponse.data);

      // Fetch top matches
      const matchResponse = await axios.get(`${API}/matches/top?limit=3`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTopMatches(matchResponse.data);

      // Fetch visits
      const visitsResponse = await axios.get(`${API}/visits/practitioner`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(visitsResponse.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-locataire">
      <Header user={user} onLogout={onLogout} />

      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">Tableau de bord</h1>
            <p className="text-lg text-muted-foreground">
              Bienvenue, {user.first_name} {user.last_name}
            </p>
          </div>

          {/* Top Matches Section */}
          {topMatches.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Recommandations pour vous</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Ces annonces correspondent particulièrement bien à votre profil et vos préférences
              </p>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topMatches.map(match => (
                    <ListingCard 
                      key={match.listing.id} 
                      listing={match.listing}
                      matchScore={match.score}
                      matchReasons={match.reasons}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-border" data-testid="favorites-stat">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-2xl p-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{favorites.length}</p>
                  <p className="text-muted-foreground">Favoris</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-border" data-testid="search-cta">
              <div className="flex items-center gap-4">
                <div className="bg-accent/10 rounded-2xl p-4">
                  <Search className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground mb-1">Continuer la recherche</p>
                  <button 
                    onClick={() => navigate('/search')}
                    className="text-primary hover:underline font-medium"
                  >
                    Voir toutes les annonces →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Visits */}
          {visits.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Mes visites programmées
              </h2>
              <div className="space-y-3">
                {visits.slice(0, 3).map((visit) => (
                  <div
                    key={visit.id}
                    className="bg-white rounded-xl p-5 shadow-sm border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground mb-2">
                          Visite programmée
                        </p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(visit.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{visit.time}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        visit.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        visit.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {visit.status === 'confirmed' ? 'Confirmée' : visit.status === 'cancelled' ? 'Annulée' : 'En attente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Favorites */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Mes favoris</h2>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm" data-testid="no-favorites">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-4">Aucun favori pour le moment</p>
                <button
                  onClick={() => navigate('/search')}
                  className="text-primary hover:underline font-medium"
                >
                  Découvrir les annonces
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
