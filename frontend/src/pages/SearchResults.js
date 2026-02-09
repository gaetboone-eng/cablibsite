import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { ListingCard } from '../components/ListingCard';
import { MapView } from '../components/MapView';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SearchResults({ user, onLogout }) {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    structure_type: '',
    min_size: '',
    max_rent: '',
    profession: ''
  });

  useEffect(() => {
    const cityParam = searchParams.get('city');
    if (cityParam) {
      setFilters(prev => ({ ...prev, city: cityParam }));
    }
  }, [searchParams]);

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.city) params.city = filters.city;
      if (filters.structure_type) params.structure_type = filters.structure_type;
      if (filters.min_size) params.min_size = filters.min_size;
      if (filters.max_rent) params.max_rent = filters.max_rent;
      if (filters.profession) params.profession = filters.profession;

      const response = await axios.get(`${API}/listings`, { params });
      setListings(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-stone-50" data-testid="search-results-page">
      <Header user={user} onLogout={onLogout} />

      <div className="pt-24 pb-6 px-6">
        <div className="container mx-auto max-w-3xl">
          <SearchBar initialValue={filters.city} large={false} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-0 h-[calc(100vh-180px)]">
        {/* Left: Listings */}
        <div className="overflow-y-auto hide-scrollbar px-6" data-testid="listings-container">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                {loading ? 'Chargement...' : `${listings.length} résultat${listings.length > 1 ? 's' : ''}`}
              </h2>
              {filters.city && (
                <p className="text-muted-foreground" data-testid="search-city-display">
                  à {filters.city}
                </p>
              )}
            </div>

            <div className="mb-6">
              <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20" data-testid="no-results">
                <p className="text-lg text-muted-foreground">Aucune annonce trouvée</p>
                <p className="text-sm text-muted-foreground mt-2">Essayez de modifier vos filtres</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                {listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Map */}
        <div className="hidden lg:block sticky top-0 h-[calc(100vh-180px)] p-6" data-testid="map-view">
          <MapView listings={listings} />
        </div>
      </div>
    </div>
  );
}
