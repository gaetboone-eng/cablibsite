import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Rich marker component
const MarkerCard = ({ listing }) => {
  const imageUrl = listing.photos && listing.photos[0] 
    ? listing.photos[0] 
    : 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400';

  return (
    <div className="custom-marker-card" style={{ width: '200px', cursor: 'pointer' }}>
      <div style={{ position: 'relative', height: '120px', overflow: 'hidden' }}>
        <img 
          src={imageUrl} 
          alt={listing.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {listing.structure_type === 'MSP' && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: '#10b981',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            MSP
          </div>
        )}
        {listing.is_featured && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: '#f59e0b',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            ⭐ Vedette
          </div>
        )}
      </div>
      
      <div style={{ padding: '12px' }}>
        <h4 style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: '#1e293b',
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {listing.title}
        </h4>
        
        <div style={{ 
          fontSize: '12px', 
          color: '#64748b',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>📍</span>
          <span>{listing.city}</span>
          <span>•</span>
          <span>{listing.size}m²</span>
        </div>

        {listing.professionals_present && listing.professionals_present.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              fontSize: '11px',
              color: '#64748b',
              marginBottom: '4px',
              fontWeight: '500'
            }}>
              👥 {listing.professionals_present.length} professionnel{listing.professionals_present.length > 1 ? 's' : ''} présent{listing.professionals_present.length > 1 ? 's' : ''}
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '4px'
            }}>
              {listing.professionals_present.slice(0, 2).map((prof, idx) => (
                <span 
                  key={idx}
                  style={{
                    fontSize: '10px',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: '500'
                  }}
                >
                  {prof}
                </span>
              ))}
              {listing.professionals_present.length > 2 && (
                <span style={{
                  fontSize: '10px',
                  color: '#64748b',
                  padding: '2px 6px'
                }}>
                  +{listing.professionals_present.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#4f93ff',
          marginTop: '8px'
        }}>
          {listing.monthly_rent}€
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '400', 
            color: '#64748b' 
          }}>/mois</span>
        </div>
      </div>
    </div>
  );
};

// Create custom icon with rich card
const createRichIcon = (listing) => {
  const iconHtml = ReactDOMServer.renderToString(<MarkerCard listing={listing} />);
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-rich-marker',
    iconSize: [200, 200],
    iconAnchor: [100, 200],
    popupAnchor: [0, -200]
  });
};

export const MapView = ({ listings, center = [46.603354, 1.888334], zoom = 6 }) => {
  const mapRef = useRef(null);

  // Geocoding cache for French cities
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
    'Le Havre': [49.4944, 0.1079],
    'Saint-Étienne': [45.4397, 4.3872],
    'Toulon': [43.1242, 5.9280],
    'Grenoble': [45.1885, 5.7245],
    'Dijon': [47.3220, 5.0415],
    'Angers': [47.4784, -0.5632],
    'Nîmes': [43.8367, 4.3601],
    'Villeurbanne': [45.7667, 4.8794]
  };

  const getCoordinates = (city) => {
    return cityCoordinates[city] || center;
  };

  useEffect(() => {
    if (mapRef.current && listings.length > 0) {
      const bounds = listings.map(listing => getCoordinates(listing.city));
      if (bounds.length > 0) {
        try {
          mapRef.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 12 });
        } catch (e) {
          console.error('Error fitting bounds:', e);
        }
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
              icon={createRichIcon(listing)}
              eventHandlers={{
                click: () => {
                  window.location.href = `/listing/${listing.id}`;
                }
              }}
            >
              <Popup className="custom-popup" maxWidth={220}>
                <div className="p-2">
                  <Link 
                    to={`/listing/${listing.id}`}
                    className="inline-block w-full text-center bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Voir les détails →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
