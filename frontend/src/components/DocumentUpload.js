import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Upload, File, Trash2, Download, CheckCircle, AlertCircle, Loader2, FileText, Image } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function DocumentUpload({ onDocumentsChange }) {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const token = localStorage.getItem('cablib_token');
      const response = await axios.get(`${API}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
      if (onDocumentsChange) {
        onDocumentsChange(response.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, [onDocumentsChange]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non autorisé. PDF, JPEG, PNG uniquement.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10MB)');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('cablib_token');
      await axios.post(`${API}/documents/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Document téléchargé avec succès');
      fetchDocuments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors du téléchargement');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Supprimer ce document ?')) return;

    try {
      const token = localStorage.getItem('cablib_token');
      await axios.delete(`${API}/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Document supprimé');
      fetchDocuments();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDownload = (doc) => {
    window.open(`${BACKEND_URL}${doc.file_url}`, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('image')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
        <input
          type="file"
          id="document-upload"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          disabled={uploading}
        />
        <label
          htmlFor="document-upload"
          className="cursor-pointer flex flex-col items-center gap-4"
        >
          {uploading ? (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          ) : (
            <div className="bg-primary/10 rounded-full p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground mb-1">
              {uploading ? 'Téléchargement en cours...' : 'Cliquez pour télécharger'}
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, JPEG, PNG - Max 10MB
            </p>
          </div>
        </label>
      </div>

      {/* Documents List */}
      {documents.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Mes documents ({documents.length})
          </h3>
          <div className="grid gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 bg-secondary/30 rounded-xl p-4 hover:bg-secondary/50 transition-colors"
              >
                {getFileIcon(doc.file_type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {doc.original_filename}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    className="text-primary hover:bg-primary/10"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p>Aucun document téléchargé</p>
          <p className="text-sm">Ajoutez vos documents pour postuler aux annonces</p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="font-medium text-blue-900 mb-2">Documents recommandés :</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• CV professionnel</li>
          <li>• Diplômes et certifications</li>
          <li>• Attestation RPPS</li>
          <li>• Justificatifs de revenus</li>
          <li>• Pièce d'identité</li>
        </ul>
      </div>
    </div>
  );
}
