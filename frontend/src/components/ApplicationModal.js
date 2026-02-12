import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { DocumentUpload } from './DocumentUpload';
import { X, Send, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function ApplicationModal({ isOpen, onClose, listing }) {
  const [message, setMessage] = useState('');
  const [documents, setDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (documents.length === 0) {
      toast.error('Veuillez télécharger au moins un document avant de postuler');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('cablib_token');
      await axios.post(
        `${API}/applications`,
        {
          listing_id: listing.id,
          message: message || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSubmitted(true);
      toast.success('Candidature envoyée avec succès !');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi de la candidature');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Postuler à cette annonce</h2>
            <p className="text-muted-foreground">{listing.title}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {submitted ? (
            <div className="text-center py-12">
              <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Candidature envoyée !</h3>
              <p className="text-muted-foreground mb-6">
                Le propriétaire a reçu votre dossier et reviendra vers vous rapidement.
              </p>
              <Button onClick={handleClose} className="bg-primary text-white rounded-full px-8">
                Fermer
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Listing Summary */}
              <div className="bg-secondary/30 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-xl p-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{listing.title}</h4>
                    <p className="text-sm text-muted-foreground">{listing.address}, {listing.city}</p>
                    <p className="text-primary font-semibold mt-1">{listing.monthly_rent}€/mois</p>
                  </div>
                </div>
              </div>

              {/* Documents Upload */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Vos documents
                </h3>
                <DocumentUpload onDocumentsChange={setDocuments} />
              </div>

              {/* Message */}
              <div>
                <label className="block font-semibold text-foreground mb-2">
                  Message au propriétaire (optionnel)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-border rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Présentez-vous et expliquez pourquoi vous êtes intéressé par ce local..."
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 rounded-full py-6"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || documents.length === 0}
                  className="flex-1 bg-primary text-white rounded-full py-6 shadow-lg shadow-primary/20"
                >
                  {submitting ? (
                    'Envoi en cours...'
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Envoyer ma candidature
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
