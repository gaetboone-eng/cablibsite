import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { MapView } from '../components/MapView';
import { BarChart3, MapPin, Users, Search, Mail, Briefcase, User } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AnalyticsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [citySearches, setCitySearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.user_type !== 'admin') {
      toast.error('Accès réservé aux administrateurs');
      navigate('/');
      return;
    }
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('cablib_token');
      const response = await axios.get(`${API}/analytics/searches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const fetchCitySearches = async (city) => {
    try {
      const token = localStorage.getItem('cablib_token');
      const response = await axios.get(`${API}/analytics/searches-by-city/${city}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCitySearches(response.data.searches);
      setSelectedCity(city);
    } catch (error) {
      toast.error('Erreur lors du chargement des recherches');
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const searchHeatmapData = Object.entries(stats.searches_by_city).map(([city, count]) => ({
    id: city,
    city: city,
    title: `${count} recherche${count > 1 ? 's' : ''}`,
    size: count * 10,
    monthly_rent: count,
    is_featured: count > 5,
    photos: [],
    professionals_present: [],
    profiles_searched: []
  }));

  return (
    <div className="min-h-screen bg-background" data-testid="analytics-page">
      <Header user={user} onLogout={onLogout} />

      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3 flex items-center gap-3">
              <BarChart3 className="h-10 w-10 text-primary" />
              Analytics & Données
            </h1>
            <p className="text-lg text-muted-foreground">
              Vue d ensemble des recherches des professionnels de santé
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border" data-testid="total-searches-stat">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-2xl p-4">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stats.total_searches}</p>
                  <p className="text-muted-foreground">Recherches totales</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex items-center gap-4">
                <div className="bg-accent/10 rounded-2xl p-4">
                  <MapPin className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{Object.keys(stats.searches_by_city).length}</p>
                  <p className="text-muted-foreground">Villes recherchées</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-2xl p-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stats.recent_searches.length}</p>
                  <p className="text-muted-foreground">Utilisateurs actifs</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
              <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                Carte des zones de recherche
              </h2>
              <p className="text-muted-foreground mb-4">
                Cliquez sur un point pour voir les détails des recherches
              </p>
              <div className="h-[500px]">
                <MapView listings={searchHeatmapData} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Recherches par ville</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {Object.entries(stats.searches_by_city)
                  .sort((a, b) => b[1] - a[1])
                  .map(([city, count]) => (
                    <button
                      key={city}
                      onClick={() => fetchCitySearches(city)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all hover:border-primary hover:bg-primary/5 ${
                        selectedCity === city ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      data-testid={`city-${city}`}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span className="font-medium text-foreground">{city}</span>
                      </div>
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                        {count} recherche{count > 1 ? 's' : ''}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">
                {selectedCity ? `Détails - ${selectedCity}` : 'Recherches récentes'}
              </h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {(selectedCity ? citySearches : stats.recent_searches.slice(0, 10)).map((search) => (
                  <div key={search.id} className="p-4 rounded-xl border border-border hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">{search.user_name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(search.timestamp).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{search.user_email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>{search.user_profession}</span>
                      </div>
                      {search.city && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Recherche: {search.city}</span>
                          {search.radius && <span className="text-xs">({search.radius} km)</span>}
                        </div>
                      )}
                      {search.structure_type && (
                        <div className="mt-2">
                          <span className="inline-block bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs">
                            {search.structure_type}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
