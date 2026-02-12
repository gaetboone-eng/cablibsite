import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { 
  BarChart3, Eye, Heart, MessageCircle, FileText, Calendar,
  TrendingUp, TrendingDown, ArrowLeft, Loader2, Home, 
  ChevronRight, Users
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function OwnerStatsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [listingStats, setListingStats] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!user || user.user_type !== 'proprietaire') {
      navigate('/');
      return;
    }
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('cablib_token');
      const response = await axios.get(`${API}/owner/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const fetchListingStats = async (listingId) => {
    setLoadingDetail(true);
    setSelectedListing(listingId);
    try {
      const token = localStorage.getItem('cablib_token');
      const response = await axios.get(`${API}/owner/stats/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListingStats(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoadingDetail(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E6' }}>
      <Header user={user} onLogout={onLogout} />

      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <Button 
            variant="ghost" 
            onClick={() => selectedListing ? (setSelectedListing(null), setListingStats(null)) : navigate(-1)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {selectedListing ? 'Retour aux statistiques' : 'Retour'}
          </Button>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#1A1F3D' }} />
            </div>
          ) : selectedListing && listingStats ? (
            // Detailed stats for a specific listing
            <ListingDetailStats 
              data={listingStats} 
              loading={loadingDetail}
              onBack={() => {setSelectedListing(null); setListingStats(null);}}
            />
          ) : (
            // Overview stats
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: '#1A1F3D' }}>
                    <BarChart3 className="h-8 w-8" />
                    Mes Statistiques
                  </h1>
                  <p className="mt-1" style={{ color: '#5A6478' }}>
                    Performance de vos {stats?.summary?.total_listings || 0} annonce(s)
                  </p>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                  icon={Eye}
                  label="Vues totales"
                  value={stats?.summary?.total_views || 0}
                  subValue={`${stats?.summary?.views_30d || 0} ce mois`}
                  trend="up"
                />
                <StatCard
                  icon={MessageCircle}
                  label="Contacts reçus"
                  value={stats?.summary?.total_contacts || 0}
                  subValue={`${stats?.summary?.contacts_30d || 0} ce mois`}
                  trend="up"
                />
                <StatCard
                  icon={Heart}
                  label="Favoris"
                  value={stats?.summary?.total_favorites || 0}
                  subValue="sur vos annonces"
                />
                <StatCard
                  icon={FileText}
                  label="Candidatures"
                  value={stats?.summary?.total_applications || 0}
                  subValue={`${stats?.summary?.total_visits || 0} visites`}
                />
              </div>

              {/* Conversion Rate */}
              <div className="rounded-2xl p-6 mb-8 border" style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#5A6478' }}>Taux de conversion (vues → contacts)</p>
                    <p className="text-4xl font-bold mt-1" style={{ color: '#1A1F3D' }}>
                      {stats?.summary?.conversion_rate || 0}%
                    </p>
                  </div>
                  <div className="w-24 h-24 rounded-full border-8 flex items-center justify-center" 
                    style={{ 
                      borderColor: stats?.summary?.conversion_rate >= 3 ? '#22c55e' : '#f59e0b',
                      backgroundColor: '#FAF7F2'
                    }}
                  >
                    <span className="text-lg font-bold" style={{ color: '#1A1F3D' }}>
                      {stats?.summary?.conversion_rate >= 3 ? '👍' : '📈'}
                    </span>
                  </div>
                </div>
                <p className="text-sm mt-4" style={{ color: '#5A6478' }}>
                  {stats?.summary?.conversion_rate >= 3 
                    ? "Excellent ! Vos annonces convertissent bien."
                    : "Conseil : Ajoutez plus de photos ou réduisez légèrement le prix pour améliorer ce taux."
                  }
                </p>
              </div>

              {/* Listings List */}
              <div>
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#1A1F3D' }}>
                  Détail par annonce
                </h2>
                
                {stats?.listings?.length === 0 ? (
                  <div className="rounded-2xl p-12 text-center border" style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }}>
                    <Home className="h-12 w-12 mx-auto mb-4" style={{ color: '#5A6478' }} />
                    <p style={{ color: '#5A6478' }}>Vous n'avez pas encore d'annonces</p>
                    <Button 
                      className="btn-navy rounded-full mt-4"
                      onClick={() => navigate('/create-listing')}
                    >
                      Créer une annonce
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats?.listings?.map((listing) => (
                      <div
                        key={listing.listing_id}
                        className="rounded-2xl p-5 border cursor-pointer transition-all hover:shadow-lg"
                        style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }}
                        onClick={() => fetchListingStats(listing.listing_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold" style={{ color: '#1A1F3D' }}>
                              {listing.title}
                            </h3>
                            <p className="text-sm" style={{ color: '#5A6478' }}>
                              {listing.city} • {listing.monthly_rent}€/mois
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold" style={{ color: '#1A1F3D' }}>
                                {listing.stats.total_views}
                              </p>
                              <p className="text-xs" style={{ color: '#5A6478' }}>vues</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold" style={{ color: '#1A1F3D' }}>
                                {listing.stats.contacts}
                              </p>
                              <p className="text-xs" style={{ color: '#5A6478' }}>contacts</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold" style={{ color: '#1A1F3D' }}>
                                {listing.stats.favorites}
                              </p>
                              <p className="text-xs" style={{ color: '#5A6478' }}>favoris</p>
                            </div>
                            <ChevronRight className="h-5 w-5" style={{ color: '#5A6478' }} />
                          </div>
                        </div>
                        
                        {listing.stats.views_7d > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">
                              +{listing.stats.views_7d} vues cette semaine
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subValue, trend }) {
  return (
    <div className="rounded-2xl p-5 border" style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="h-5 w-5" style={{ color: '#1A1F3D' }} />
        {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
        {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
      </div>
      <p className="text-3xl font-bold" style={{ color: '#1A1F3D' }}>{value}</p>
      <p className="text-sm" style={{ color: '#5A6478' }}>{label}</p>
      {subValue && (
        <p className="text-xs mt-1" style={{ color: '#5A6478' }}>{subValue}</p>
      )}
    </div>
  );
}

function ListingDetailStats({ data, loading, onBack }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#1A1F3D' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1F3D' }}>
          {data.listing.title}
        </h1>
        <p style={{ color: '#5A6478' }}>
          {data.listing.city} • {data.listing.monthly_rent}€/mois
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Eye} label="Vues" value={data.stats.total_views} />
        <StatCard icon={Heart} label="Favoris" value={data.stats.favorites} />
        <StatCard icon={MessageCircle} label="Contacts" value={data.stats.contacts} />
        <StatCard icon={FileText} label="Candidatures" value={data.stats.applications} />
        <StatCard icon={Calendar} label="Visites" value={data.stats.visits_scheduled} />
      </div>

      {/* Conversion */}
      <div className="rounded-2xl p-6 mb-8 border" style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }}>
        <p className="text-sm font-medium mb-2" style={{ color: '#5A6478' }}>Taux de conversion</p>
        <p className="text-3xl font-bold" style={{ color: '#1A1F3D' }}>{data.stats.conversion_rate}%</p>
        <div className="w-full h-3 rounded-full mt-3" style={{ backgroundColor: '#E8E0D5' }}>
          <div 
            className="h-3 rounded-full transition-all" 
            style={{ 
              width: `${Math.min(data.stats.conversion_rate * 10, 100)}%`,
              backgroundColor: data.stats.conversion_rate >= 3 ? '#22c55e' : '#f59e0b'
            }}
          ></div>
        </div>
      </div>

      {/* Views Chart */}
      <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1F3D' }}>
          Évolution des vues (30 derniers jours)
        </h3>
        <div className="flex items-end gap-1 h-32">
          {data.views_chart.map((day, idx) => (
            <div 
              key={idx} 
              className="flex-1 rounded-t transition-all hover:opacity-80"
              style={{ 
                height: `${Math.max((day.views / Math.max(...data.views_chart.map(d => d.views), 1)) * 100, 5)}%`,
                backgroundColor: '#1A1F3D',
                minHeight: '4px'
              }}
              title={`${day.date}: ${day.views} vues`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs" style={{ color: '#5A6478' }}>
          <span>Il y a 30 jours</span>
          <span>Aujourd'hui</span>
        </div>
      </div>

      {/* Insights */}
      {data.insights && (
        <div className="rounded-2xl p-6 mt-6 border" style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }}>
          <h3 className="font-semibold mb-3" style={{ color: '#1A1F3D' }}>
            💡 Insights
          </h3>
          <p style={{ color: '#5A6478' }}>
            Le loyer moyen à {data.listing.city} est de <strong>{data.insights.avg_rent_in_city}€/mois</strong>.
            {data.insights.price_vs_average === 'above' 
              ? " Votre prix est au-dessus de la moyenne. Considérez une légère baisse pour augmenter l'intérêt."
              : " Votre prix est compétitif par rapport au marché !"}
          </p>
        </div>
      )}
    </div>
  );
}
