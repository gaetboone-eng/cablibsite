import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { RentabilityCalculator } from '../components/RentabilityCalculator';
import { ScheduleVisitModal } from '../components/ScheduleVisitModal';
import { ApplicationModal } from '../components/ApplicationModal';
import { MessageTemplates } from '../components/MessageTemplates';
import { Button } from '../components/ui/button';
import { MapPin, Home, Users, TrendingUp, Mail, Heart, ArrowLeft, Building2, Calculator, Calendar, FileText, MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ListingDetail({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchListing();
    if (user) {
      checkFavorite();
    }
  }, [id, user]);

  // Track view when listing is loaded
  useEffect(() => {
    if (listing) {
      trackView();
    }
  }, [listing]);

  const trackView = async () => {
    try {
      await axios.post(`${API}/listings/${id}/view`, {
        user_id: user?.id || null
      });
    } catch (error) {
      // Silent fail for view tracking
    }
  };

  const fetchListing = async () => {
    try {
      const response = await axios.get(`${API}/listings/${id}`);
      setListing(response.data);
    } catch (error) {
      toast.error('Annonce introuvable');
      navigate('/search');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const token = localStorage.getItem('cablib_token');
      const response = await axios.get(`${API}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const favorited = response.data.some(fav => fav.listing_id === id);
      setIsFavorite(favorited);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour ajouter aux favoris');
      navigate('/auth');
      return;
    }

    try {
      const token = localStorage.getItem('cablib_token');
      if (isFavorite) {
        await axios.delete(`${API}/favorites/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Retiré des favoris');
        setIsFavorite(false);
      } else {
        await axios.post(`${API}/favorites`, 
          { listing_id: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Ajouté aux favoris');
        setIsFavorite(true);
      }
    } catch (error) {
      toast.error('Erreur lors de la modification des favoris');
    }
  };

  const handleContact = () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour contacter le propriétaire');
      navigate('/auth');
      return;
    }
    setShowMessageModal(true);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast.error('Veuillez écrire un message');
      return;
    }

    // Check if user is verified
    if (!user.is_verified) {
      toast.error('Votre profil doit être vérifié pour contacter un propriétaire');
      return;
    }

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('cablib_token');
      await axios.post(`${API}/messages`, {
        receiver_id: listing.owner_id,
        listing_id: listing.id,
        content: messageContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Message envoyé !');
      setShowMessageModal(false);
      setMessageContent('');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTemplateSelect = (message) => {
    setMessageContent(message);
  };

  const handleApply = () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour postuler');
      navigate('/auth');
      return;
    }
    if (user.user_type !== 'locataire') {
      toast.error('Seuls les locataires peuvent postuler');
      return;
    }
    // Check if user is verified
    if (!user.is_verified) {
      toast.error('Votre profil doit être vérifié pour postuler. Ajoutez un numéro RPPS ou attendez la validation administrateur.');
      return;
    }
    setShowApplicationModal(true);
  };

  const handleContact = () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour contacter le propriétaire');
      navigate('/auth');
      return;
    }
    // Check if user is verified
    if (!user.is_verified) {
      toast.error('Votre profil doit être vérifié pour contacter un propriétaire');
      return;
    }
    setShowMessageModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const images = listing.photos && listing.photos.length > 0 
    ? listing.photos 
    : ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200'];

  return (
    <div className="min-h-screen bg-stone-50" data-testid="listing-detail-page">
      <Header user={user} onLogout={onLogout} />

      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6 gap-2"
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          {/* Image Gallery */}
          <div className="mb-8" data-testid="image-gallery">
            <div className="relative h-96 rounded-2xl overflow-hidden mb-4">
              <img 
                src={images[selectedImageIndex]} 
                alt={listing.title}
                className="w-full h-full object-cover"
                data-testid="main-image"
              />
              {listing.is_featured && (
                <div className="absolute top-4 right-4 bg-accent text-white px-4 py-2 rounded-full font-medium shadow-lg">
                  En vedette
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 h-20 w-32 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx ? 'border-primary' : 'border-transparent'
                    }`}
                    data-testid={`thumbnail-${idx}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2" data-testid="listing-main-content">
              <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-foreground mb-3" data-testid="listing-title-detail">
                      {listing.title}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-5 w-5" />
                      <span className="text-lg" data-testid="listing-address">{listing.address}, {listing.city}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 py-6 border-y border-border">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-xl p-3">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-semibold text-foreground" data-testid="structure-type-detail">{listing.structure_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-xl p-3">
                      <Home className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Surface</p>
                      <p className="font-semibold text-foreground" data-testid="size-detail">{listing.size} m²</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Description</h2>
                  <p className="text-base leading-relaxed text-muted-foreground" data-testid="listing-description">
                    {listing.description}
                  </p>
                </div>
              </div>

              {/* Professionals Present */}
              {listing.professionals_present && listing.professionals_present.length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm mb-6" data-testid="professionals-present-section">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-semibold text-foreground">Professionnels présents</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {listing.professionals_present.map((prof, idx) => (
                      <span key={idx} className="bg-secondary/50 text-secondary-foreground px-4 py-2 rounded-full font-medium">
                        {prof}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Profiles Searched */}
              {listing.profiles_searched && listing.profiles_searched.length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm" data-testid="profiles-searched-section">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-semibold text-foreground">Profils recherchés</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {listing.profiles_searched.map((profile, idx) => (
                      <span key={idx} className="bg-accent/10 text-accent px-4 py-2 rounded-full font-medium">
                        {profile}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24" data-testid="contact-sidebar">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Loyer mensuel</p>
                  <p className="text-4xl font-bold text-foreground" data-testid="rent-detail">
                    {listing.monthly_rent}€
                    <span className="text-lg font-normal text-muted-foreground">/mois</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleApply}
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-6 shadow-lg shadow-primary/20"
                    data-testid="apply-button"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Postuler
                  </Button>

                  <Button
                    onClick={handleContact}
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary/10 rounded-full py-6"
                    data-testid="contact-button"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Contacter
                  </Button>

                  <Button
                    onClick={() => setShowVisitModal(true)}
                    className="w-full bg-accent hover:bg-accent/90 text-white rounded-full py-6 shadow-lg"
                    data-testid="schedule-visit-button"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Planifier une visite
                  </Button>

                  <Button
                    onClick={toggleFavorite}
                    variant="outline"
                    className="w-full rounded-full py-6"
                    data-testid="favorite-button"
                  >
                    <Heart className={`mr-2 h-5 w-5 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
                    {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </Button>

                  <Button
                    onClick={() => setShowCalculator(true)}
                    variant="outline"
                    className="w-full rounded-full py-6 border-primary text-primary hover:bg-primary/10"
                    data-testid="calculator-button"
                  >
                    <Calculator className="mr-2 h-5 w-5" />
                    Calculer la rentabilité
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <RentabilityCalculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        listing={listing}
      />
      
      <ScheduleVisitModal
        isOpen={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        listing={listing}
      />
      
      <ApplicationModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        listing={listing}
      />

      {/* Message Modal with Templates */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden" style={{ backgroundColor: '#FAF7F2' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#E8E0D5' }}>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#1A1F3D' }}>Envoyer un message</h2>
                <p className="text-sm" style={{ color: '#5A6478' }}>{listing.title}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowMessageModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Templates */}
              <MessageTemplates 
                onSelectTemplate={handleTemplateSelect}
                listingTitle={listing.title}
              />

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1A1F3D' }}>
                  Votre message
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full border rounded-xl p-4 min-h-[180px] focus:outline-none focus:ring-2 resize-none"
                  style={{ 
                    borderColor: '#E8E0D5', 
                    backgroundColor: '#FAF7F2',
                    color: '#1A1F3D'
                  }}
                  placeholder="Écrivez votre message ou sélectionnez un modèle ci-dessus..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 rounded-full py-6"
                  style={{ borderColor: '#E8E0D5' }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !messageContent.trim()}
                  className="flex-1 btn-navy rounded-full py-6"
                >
                  {sendingMessage ? 'Envoi...' : 'Envoyer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
