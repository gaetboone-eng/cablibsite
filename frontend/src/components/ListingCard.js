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
      className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 overflow-hidden hover-lift"
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
          <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg" data-testid="featured-badge">
            ✨ En vedette
          </div>
        )}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold text-foreground shadow-sm" data-testid="structure-type-badge">
          {listing.structure_type}
        </div>
        
        {/* Match Score */}
        {matchScore !== undefined && matchScore > 0 && (
          <div className="absolute bottom-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2" data-testid="match-score-badge">
            <Sparkles className="h-4 w-4" />
            {matchScore}%
          </div>
        )}

        {/* Arrow on hover */}
        <div className="absolute bottom-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <ArrowUpRight className="h-5 w-5 text-foreground" />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title & Location */}
        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-blue-600 transition-colors duration-300 line-clamp-1" data-testid="listing-title">
          {listing.title}
        </h3>
        
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium" data-testid="listing-city">{listing.city}</span>
          {listing.distance_km && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {listing.distance_km} km
            </span>
          )}
        </div>

        {/* Match Reasons */}
        {matchReasons && matchReasons.length > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100/50">
            <p className="text-xs font-semibold text-blue-600 mb-2">Pourquoi ce match ?</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {matchReasons.slice(0, 2).map((reason, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
            <Home className="h-4 w-4 text-gray-500" />
            <span className="font-medium" data-testid="listing-size">{listing.size} m²</span>
          </div>
          {listing.professionals_present && listing.professionals_present.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="font-medium" data-testid="professionals-count">{listing.professionals_present.length}</span>
            </div>
          )}
        </div>

        {/* Profiles Searched */}
        {listing.profiles_searched && listing.profiles_searched.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-semibold text-muted-foreground">Recherchés</span>
            </div>
            <div className="flex flex-wrap gap-2" data-testid="profiles-searched-list">
              {listing.profiles_searched.slice(0, 3).map((profile, idx) => (
                <span key={idx} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                  {profile}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline justify-between pt-4 border-t border-gray-100">
          <div>
            <span className="text-3xl font-bold text-foreground" data-testid="listing-rent">{listing.monthly_rent}€</span>
            <span className="text-sm text-muted-foreground font-medium">/mois</span>
          </div>
          <span className="text-xs text-muted-foreground">Charges non comprises</span>
        </div>
      </div>
    </Link>
  );
};
