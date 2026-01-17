import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Video, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function MediaUploader({ onMediaUploaded, existingMedia = [] }) {
  const [isUploading, setIsUploading] = useState(false);
  const [mediaList, setMediaList] = useState(existingMedia);

  const handleFileChange = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return { url: file_url, type };
      });

      const uploadedMedia = await Promise.all(uploadPromises);
      const newMediaList = [...mediaList, ...uploadedMedia];
      setMediaList(newMediaList);
      
      if (onMediaUploaded) {
        onMediaUploaded(newMediaList);
      }

      toast.success(`${uploadedMedia.length} fil(er) uppladdat!`);
    } catch (error) {
      toast.error('Kunde inte ladda upp filer');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (index) => {
    const newMediaList = mediaList.filter((_, i) => i !== index);
    setMediaList(newMediaList);
    if (onMediaUploaded) {
      onMediaUploaded(newMediaList);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center cursor-pointer hover:bg-blue-50 transition-all bg-gradient-to-br from-blue-50 to-white">
            <Camera className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-sm font-medium text-gray-900">Lägg till bilder</p>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG (max 10MB)</p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e, 'image')}
            disabled={isUploading}
          />
        </label>

        <label className="block">
          <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center cursor-pointer hover:bg-purple-50 transition-all bg-gradient-to-br from-purple-50 to-white">
            <Video className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-sm font-medium text-gray-900">Lägg till video</p>
            <p className="text-xs text-gray-500 mt-1">MP4, MOV (max 50MB)</p>
          </div>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileChange(e, 'video')}
            disabled={isUploading}
          />
        </label>
      </div>

      {isUploading && (
        <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-xl">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm text-gray-700">Laddar upp...</span>
        </div>
      )}

      {mediaList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {mediaList.map((media, index) => (
            <div key={index} className="relative group">
              {media.type === 'image' ? (
                <img
                  src={media.url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                />
              ) : (
                <div className="w-full h-32 bg-purple-100 rounded-xl border-2 border-purple-300 flex items-center justify-center">
                  <Video className="h-12 w-12 text-purple-600" />
                </div>
              )}
              <button
                onClick={() => removeMedia(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {mediaList.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="font-medium">{mediaList.length} fil(er) uppladdad(e)</span>
          </p>
          <p className="text-xs text-green-700 mt-1">
            TaskCham granskar dina filer och återkommer med pris
          </p>
        </div>
      )}
    </div>
  );
}