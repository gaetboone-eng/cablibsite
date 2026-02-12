import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { 
  FileText, Clock, CheckCircle, XCircle, 
  MapPin, Home, Loader2, ArrowLeft, Eye,
  FileSearch, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ApplicationsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchApplications();
  }, [user, navigate]);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('cablib_token');
      const endpoint = user.user_type === 'proprietaire' 
        ? '/applications/received' 
        : '/applications/mine';
      
      const response = await axios.get(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des candidatures');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (appId, status) => {
    try {
      const token = localStorage.getItem('cablib_token');
      await axios.put(
        `${API}/applications/${appId}/status?status=${status}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(status === 'accepted' ? 'Candidature acceptée' : 'Candidature refusée');
      fetchApplications();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Clock className="h-3 w-3" />
            En attente
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="h-3 w-3" />
            Acceptée
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <XCircle className="h-3 w-3" />
            Refusée
          </span>
        );
      default:
        return null;
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      <Header user={user} onLogout={onLogout} />

      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-5xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                {user.user_type === 'proprietaire' ? 'Candidatures reçues' : 'Mes candidatures'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {applications.length} candidature{applications.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['all', 'pending', 'accepted', 'rejected'].map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
                className={`rounded-full ${filter === f ? 'bg-primary text-white' : ''}`}
              >
                {f === 'all' && 'Toutes'}
                {f === 'pending' && 'En attente'}
                {f === 'accepted' && 'Acceptées'}
                {f === 'rejected' && 'Refusées'}
              </Button>
            ))}
          </div>

          {/* Applications List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <FileSearch className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Aucune candidature {filter !== 'all' && `${filter === 'pending' ? 'en attente' : filter === 'accepted' ? 'acceptée' : 'refusée'}`}
              </h3>
              <p className="text-muted-foreground">
                {user.user_type === 'proprietaire' 
                  ? 'Les candidatures apparaîtront ici lorsque des locataires postuleront à vos annonces.'
                  : 'Postulez à des annonces pour voir vos candidatures ici.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <div 
                  key={app.id} 
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 
                            className="text-xl font-semibold text-foreground hover:text-primary cursor-pointer"
                            onClick={() => navigate(`/listing/${app.listing_id}`)}
                          >
                            {app.listing_title}
                          </h3>
                          {user.user_type === 'proprietaire' && (
                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                              <span className="font-medium text-foreground">{app.user_name}</span>
                              • {app.user_profession}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(app.status)}
                      </div>

                      {app.message && (
                        <div className="bg-secondary/30 rounded-xl p-4 mb-4">
                          <p className="text-sm text-muted-foreground italic">"{app.message}"</p>
                        </div>
                      )}

                      {/* Documents */}
                      {app.documents && app.documents.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-foreground mb-2">
                            Documents joints ({app.documents.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {app.documents.map((doc, idx) => (
                              <a
                                key={idx}
                                href={`${BACKEND_URL}${doc.file_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                              >
                                <FileText className="h-3 w-3" />
                                {doc.original_filename.length > 20 
                                  ? doc.original_filename.substring(0, 20) + '...' 
                                  : doc.original_filename
                                }
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground">
                        Envoyée le {new Date(app.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Actions for Owner */}
                    {user.user_type === 'proprietaire' && app.status === 'pending' && (
                      <div className="flex md:flex-col gap-2">
                        <Button
                          onClick={() => updateApplicationStatus(app.id, 'accepted')}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Accepter
                        </Button>
                        <Button
                          onClick={() => updateApplicationStatus(app.id, 'rejected')}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Refuser
                        </Button>
                        <Button
                          onClick={() => navigate(`/messages?to=${app.user_id}&listing=${app.listing_id}`)}
                          variant="outline"
                          className="rounded-full"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Contacter
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
