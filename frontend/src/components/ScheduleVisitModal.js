import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ScheduleVisitModal = ({ isOpen, onClose, listing }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast.error('Veuillez sélectionner une date et une heure');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('cablib_token');
      await axios.post(
        `${API}/visits`,
        {
          listing_id: listing.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          message: message || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Demande de visite envoyée au propriétaire !');
      onClose();
      setSelectedDate(null);
      setSelectedTime('');
      setMessage('');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-3">
              <CalendarIcon className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Planifier une visite</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="bg-primary/5 rounded-xl p-4 mb-6">
          <p className="text-sm text-muted-foreground">Bien concerné</p>
          <p className="text-lg font-semibold text-foreground">{listing?.title}</p>
          <p className="text-sm text-muted-foreground">{listing?.address}, {listing?.city}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="mb-3 block">Sélectionnez une date</Label>
            <div className="border border-border rounded-xl p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                locale={fr}
                className="mx-auto"
              />
            </div>
          </div>

          {selectedDate && (
            <div>
              <Label className="mb-3 block flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Choisissez un créneau horaire
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedTime === time
                        ? 'bg-primary text-white border-primary'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="visit-message">Message pour le propriétaire (optionnel)</Label>
            <Textarea
              id="visit-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Présentez-vous et indiquez vos disponibilités..."
              className="rounded-xl mt-2 min-h-24"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading || !selectedDate || !selectedTime}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full py-6"
            >
              {loading ? 'Envoi...' : 'Envoyer la demande'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full px-8"
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
