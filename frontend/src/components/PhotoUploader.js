import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Upload, X, Image, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function PhotoUploader({ photos, onPhotosChange, maxPhotos = 5 }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxPhotos} photos autorisées`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    const token = localStorage.getItem('cablib_token');
    const newPhotos = [...photos];

    for (const file of filesToUpload) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name}: Format non supporté (JPEG, PNG, WebP uniquement)`);
        continue;
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Fichier trop volumineux (max 5MB)`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API}/listings/upload-photo`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        // Construct full URL
        const photoUrl = `${BACKEND_URL}${response.data.url}`;
        newPhotos.push(photoUrl);
        toast.success(`${file.name} uploadée avec succès`);
      } catch (error) {
        toast.error(`Erreur lors de l'upload de ${file.name}`);
      }
    }

    onPhotosChange(newPhotos);
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onClick={openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragOver 
            ? 'border-[#1A1F3D] bg-[#1A1F3D]/5' 
            : 'border-[#E8E0D5] hover:border-[#1A1F3D]/50'
        }`}
        style={{ backgroundColor: dragOver ? 'rgba(26, 31, 61, 0.05)' : '#FAF7F2' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#1A1F3D' }} />
            <p style={{ color: '#5A6478' }}>Upload en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(26, 31, 61, 0.1)' }}>
              <Upload className="h-7 w-7" style={{ color: '#1A1F3D' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: '#1A1F3D' }}>
                Cliquez ou glissez vos photos ici
              </p>
              <p className="text-sm" style={{ color: '#5A6478' }}>
                JPEG, PNG, WebP - Max 5MB par photo - {photos.length}/{maxPhotos} photos
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {photos.map((photo, index) => (
            <div 
              key={index} 
              className="relative aspect-video rounded-xl overflow-hidden group"
              style={{ backgroundColor: '#E8E0D5' }}
            >
              <img 
                src={photo} 
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className="hidden w-full h-full items-center justify-center"
                style={{ backgroundColor: '#E8E0D5' }}
              >
                <Image className="h-8 w-8" style={{ color: '#5A6478' }} />
              </div>
              
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: '#dc2626', color: 'white' }}
              >
                <X className="h-4 w-4" />
              </button>
              
              {/* Index badge */}
              <div 
                className="absolute bottom-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: '#1A1F3D', color: '#F5F0E6' }}
              >
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(26, 31, 61, 0.05)' }}>
        <p className="text-sm font-medium mb-2" style={{ color: '#1A1F3D' }}>💡 Conseils pour de bonnes photos :</p>
        <ul className="text-sm space-y-1" style={{ color: '#5A6478' }}>
          <li>• Prenez des photos en journée avec lumière naturelle</li>
          <li>• Montrez l'entrée, la salle d'attente, les bureaux</li>
          <li>• La première photo sera la photo principale</li>
        </ul>
      </div>
    </div>
  );
}
