import React, { useState } from 'react';
import { X, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CreateAlertModal = ({ isOpen, onClose, initialCriteria = {} }) => {
  const [formData, setFormData] = useState({
    name: '',
    city: initialCriteria.city || '',
    structure_type: initialCriteria.structure_type || '',
    profession: initialCriteria.profession || '',
    max_rent: initialCriteria.max_rent || '',
    min_size: initialCriteria.min_size || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('cablib_token');
      await axios.post(
        `${API}/alerts`,
        {
          name: formData.name,
          city: formData.city || null,
          structure_type: formData.structure_type || null,
          profession: formData.profession || null,
          max_rent: formData.max_rent ? parseInt(formData.max_rent) : null,
          min_size: formData.min_size ? parseInt(formData.min_size) : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Alerte créée ! Vous serez notifié des nouvelles annonces');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la création de l\'alerte');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-3">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Créer une alerte</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>

        <p className="text-muted-foreground mb-6">
          Recevez une notification quand une nouvelle annonce correspond à vos critères
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="alert-name">Nom de l'alerte *</Label>
            <Input
              id="alert-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Cabinets à Paris"
              className="rounded-xl mt-2"
              required
            />
          </div>

          <div>
            <Label htmlFor="alert-city">Ville</Label>
            <Input
              id="alert-city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Ex: Paris, Lyon..."
              className="rounded-xl mt-2"
            />
          </div>

          <div>
            <Label htmlFor="alert-structure">Type de structure</Label>
            <Select 
              value={formData.structure_type} 
              onValueChange={(value) => setFormData({ ...formData, structure_type: value })}
            >
              <SelectTrigger id="alert-structure" className="rounded-xl mt-2">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les types</SelectItem>
                <SelectItem value="MSP">Maison de Santé Pluriprofessionnelle</SelectItem>
                <SelectItem value="Cabinet">Cabinet médical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="alert-max-rent">Loyer max (€)</Label>
              <Input
                id="alert-max-rent"
                type="number"
                value={formData.max_rent}
                onChange={(e) => setFormData({ ...formData, max_rent: e.target.value })}
                placeholder="2000"
                className="rounded-xl mt-2"
              />
            </div>
            <div>
              <Label htmlFor="alert-min-size">Surface min (m²)</Label>
              <Input
                id="alert-min-size"
                type="number"
                value={formData.min_size}
                onChange={(e) => setFormData({ ...formData, min_size: e.target.value })}
                placeholder="40"
                className="rounded-xl mt-2"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full py-6"
            >
              {loading ? 'Création...' : 'Créer l\'alerte'}
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
