import React, { useState, useEffect } from 'react';
import { X, Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export const RentabilityCalculator = ({ isOpen, onClose, listing }) => {
  const [formData, setFormData] = useState({
    monthly_ca: '',
    occupation_rate: 80,
    monthly_charges: '',
    consultation_price: '',
    consultations_per_day: '',
    working_days: 20
  });

  const [results, setResults] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-fill charges with listing rent
      setFormData(prev => ({
        ...prev,
        monthly_charges: listing?.monthly_rent || ''
      }));
    }
  }, [isOpen, listing]);

  const calculate = () => {
    const rent = listing.monthly_rent || 0;
    const charges = parseFloat(formData.monthly_charges) || rent;
    const ca = parseFloat(formData.monthly_ca) || 0;
    const occupationRate = parseFloat(formData.occupation_rate) || 0;
    const consultationPrice = parseFloat(formData.consultation_price) || 0;
    const consultationsPerDay = parseFloat(formData.consultations_per_day) || 0;
    const workingDays = parseFloat(formData.working_days) || 20;

    // Calculate CA if not provided
    let estimatedCA = ca;
    if (!ca && consultationPrice && consultationsPerDay && workingDays) {
      estimatedCA = consultationPrice * consultationsPerDay * workingDays * (occupationRate / 100);
    }

    const netMargin = estimatedCA - charges;
    const profitabilityRate = estimatedCA > 0 ? ((netMargin / estimatedCA) * 100) : 0;
    const breakEvenConsultations = consultationPrice > 0 ? Math.ceil(charges / consultationPrice) : 0;

    setResults({
      estimatedCA: estimatedCA.toFixed(0),
      totalCharges: charges.toFixed(0),
      netMargin: netMargin.toFixed(0),
      profitabilityRate: profitabilityRate.toFixed(1),
      breakEvenConsultations,
      rentPercentage: estimatedCA > 0 ? ((rent / estimatedCA) * 100).toFixed(1) : 0
    });
  };

  useEffect(() => {
    if (formData.monthly_ca || (formData.consultation_price && formData.consultations_per_day)) {
      calculate();
    }
  }, [formData]);

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
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Calculateur de rentabilit\u00e9</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="bg-primary/5 rounded-xl p-4 mb-6">
          <p className="text-sm text-foreground">
            <strong>{listing?.title}</strong> - {listing?.city}
          </p>
          <p className="text-2xl font-bold text-primary mt-2">
            {listing?.monthly_rent}€ <span className="text-sm font-normal text-muted-foreground">/mois</span>
          </p>
        </div>

        <div className="space-y-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="consultation-price">Prix consultation (€)</Label>
              <Input
                id="consultation-price"
                type="number"
                value={formData.consultation_price}
                onChange={(e) => setFormData({ ...formData, consultation_price: e.target.value })}
                placeholder="50"
                className="rounded-xl mt-2"
              />
            </div>
            <div>
              <Label htmlFor="consultations-per-day">Consultations / jour</Label>
              <Input
                id="consultations-per-day"
                type="number"
                value={formData.consultations_per_day}
                onChange={(e) => setFormData({ ...formData, consultations_per_day: e.target.value })}
                placeholder="10"
                className="rounded-xl mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="working-days">Jours travaillés / mois</Label>
              <Input
                id="working-days"
                type="number"
                value={formData.working_days}
                onChange={(e) => setFormData({ ...formData, working_days: e.target.value })}
                placeholder="20"
                className="rounded-xl mt-2"
              />
            </div>
            <div>
              <Label htmlFor="occupation-rate">Taux occupation (%)</Label>
              <Input
                id="occupation-rate"
                type="number"
                value={formData.occupation_rate}
                onChange={(e) => setFormData({ ...formData, occupation_rate: e.target.value })}
                placeholder="80"
                min="0"
                max="100"
                className="rounded-xl mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="monthly-charges">Charges mensuelles totales (€)</Label>
            <Input
              id="monthly-charges"
              type="number"
              value={formData.monthly_charges}
              onChange={(e) => setFormData({ ...formData, monthly_charges: e.target.value })}
              placeholder={listing?.monthly_rent}
              className="rounded-xl mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Loyer + charges + assurances + équipements
            </p>
          </div>
        </div>

        {results && (
          <div className="space-y-4">
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Résultats
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">CA mensuel estimé</p>
                  <p className="text-2xl font-bold text-foreground">{results.estimatedCA}€</p>
                </div>
                
                <div className="bg-secondary rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Charges totales</p>
                  <p className="text-2xl font-bold text-foreground">{results.totalCharges}€</p>
                </div>
                
                <div className={`rounded-xl p-4 ${parseFloat(results.netMargin) > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-sm text-muted-foreground mb-1">Marge nette</p>
                  <p className={`text-2xl font-bold ${parseFloat(results.netMargin) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {results.netMargin}€
                  </p>
                </div>
                
                <div className="bg-accent/10 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Taux rentabilité</p>
                  <p className="text-2xl font-bold text-accent">{results.profitabilityRate}%</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Loyer représente <strong>{results.rentPercentage}%</strong> du CA</p>
                    <p>• Seuil de rentabilité : <strong>{results.breakEvenConsultations}</strong> consultations/mois</p>
                    <p className="text-xs mt-2">💡 Recommandation : un loyer ne devrait pas dépasser 20-25% du CA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 rounded-full"
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};
