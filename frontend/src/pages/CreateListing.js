import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { PhotoUploader } from '../components/PhotoUploader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { X, Plus, Car, Accessibility, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CreateListing({ user, onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    city: '',
    address: '',
    structure_type: 'Cabinet',
    size: '',
    monthly_rent: '',
    description: '',
    photos: [],
    professionals_present: [],
    profiles_searched: [],
    is_featured: false,
    // New fields
    equipments: [],
    has_parking: false,
    parking_spots: '',
    is_pmr_accessible: false,
    pmr_details: ''
  });

  const [profPresentInput, setProfPresentInput] = useState('');
  const [profSearchedInput, setProfSearchedInput] = useState('');

  const equipmentOptions = [
    "Salle d'attente",
    "Table d'examen",
    "Bureau de consultation",
    "Salle de soins",
    "Sanitaires patients",
    "Point d'eau",
    "Climatisation",
    "Chauffage",
    "Internet fibre",
    "Secrétariat partagé",
    "Salle de stérilisation",
    "Stockage matériel"
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEquipmentToggle = (equipment) => {
    const newEquipments = formData.equipments.includes(equipment)
      ? formData.equipments.filter(e => e !== equipment)
      : [...formData.equipments, equipment];
    setFormData({ ...formData, equipments: newEquipments });
  };

  const handlePhotosChange = (newPhotos) => {
    setFormData({ ...formData, photos: newPhotos });
  };

  const addProfPresent = () => {
    if (profPresentInput.trim()) {
      setFormData({
        ...formData,
        professionals_present: [...formData.professionals_present, profPresentInput.trim()]
      });
      setProfPresentInput('');
    }
  };

  const removeProfPresent = (index) => {
    setFormData({
      ...formData,
      professionals_present: formData.professionals_present.filter((_, i) => i !== index)
    });
  };

  const addProfSearched = () => {
    if (profSearchedInput.trim()) {
      setFormData({
        ...formData,
        profiles_searched: [...formData.profiles_searched, profSearchedInput.trim()]
      });
      setProfSearchedInput('');
    }
  };

  const removeProfSearched = (index) => {
    setFormData({
      ...formData,
      profiles_searched: formData.profiles_searched.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('cablib_token');
      const payload = {
        ...formData,
        size: parseInt(formData.size),
        monthly_rent: parseInt(formData.monthly_rent)
      };

      await axios.post(`${API}/listings`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Annonce créée avec succès !');
      navigate('/dashboard-proprietaire');
    } catch (error) {
      toast.error('Erreur lors de la création de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50" data-testid="create-listing-page">
      <Header user={user} onLogout={onLogout} />

      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">Créer une annonce</h1>
            <p className="text-lg text-muted-foreground">Proposez votre local à la location</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm space-y-6" data-testid="create-listing-form">
            <div>
              <Label htmlFor="title">Titre de l'annonce *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Cabinet médical lumineux centre-ville"
                className="rounded-xl mt-2"
                required
                data-testid="title-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Ex: Paris"
                  className="rounded-xl mt-2"
                  required
                  data-testid="city-input"
                />
              </div>
              <div>
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ex: 15 rue de la Santé"
                  className="rounded-xl mt-2"
                  required
                  data-testid="address-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="structure_type">Type de structure *</Label>
                <Select 
                  value={formData.structure_type} 
                  onValueChange={(value) => setFormData({ ...formData, structure_type: value })}
                >
                  <SelectTrigger id="structure_type" className="rounded-xl mt-2" data-testid="structure-type-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MSP">Maison de Santé Pluriprofessionnelle</SelectItem>
                    <SelectItem value="Cabinet">Cabinet médical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="size">Surface (m²) *</Label>
                <Input
                  id="size"
                  name="size"
                  type="number"
                  value={formData.size}
                  onChange={handleChange}
                  placeholder="Ex: 50"
                  className="rounded-xl mt-2"
                  required
                  data-testid="size-input"
                />
              </div>
              <div>
                <Label htmlFor="monthly_rent">Loyer (€/mois) *</Label>
                <Input
                  id="monthly_rent"
                  name="monthly_rent"
                  type="number"
                  value={formData.monthly_rent}
                  onChange={handleChange}
                  placeholder="Ex: 1500"
                  className="rounded-xl mt-2"
                  required
                  data-testid="rent-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez votre local, ses avantages, les équipements..."
                className="rounded-xl mt-2 min-h-32"
                required
                data-testid="description-input"
              />
            </div>

            {/* Photos Upload */}
            <div>
              <Label className="mb-3 block">Photos du local</Label>
              <PhotoUploader 
                photos={formData.photos}
                onPhotosChange={handlePhotosChange}
                maxPhotos={5}
              />
            </div>

            {/* Professionals Present */}
            <div>
              <Label>Professionnels déjà présents</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={profPresentInput}
                  onChange={(e) => setProfPresentInput(e.target.value)}
                  placeholder="Ex: Médecin généraliste"
                  className="rounded-xl"
                  data-testid="prof-present-input"
                />
                <Button type="button" onClick={addProfPresent} className="rounded-xl" data-testid="add-prof-present-button">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.professionals_present.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.professionals_present.map((prof, idx) => (
                    <span key={idx} className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {prof}
                      <button type="button" onClick={() => removeProfPresent(idx)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Profiles Searched */}
            <div>
              <Label>Profils recherchés</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={profSearchedInput}
                  onChange={(e) => setProfSearchedInput(e.target.value)}
                  placeholder="Ex: Kinésithérapeute"
                  className="rounded-xl"
                  data-testid="prof-searched-input"
                />
                <Button type="button" onClick={addProfSearched} className="rounded-xl" data-testid="add-prof-searched-button">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.profiles_searched.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.profiles_searched.map((prof, idx) => (
                    <span key={idx} className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {prof}
                      <button type="button" onClick={() => removeProfSearched(idx)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* NEW: Equipments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="h-4 w-4" style={{ color: '#1A1F3D' }} />
                <Label className="font-medium" style={{ color: '#1A1F3D' }}>Équipements disponibles</Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 rounded-xl" style={{ backgroundColor: 'rgba(26, 31, 61, 0.03)' }}>
                {equipmentOptions.map(equipment => (
                  <div key={equipment} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`equip-${equipment}`}
                      checked={formData.equipments.includes(equipment)}
                      onCheckedChange={() => handleEquipmentToggle(equipment)}
                    />
                    <label 
                      htmlFor={`equip-${equipment}`} 
                      className="text-sm cursor-pointer"
                      style={{ color: '#1A1F3D' }}
                    >
                      {equipment}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* NEW: Parking */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Car className="h-4 w-4" style={{ color: '#1A1F3D' }} />
                <Label className="font-medium" style={{ color: '#1A1F3D' }}>Parking</Label>
              </div>
              <div className="space-y-3 p-4 rounded-xl" style={{ backgroundColor: 'rgba(26, 31, 61, 0.03)' }}>
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="has_parking"
                    checked={formData.has_parking}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_parking: checked })}
                  />
                  <label htmlFor="has_parking" className="text-sm cursor-pointer" style={{ color: '#1A1F3D' }}>
                    Parking disponible
                  </label>
                </div>
                {formData.has_parking && (
                  <div>
                    <Label htmlFor="parking_spots" className="text-sm" style={{ color: '#5A6478' }}>Nombre de places</Label>
                    <Input
                      id="parking_spots"
                      name="parking_spots"
                      type="number"
                      value={formData.parking_spots}
                      onChange={handleChange}
                      placeholder="Ex: 5"
                      className="rounded-xl mt-1 w-32"
                      style={{ borderColor: '#E8E0D5' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* NEW: Accessibility PMR */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Accessibility className="h-4 w-4" style={{ color: '#1A1F3D' }} />
                <Label className="font-medium" style={{ color: '#1A1F3D' }}>Accessibilité</Label>
              </div>
              <div className="space-y-3 p-4 rounded-xl" style={{ backgroundColor: 'rgba(26, 31, 61, 0.03)' }}>
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="is_pmr_accessible"
                    checked={formData.is_pmr_accessible}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_pmr_accessible: checked })}
                  />
                  <label htmlFor="is_pmr_accessible" className="text-sm cursor-pointer" style={{ color: '#1A1F3D' }}>
                    Accessible aux Personnes à Mobilité Réduite (PMR)
                  </label>
                </div>
                {formData.is_pmr_accessible && (
                  <div>
                    <Label htmlFor="pmr_details" className="text-sm" style={{ color: '#5A6478' }}>Détails d'accessibilité</Label>
                    <Textarea
                      id="pmr_details"
                      name="pmr_details"
                      value={formData.pmr_details}
                      onChange={handleChange}
                      placeholder="Ex: Rampe d'accès, ascenseur, WC adaptés..."
                      className="rounded-xl mt-1"
                      style={{ borderColor: '#E8E0D5' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full py-6 shadow-lg shadow-primary/20"
                data-testid="submit-listing-button"
              >
                {loading ? 'Création...' : 'Créer l\'annonce'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard-proprietaire')}
                className="rounded-full px-8"
                data-testid="cancel-button"
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
