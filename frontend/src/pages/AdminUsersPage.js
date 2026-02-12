import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { 
  Users, CheckCircle, XCircle, Clock, Loader2, 
  ArrowLeft, Shield, User, Mail, Briefcase,
  UserCheck, UserX
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminUsersPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingUser, setProcessingUser] = useState(null);

  useEffect(() => {
    if (!user || user.user_type !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('cablib_token');
      const response = await axios.get(`${API}/admin/all-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId, action) => {
    setProcessingUser(userId);
    try {
      const token = localStorage.getItem('cablib_token');
      await axios.put(`${API}/admin/verify-user/${userId}?action=${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(action === 'verify' ? 'Utilisateur vérifié' : 'Utilisateur rejeté');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setProcessingUser(null);
    }
  };

  const getStatusBadge = (user) => {
    if (user.verification_status === 'verified' || user.is_verified) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <CheckCircle className="h-3 w-3" />
          Vérifié
        </span>
      );
    }
    if (user.verification_status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          <XCircle className="h-3 w-3" />
          Rejeté
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
        <Clock className="h-3 w-3" />
        En attente
      </span>
    );
  };

  const filteredUsers = data?.users?.filter(u => {
    if (filter === 'all') return true;
    if (filter === 'pending') return u.verification_status === 'pending' || (!u.is_verified && u.verification_status !== 'rejected');
    if (filter === 'verified') return u.is_verified || u.verification_status === 'verified';
    if (filter === 'rejected') return u.verification_status === 'rejected';
    return true;
  }) || [];

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E6' }}>
      <Header user={user} onLogout={onLogout} />

      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: '#1A1F3D' }}>
                <Shield className="h-8 w-8" />
                Gestion des utilisateurs
              </h1>
              <p className="mt-1" style={{ color: '#5A6478' }}>
                Validation des profils sans RPPS
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#1A1F3D' }} />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Users} label="Total" value={data?.stats?.total || 0} />
                <StatCard icon={CheckCircle} label="Vérifiés" value={data?.stats?.verified || 0} color="green" />
                <StatCard icon={Clock} label="En attente" value={data?.stats?.pending || 0} color="yellow" />
                <StatCard icon={XCircle} label="Rejetés" value={data?.stats?.rejected || 0} color="red" />
              </div>

              {/* Filters */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[
                  { key: 'pending', label: 'En attente', count: data?.stats?.pending },
                  { key: 'verified', label: 'Vérifiés', count: data?.stats?.verified },
                  { key: 'rejected', label: 'Rejetés', count: data?.stats?.rejected },
                  { key: 'all', label: 'Tous', count: data?.stats?.total }
                ].map(f => (
                  <Button
                    key={f.key}
                    variant={filter === f.key ? 'default' : 'outline'}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-full ${filter === f.key ? 'btn-navy' : ''}`}
                    style={filter !== f.key ? { borderColor: '#E8E0D5' } : {}}
                  >
                    {f.label} ({f.count || 0})
                  </Button>
                ))}
              </div>

              {/* Users List */}
              {filteredUsers.length === 0 ? (
                <div className="rounded-2xl p-12 text-center border" style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }}>
                  <Users className="h-12 w-12 mx-auto mb-4" style={{ color: '#5A6478' }} />
                  <p style={{ color: '#5A6478' }}>Aucun utilisateur dans cette catégorie</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map(u => (
                    <div
                      key={u.id}
                      className="rounded-2xl p-5 border"
                      style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(26, 31, 61, 0.1)' }}>
                            <User className="h-6 w-6" style={{ color: '#1A1F3D' }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold" style={{ color: '#1A1F3D' }}>
                                {u.first_name} {u.last_name}
                              </h3>
                              {getStatusBadge(u)}
                            </div>
                            <div className="flex items-center gap-4 text-sm" style={{ color: '#5A6478' }}>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {u.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {u.profession}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(26, 31, 61, 0.1)' }}>
                                {u.user_type}
                              </span>
                            </div>
                            <div className="mt-2 text-sm" style={{ color: '#5A6478' }}>
                              {u.rpps_number ? (
                                <span className="text-green-600">RPPS: {u.rpps_number}</span>
                              ) : (
                                <span className="text-yellow-600">Pas de RPPS</span>
                              )}
                              <span className="ml-4">
                                Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {u.verification_status === 'pending' && !u.rpps_number && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleVerify(u.id, 'verify')}
                              disabled={processingUser === u.id}
                              className="rounded-full bg-green-500 hover:bg-green-600 text-white"
                            >
                              {processingUser === u.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserCheck className="mr-2 h-4 w-4" />
                              )}
                              Valider
                            </Button>
                            <Button
                              onClick={() => handleVerify(u.id, 'reject')}
                              disabled={processingUser === u.id}
                              variant="outline"
                              className="rounded-full border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Rejeter
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const bgColors = {
    green: 'rgba(34, 197, 94, 0.1)',
    yellow: 'rgba(234, 179, 8, 0.1)',
    red: 'rgba(239, 68, 68, 0.1)',
    default: 'rgba(26, 31, 61, 0.05)'
  };
  const textColors = {
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444',
    default: '#1A1F3D'
  };

  return (
    <div className="rounded-2xl p-5 border" style={{ backgroundColor: '#FAF7F2', borderColor: '#E8E0D5' }}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="h-5 w-5" style={{ color: textColors[color] || textColors.default }} />
      </div>
      <p className="text-3xl font-bold" style={{ color: '#1A1F3D' }}>{value}</p>
      <p className="text-sm" style={{ color: '#5A6478' }}>{label}</p>
    </div>
  );
}
