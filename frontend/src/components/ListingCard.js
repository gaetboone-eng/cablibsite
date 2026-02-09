import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, TrendingUp, Home } from 'lucide-react';

export const ListingCard = ({ listing }) => {
  const mainImage = listing.photos && listing.photos.length > 0 
    ? listing.photos[0] 
    : 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800';

  return (
    <Link 
      to={`/listing/${listing.id}`}
      className="bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 overflow-hidden group"
      data-testid="listing-card"
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={mainImage} 
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {listing.is_featured && (
          <div className="absolute top-3 right-3 bg-accent text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg" data-testid="featured-badge">
            En vedette
          </div>
        )}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium" data-testid="structure-type-badge">
          {listing.structure_type}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors" data-testid="listing-title">
          {listing.title}
        </h3>
        
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <MapPin className="h-4 w-4" />
          <span className="text-sm" data-testid="listing-city">{listing.city}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Home className="h-4 w-4" />
            <span data-testid="listing-size">{listing.size} m²</span>
          </div>
          {listing.professionals_present && listing.professionals_present.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span data-testid="professionals-count">{listing.professionals_present.length} prof.</span>
            </div>
          )}
        </div>

        {listing.profiles_searched && listing.profiles_searched.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Profils recherchés</span>
            </div>
            <div className="flex flex-wrap gap-2" data-testid="profiles-searched-list">
              {listing.profiles_searched.slice(0, 3).map((profile, idx) => (
                <span key={idx} className="bg-secondary/50 text-secondary-foreground px-2.5 py-1 rounded-full text-xs font-medium">
                  {profile}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-baseline justify-between pt-3 border-t border-border">
          <div>
            <span className="text-2xl font-bold text-foreground" data-testid="listing-rent">{listing.monthly_rent}€</span>
            <span className="text-sm text-muted-foreground">/mois</span>
          </div>
        </div>
      </div>
    </Link>
  );
};