import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { createRoot } from 'react-dom/client';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const createCustomIcon = () => {
  const iconHtml = document.createElement('div');
  iconHtml.className = 'custom-marker';
  iconHtml.innerHTML = `
    <div class="flex items-center justify-center w-10 h-10 bg-primary rounded-full shadow-lg" style="cursor: pointer;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml.innerHTML,
    className: 'custom-leaflet-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

export const MapView = ({ listings, center = [46.603354, 1.888334], zoom = 6 }) => {
  const mapRef = useRef(null);

  // Geocoding cache (in real app, use actual geocoding API)
  const cityCoordinates = {
    'Paris': [48.8566, 2.3522],
    'Lyon': [45.7640, 4.8357],
    'Marseille': [43.2965, 5.3698],
    'Toulouse': [43.6047, 1.4442],
    'Nice': [43.7102, 7.2620],
    'Nantes': [47.2184, -1.5536],
    'Strasbourg': [48.5734, 7.7521],
    'Montpellier': [43.6108, 3.8767],
    'Bordeaux': [44.8378, -0.5792],
    'Lille': [50.6292, 3.0573],
    'Rennes': [48.1173, -1.6778],
    'Reims': [49.2583, 4.0317],
  };

  const getCoordinates = (city) => {
    return cityCoordinates[city] || center;
  };

  useEffect(() => {
    if (mapRef.current && listings.length > 0) {
      const bounds = listings.map(listing => getCoordinates(listing.city));
      if (bounds.length > 0) {
        const map = mapRef.current;
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [listings]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg" data-testid="map-container">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className="w-full h-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings.map((listing) => {
          const coords = getCoordinates(listing.city);
          return (
            <Marker 
              key={listing.id} 
              position={coords}
              icon={createCustomIcon()}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-[200px]">
                  <h4 className="font-semibold text-base mb-1">{listing.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{listing.city}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-primary">{listing.monthly_rent}€</span>
                    <span className="text-xs text-muted-foreground">/mois</span>
                  </div>
                  <a 
                    href={`/listing/${listing.id}`}
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    Voir détails →
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
