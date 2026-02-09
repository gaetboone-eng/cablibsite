import React from 'react';
import { Filter } from 'lucide-react';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';

export const FilterPanel = ({ filters, onFilterChange }) => {
  const professions = [
    'Tous',
    'Médecin généraliste',
    'Infirmier(ère)',
    'Kinésithérapeute',
    'Ostéopathe',
    'Psychologue',
    'Dentiste',
    'Sage-femme',
    'Pharmacien',
    'Orthophoniste'
  ];

  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm" data-testid="filter-panel">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Filtres</h3>
      </div>

      <div className="space-y-5">
        <div>
          <Label htmlFor="structure-type" className="mb-2 block text-sm font-medium">Type de structure</Label>
          <Select 
            value={filters.structure_type || 'all'} 
            onValueChange={(value) => onFilterChange('structure_type', value === 'all' ? '' : value)}
          >
            <SelectTrigger id="structure-type" className="rounded-full" data-testid="structure-type-filter">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="MSP">Maison de Santé Pluriprofessionnelle</SelectItem>
              <SelectItem value="Cabinet">Cabinet médical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="profession" className="mb-2 block text-sm font-medium">Profession recherchée</Label>
          <Select 
            value={filters.profession || 'Tous'} 
            onValueChange={(value) => onFilterChange('profession', value === 'Tous' ? '' : value)}
          >
            <SelectTrigger id="profession" className="rounded-full" data-testid="profession-filter">
              <SelectValue placeholder="Toutes les professions" />
            </SelectTrigger>
            <SelectContent>
              {professions.map(prof => (
                <SelectItem key={prof} value={prof}>{prof}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="min-size" className="mb-2 block text-sm font-medium">Surface minimum (m²)</Label>
          <Input 
            id="min-size"
            type="number"
            value={filters.min_size || ''}
            onChange={(e) => onFilterChange('min_size', e.target.value)}
            placeholder="Ex: 50"
            className="rounded-xl"
            data-testid="min-size-filter"
          />
        </div>

        <div>
          <Label htmlFor="max-rent" className="mb-2 block text-sm font-medium">Loyer maximum (€/mois)</Label>
          <Input 
            id="max-rent"
            type="number"
            value={filters.max_rent || ''}
            onChange={(e) => onFilterChange('max_rent', e.target.value)}
            placeholder="Ex: 2000"
            className="rounded-xl"
            data-testid="max-rent-filter"
          />
        </div>
      </div>
    </div>
  );
};