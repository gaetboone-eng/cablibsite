import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export const SearchBar = ({ initialValue = '', initialRadius = '', large = true }) => {
  const [city, setCity] = useState(initialValue);
  const [radius, setRadius] = useState(initialRadius);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (city.trim()) {
      const params = new URLSearchParams();
      params.append('city', city.trim());
      if (radius) params.append('radius', radius);
      navigate(`/search?${params.toString()}`);
    } else {
      // If no city, show all listings
      navigate('/search');
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full" data-testid="search-form">
      <div className={`flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${large ? 'p-3' : 'p-2'} border-2 border-transparent focus-within:border-primary/20 focus-within:ring-4 focus-within:ring-primary/5 transition-all`}>
        <div className="flex items-center gap-3 flex-1">
          <MapPin className={`${large ? 'ml-3 h-6 w-6' : 'ml-2 h-5 w-5'} text-muted-foreground flex-shrink-0`} />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville (ex: Paris, Lyon...)" 
            className={`flex-1 outline-none bg-transparent ${large ? 'text-lg' : 'text-base'} font-medium placeholder:text-muted-foreground/50`}
            data-testid="search-input"
          />
        </div>
        
        <div className="flex items-center gap-2 md:border-l md:pl-4">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Périmètre:</span>
          <Input
            type="number"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            placeholder="km"
            className="w-20 rounded-xl"
            min="0"
            max="100"
            data-testid="radius-input"
          />
        </div>

        <Button 
          type="submit"
          className={`bg-primary hover:bg-primary/90 text-white rounded-full ${large ? 'px-8 py-6' : 'px-6 py-5'} shadow-lg shadow-primary/20 transition-all duration-300 whitespace-nowrap`}
          data-testid="search-submit-button"
        >
          <Search className="h-5 w-5 mr-2" />
          Rechercher
        </Button>
      </div>
    </form>
  );
};