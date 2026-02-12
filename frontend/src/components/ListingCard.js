import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, TrendingUp, Home, Sparkles, ArrowUpRight } from 'lucide-react';

export const ListingCard = ({ listing, matchScore, matchReasons }) => {
  const mainImage = listing.photos && listing.photos.length > 0 
    ? listing.photos[0] 
    : 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800';

  return (
    <Link 
      to={`/listing/${listing.id}`}
      className="group rounded-3xl border shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden hover-lift"
      style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }}
      data-testid="listing-card"
    >
      {/* Image Container */}
      <div className="relative h-52 overflow-hidden">
        <img 
          src={mainImage} 
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Badges */}
        {listing.is_featured && (
          <div className="absolute top-4 right-4 px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg" style={{ backgroundColor: '#1A1F3D', color: '#F5F0E6' }} data-testid="featured-badge">
            ✨ En vedette
          </div>
        )}
        <div className="absolute top-4 left-4 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm" style={{ backgroundColor: 'rgba(250, 247, 242, 0.95)', color: '#1A1F3D' }} data-testid="structure-type-badge">
          {listing.structure_type}
        </div>
        
        {/* Match Score */}
        {matchScore !== undefined && matchScore > 0 && (
          <div className="absolute bottom-4 right-4 px-4 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2" style={{ backgroundColor: '#1A1F3D', color: '#F5F0E6' }} data-testid="match-score-badge">
            <Sparkles className="h-4 w-4" />
            {matchScore}%
          </div>
        )}

        {/* Arrow on hover */}
        <div className="absolute bottom-4 left-4 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0" style={{ backgroundColor: '#FAF7F2' }}>
          <ArrowUpRight className="h-5 w-5" style={{ color: '#1A1F3D' }} />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title & Location */}
        <h3 className="text-xl font-semibold mb-2 group-hover:opacity-70 transition-colors duration-300 line-clamp-1" style={{ color: '#1A1F3D' }} data-testid="listing-title">
          {listing.title}
        </h3>
        
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4" style={{ color: '#1A1F3D' }} />
          <span className="text-sm font-medium" style={{ color: '#5A6478' }} data-testid="listing-city">{listing.city}</span>
          {listing.distance_km && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(26, 31, 61, 0.1)', color: '#1A1F3D' }}>
              {listing.distance_km} km
            </span>
          )}
        </div>

        {/* Match Reasons */}
        {matchReasons && matchReasons.length > 0 && (
          <div className="mb-4 p-3 rounded-xl border" style={{ backgroundColor: 'rgba(26, 31, 61, 0.03)', borderColor: 'rgba(26, 31, 61, 0.1)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#1A1F3D' }}>Pourquoi ce match ?</p>
            <ul className="text-xs space-y-1" style={{ color: '#5A6478' }}>
              {matchReasons.slice(0, 2).map((reason, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#1A1F3D' }}></span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(26, 31, 61, 0.05)' }}>
            <Home className="h-4 w-4" style={{ color: '#5A6478' }} />
            <span className="font-medium" style={{ color: '#1A1F3D' }} data-testid="listing-size">{listing.size} m²</span>
          </div>
          {listing.professionals_present && listing.professionals_present.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(26, 31, 61, 0.05)' }}>
              <Users className="h-4 w-4" style={{ color: '#5A6478' }} />
              <span className="font-medium" style={{ color: '#1A1F3D' }} data-testid="professionals-count">{listing.professionals_present.length}</span>
            </div>
          )}
        </div>

        {/* Profiles Searched */}
        {listing.profiles_searched && listing.profiles_searched.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" style={{ color: '#1A1F3D' }} />
              <span className="text-xs font-semibold" style={{ color: '#5A6478' }}>Recherchés</span>
            </div>
            <div className="flex flex-wrap gap-2" data-testid="profiles-searched-list">
              {listing.profiles_searched.slice(0, 3).map((profile, idx) => (
                <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(26, 31, 61, 0.08)', color: '#1A1F3D' }}>
                  {profile}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline justify-between pt-4 border-t" style={{ borderColor: '#E8E0D5' }}>
          <div>
            <span className="text-3xl font-bold" style={{ color: '#1A1F3D' }} data-testid="listing-rent">{listing.monthly_rent}€</span>
            <span className="text-sm font-medium" style={{ color: '#5A6478' }}>/mois</span>
          </div>
          <span className="text-xs" style={{ color: '#5A6478' }}>Charges non comprises</span>
        </div>
      </div>
    </Link>
  );
};
