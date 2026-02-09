import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { ListingCard } from '../components/ListingCard';
import { Plus, Building2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DashboardProprietaire({ user, onLogout }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      const token = localStorage.getItem('cablib_token');
      const response = await axios.get(`${API}/listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter only user's listings
      const myListings = response.data.filter(listing => listing.owner_id === user.id);
      setListings(myListings);
    } catch (error) {
      toast.error('Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50" data-testid="dashboard-proprietaire">
      <Header user={user} onLogout={onLogout} />

      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-3">Mes annonces</h1>
              <p className="text-lg text-muted-foreground">
                Gérez vos locaux proposés à la location
              </p>
            </div>
            <Button
              onClick={() => navigate('/create-listing')}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-6 shadow-lg shadow-primary/20 gap-2"
              data-testid="create-listing-button"
            >
              <Plus className="h-5 w-5" />
              Créer une annonce
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-border" data-testid="listings-count">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-2xl p-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{listings.length}</p>
                  <p className="text-muted-foreground">Annonce{listings.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Listings */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm" data-testid="no-listings">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-4">Aucune annonce pour le moment</p>
                <Button
                  onClick={() => navigate('/create-listing')}
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3"
                >
                  Créer ma première annonce
                </Button>
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
