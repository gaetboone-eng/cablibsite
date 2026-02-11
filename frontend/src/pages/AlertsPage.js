import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { CreateAlertModal } from '../components/CreateAlertModal';
import { Bell, BellOff, Trash2, Plus, MapPin, Building2, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AlertsPage({ user, onLogout }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.user_type !== 'locataire') {
      navigate('/');
      return;
    }
    fetchAlerts();
  }, [user, navigate]);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('cablib_token');
      const response = await axios.get(`${API}/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des alertes');
    } finally {
      setLoading(false);
    }
  };

  const toggleAlert = async (alertId, currentStatus) => {
    try {
      const token = localStorage.getItem('cablib_token');
      await axios.put(
        `${API}/alerts/${alertId}?active=${!currentStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(currentStatus ? 'Alerte désactivée' : 'Alerte activée');
      fetchAlerts();
    } catch (error) {
      toast.error('Erreur lors de la modification de l\'alerte');
    }
  };

  const deleteAlert = async (alertId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) return;

    try {
      const token = localStorage.getItem('cablib_token');
      await axios.delete(`${API}/alerts/${alertId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Alerte supprimée');
      fetchAlerts();
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'alerte');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={onLogout} />

      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-3 flex items-center gap-3">
                <Bell className="h-10 w-10 text-primary" />
                Mes alertes
              </h1>
              <p className="text-lg text-muted-foreground">
                Gérez vos alertes et recevez des notifications pour les nouvelles annonces
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-6 shadow-lg gap-2"
            >
              <Plus className="h-5 w-5" />
              Nouvelle alerte
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Aucune alerte</h3>
              <p className="text-muted-foreground mb-6">
                Créez votre première alerte pour être notifié des nouvelles annonces
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3"
              >
                Créer une alerte
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white rounded-2xl p-6 shadow-sm border ${
                    alert.active ? 'border-primary/20' : 'border-border'
                  } transition-all`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-foreground">{alert.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            alert.active
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {alert.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Créée le {new Date(alert.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleAlert(alert.id, alert.active)}
                        className="rounded-full"
                      >
                        {alert.active ? (
                          <Bell className="h-5 w-5 text-primary" />
                        ) : (
                          <BellOff className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAlert(alert.id)}
                        className="rounded-full text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {alert.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{alert.city}</span>
                      </div>
                    )}
                    {alert.structure_type && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span>{alert.structure_type}</span>
                      </div>
                    )}
                    {alert.max_rent && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span>≤ {alert.max_rent}€/mois</span>
                      </div>
                    )}
                    {alert.min_size && (
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-bold">📏</span>
                        <span>≥ {alert.min_size}m²</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateAlertModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchAlerts();
        }}
      />
    </div>
  );
}
