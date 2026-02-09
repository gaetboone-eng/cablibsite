import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from './ui/button';

export const SearchBar = ({ initialValue = '', large = true }) => {
  const [city, setCity] = useState(initialValue);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (city.trim()) {
      navigate(`/search?city=${encodeURIComponent(city.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full" data-testid="search-form">
      <div className={`flex items-center gap-3 bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${large ? 'p-2' : 'p-1.5'} border-2 border-transparent focus-within:border-primary/20 focus-within:ring-4 focus-within:ring-primary/5 transition-all`}>
        <Search className={`${large ? 'ml-4 h-6 w-6' : 'ml-3 h-5 w-5'} text-muted-foreground`} />
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Entrez une ville (ex: Paris, Lyon, Marseille)..."
          className={`flex-1 outline-none bg-transparent ${large ? 'text-lg' : 'text-base'} font-medium placeholder:text-muted-foreground/50`}
          data-testid="search-input"
        />
        <Button 
          type="submit"
          className={`bg-primary hover:bg-primary/90 text-white rounded-full ${large ? 'px-8 py-6' : 'px-6 py-5'} shadow-lg shadow-primary/20 transition-all duration-300`}
          data-testid="search-submit-button"
        >
          Rechercher
        </Button>
      </div>
    </form>
  );
};