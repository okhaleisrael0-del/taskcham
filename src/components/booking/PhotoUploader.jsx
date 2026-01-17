import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PhotoUploader({ booking, photoType, onPhotoUploaded }) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const existingPhoto = photoType === 'pickup' 
    ? booking.pickup_photo_url 
    : booking.completion_photo_url;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const updateData = {};
      if (photoType === 'pickup') {
        updateData.pickup_photo_url = file_url;
      } else {
        updateData.completion_photo_url = file_url;
      }
      
      await base44.entities.Booking.update(booking.id, updateData);
      
      if (onPhotoUploaded) {
        onPhotoUploaded(file_url);
      }
      
      toast.success('Foto uppladdat!');
    } catch (error) {
      toast.error('Kunde inte ladda upp foto');
    } finally {
      setIsUploading(false);
    }
  };

  const title = photoType === 'pickup' 
    ? 'Foto vid Upphämtning' 
    : 'Foto vid Leverans';
  
  const description = photoType === 'pickup'
    ? 'Ta ett foto av varan/uppgiften vid upphämtning'
    : 'Ta ett foto när uppdraget är slutfört';

  return (
    <Card className={existingPhoto ? 'border-green-500' : 'border-dashed border-2'}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4 text-[#4A90A4]" />
              {title}
            </h4>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          {existingPhoto && (
            <Badge className="bg-green-100 text-green-800">
              <Check className="h-3 w-3 mr-1" />
              Uppladdat
            </Badge>
          )}
        </div>

        {existingPhoto ? (
          <div className="space-y-3">
            <img 
              src={existingPhoto} 
              alt={title}
              className="w-full rounded-lg max-h-48 object-cover"
            />
            <label htmlFor={`photo-${photoType}`} className="block">
              <div className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:bg-gray-50">
                <Upload className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                <span className="text-sm text-gray-600">Ladda upp nytt foto</span>
              </div>
              <input
                id={`photo-${photoType}`}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>
        ) : (
          <label htmlFor={`photo-${photoType}`} className="block">
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50">
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 mx-auto mb-2 text-[#4A90A4] animate-spin" />
                  <p className="text-sm text-gray-600">Laddar upp...</p>
                </>
              ) : preview ? (
                <>
                  <img src={preview} alt="Preview" className="max-h-32 mx-auto mb-2 rounded" />
                  <p className="text-sm text-gray-600">Laddar upp...</p>
                </>
              ) : (
                <>
                  <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Ta eller ladda upp foto</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG (max 10MB)</p>
                </>
              )}
            </div>
            <input
              id={`photo-${photoType}`}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        )}
      </div>
    </Card>
  );
}