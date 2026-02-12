import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Navigation } from 'lucide-react';
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
      navigate('/search');
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full" data-testid="search-form">
      <div 
        className={`flex flex-col md:flex-row items-stretch md:items-center gap-3 rounded-full shadow-[0_8px_30px_rgba(26,31,61,0.08)] ${large ? 'p-2 md:p-3' : 'p-2'} border hover:shadow-[0_12px_40px_rgba(26,31,61,0.12)] focus-within:shadow-[0_12px_40px_rgba(26,31,61,0.12)] transition-all duration-300`}
        style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }}
      >
        {/* City Input */}
        <div className="flex items-center gap-3 flex-1 px-4">
          <MapPin className={`${large ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0`} style={{ color: '#1A1F3D' }} />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Où cherchez-vous ?" 
            className={`flex-1 outline-none bg-transparent ${large ? 'text-lg' : 'text-base'} font-medium`}
            style={{ color: '#1A1F3D' }}
            data-testid="search-input"
          />
        </div>
        
        {/* Divider */}
        <div className="hidden md:block w-px h-8" style={{ backgroundColor: '#E8E0D5' }}></div>
        
        {/* Radius Input */}
        <div className="flex items-center gap-3 px-4">
          <Navigation className={`${large ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0`} style={{ color: '#1A1F3D' }} />
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            placeholder="Rayon"
            className={`w-16 outline-none bg-transparent ${large ? 'text-lg' : 'text-base'} font-medium`}
            style={{ color: '#1A1F3D' }}
            min="0"
            max="500"
            data-testid="radius-input"
          />
          <span style={{ color: '#5A6478' }}>km</span>
        </div>

        {/* Search Button */}
        <Button 
          type="submit"
          className={`btn-navy rounded-full ${large ? 'px-8 py-6' : 'px-6 py-5'} transition-all duration-300 whitespace-nowrap`}
          data-testid="search-submit-button"
        >
          <Search className="h-5 w-5 md:mr-2" />
          <span className="hidden md:inline">Rechercher</span>
        </Button>
      </div>
    </form>
  );
};