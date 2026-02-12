import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, Accessibility, Car, Stethoscope } from 'lucide-react';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const FilterPanel = ({ filters, onFilterChange }) => {
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [selectedEquipments, setSelectedEquipments] = useState([]);

  useEffect(() => {
    fetchEquipmentOptions();
  }, []);

  const fetchEquipmentOptions = async () => {
    try {
      const response = await axios.get(`${API}/equipment-options`);
      setEquipmentOptions(response.data.equipments || []);
    } catch (error) {
      // Use default equipment list if API fails
      setEquipmentOptions([
        "Salle d'attente",
        "Table d'examen",
        "Bureau de consultation",
        "Salle de soins",
        "Sanitaires patients",
        "Point d'eau",
        "Climatisation",
        "Chauffage",
        "Internet fibre",
        "Secrétariat partagé"
      ]);
    }
  };

  const professions = [
    'Tous',
    'Médecin généraliste',
    'Médecin spécialiste',
    'Infirmier(ère)',
    'Kinésithérapeute',
    'Ostéopathe',
    'Psychologue',
    'Dentiste',
    'Sage-femme',
    'Pharmacien',
    'Orthophoniste',
    'Diététicien(ne)',
    'Pédicure-podologue',
    'Ergothérapeute'
  ];

  const handleEquipmentToggle = (equipment) => {
    const newSelected = selectedEquipments.includes(equipment)
      ? selectedEquipments.filter(e => e !== equipment)
      : [...selectedEquipments, equipment];
    
    setSelectedEquipments(newSelected);
    onFilterChange('equipments', newSelected.join(','));
  };

  return (
    <div className="rounded-2xl border p-6 shadow-sm" style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }} data-testid="filter-panel">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-5 w-5" style={{ color: '#1A1F3D' }} />
        <h3 className="text-lg font-semibold" style={{ color: '#1A1F3D' }}>Filtres</h3>
      </div>

      <div className="space-y-5">
        {/* Structure Type */}
        <div>
          <Label htmlFor="structure-type" className="mb-2 block text-sm font-medium" style={{ color: '#1A1F3D' }}>Type de structure</Label>
          <Select 
            value={filters.structure_type || 'all'} 
            onValueChange={(value) => onFilterChange('structure_type', value === 'all' ? '' : value)}
          >
            <SelectTrigger id="structure-type" className="rounded-full" style={{ borderColor: '#E8E0D5', backgroundColor: '#FAF7F2' }} data-testid="structure-type-filter">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: '#FAF7F2' }}>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="MSP">Maison de Santé Pluriprofessionnelle</SelectItem>
              <SelectItem value="Cabinet">Cabinet médical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profession */}
        <div>
          <Label htmlFor="profession" className="mb-2 block text-sm font-medium" style={{ color: '#1A1F3D' }}>Profession recherchée</Label>
          <Select 
            value={filters.profession || 'Tous'} 
            onValueChange={(value) => onFilterChange('profession', value === 'Tous' ? '' : value)}
          >
            <SelectTrigger id="profession" className="rounded-full" style={{ borderColor: '#E8E0D5', backgroundColor: '#FAF7F2' }} data-testid="profession-filter">
              <SelectValue placeholder="Toutes les professions" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: '#FAF7F2' }}>
              {professions.map(prof => (
                <SelectItem key={prof} value={prof}>{prof}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Min Size */}
        <div>
          <Label htmlFor="min-size" className="mb-2 block text-sm font-medium" style={{ color: '#1A1F3D' }}>Surface minimum (m²)</Label>
          <Input 
            id="min-size"
            type="number"
            value={filters.min_size || ''}
            onChange={(e) => onFilterChange('min_size', e.target.value)}
            placeholder="Ex: 50"
            className="rounded-xl"
            style={{ borderColor: '#E8E0D5', backgroundColor: '#FAF7F2' }}
            data-testid="min-size-filter"
          />
        </div>

        {/* Max Rent */}
        <div>
          <Label htmlFor="max-rent" className="mb-2 block text-sm font-medium" style={{ color: '#1A1F3D' }}>Loyer maximum (€/mois)</Label>
          <Input 
            id="max-rent"
            type="number"
            value={filters.max_rent || ''}
            onChange={(e) => onFilterChange('max_rent', e.target.value)}
            placeholder="Ex: 2000"
            className="rounded-xl"
            style={{ borderColor: '#E8E0D5', backgroundColor: '#FAF7F2' }}
            data-testid="max-rent-filter"
          />
        </div>

        {/* Divider */}
        <div className="h-px my-4" style={{ backgroundColor: '#E8E0D5' }}></div>

        {/* NEW: Accessibility PMR */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Accessibility className="h-4 w-4" style={{ color: '#1A1F3D' }} />
            <Label className="text-sm font-medium" style={{ color: '#1A1F3D' }}>Accessibilité</Label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(26, 31, 61, 0.03)' }}>
            <Checkbox 
              id="pmr"
              checked={filters.is_pmr_accessible === 'true'}
              onCheckedChange={(checked) => onFilterChange('is_pmr_accessible', checked ? 'true' : '')}
            />
            <label htmlFor="pmr" className="text-sm cursor-pointer" style={{ color: '#1A1F3D' }}>
              Accessible PMR (Personnes à Mobilité Réduite)
            </label>
          </div>
        </div>

        {/* NEW: Parking */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Car className="h-4 w-4" style={{ color: '#1A1F3D' }} />
            <Label className="text-sm font-medium" style={{ color: '#1A1F3D' }}>Parking</Label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(26, 31, 61, 0.03)' }}>
            <Checkbox 
              id="parking"
              checked={filters.has_parking === 'true'}
              onCheckedChange={(checked) => onFilterChange('has_parking', checked ? 'true' : '')}
            />
            <label htmlFor="parking" className="text-sm cursor-pointer" style={{ color: '#1A1F3D' }}>
              Parking disponible
            </label>
          </div>
        </div>

        {/* NEW: Equipment Filters */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="h-4 w-4" style={{ color: '#1A1F3D' }} />
            <Label className="text-sm font-medium" style={{ color: '#1A1F3D' }}>Équipements</Label>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 rounded-xl" style={{ backgroundColor: 'rgba(26, 31, 61, 0.03)' }}>
            {equipmentOptions.slice(0, 8).map(equipment => (
              <div key={equipment} className="flex items-center space-x-3">
                <Checkbox 
                  id={`equipment-${equipment}`}
                  checked={selectedEquipments.includes(equipment)}
                  onCheckedChange={() => handleEquipmentToggle(equipment)}
                />
                <label 
                  htmlFor={`equipment-${equipment}`} 
                  className="text-sm cursor-pointer"
                  style={{ color: '#1A1F3D' }}
                >
                  {equipment}
                </label>
              </div>
            ))}
          </div>
          {selectedEquipments.length > 0 && (
            <p className="text-xs mt-2" style={{ color: '#5A6478' }}>
              {selectedEquipments.length} équipement(s) sélectionné(s)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
