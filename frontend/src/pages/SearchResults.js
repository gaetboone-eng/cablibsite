import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { ListingCard } from '../components/ListingCard';
import { MapView } from '../components/MapView';
import { Loader2, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SearchResults({ user, onLogout }) {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    radius: searchParams.get('radius') || '',
    structure_type: '',
    min_size: '',
    max_rent: '',
    profession: ''
  });

  useEffect(() => {
    const cityParam = searchParams.get('city');
    const radiusParam = searchParams.get('radius');
    if (cityParam) {
      setFilters(prev => ({ ...prev, city: cityParam, radius: radiusParam || '' }));
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
        <div className="container mx-auto max-w-6xl">
          <SearchBar initialValue={filters.city} large={false} />
          
          <div className="flex items-center gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-full gap-2"
              data-testid="toggle-filters-button"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtres avancés
              {showFilters && <X className="h-4 w-4" />}
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {loading ? 'Chargement...' : `${listings.length} annonce${listings.length > 1 ? 's' : ''} trouvée${listings.length > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel (Collapsible) */}
      {showFilters && (
        <div className="px-6 pb-6">
          <div className="container mx-auto max-w-6xl">
            <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
          </div>
        </div>
      )}

      {/* Main Content: Map First, then List */}
      <div className="px-6 pb-6">
        <div className="container mx-auto max-w-7xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Large Map */}
              <div className="mb-8" data-testid="map-container-main">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">
                    Carte des annonces
                    {filters.city && ` - ${filters.city}`}
                  </h2>
                  <div className="h-[600px]">
                    <MapView listings={listings} />
                  </div>
                </div>
              </div>

              {/* List of Listings */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-foreground">
                  Liste des annonces
                </h2>
                {listings.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl" data-testid="no-results">
                    <p className="text-lg text-muted-foreground">Aucune annonce trouvée</p>
                    <p className="text-sm text-muted-foreground mt-2">Essayez de modifier vos filtres</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map(listing => (
                      <ListingCard key={listing.id} listing={listing} />
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
