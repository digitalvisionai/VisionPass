
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';

interface PhotoUploadProps {
  photo: File | null;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PhotoUpload = ({ photo, onPhotoChange }: PhotoUploadProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="photo">Employee Photo</Label>
      <div className="flex items-center space-x-2">
        <Input
          id="photo"
          type="file"
          accept="image/*"
          onChange={onPhotoChange}
          className="flex-1"
        />
        <Upload className="h-4 w-4 text-gray-500" />
      </div>
      {photo && (
        <p className="text-sm text-gray-600">Selected: {photo.name}</p>
      )}
    </div>
  );
};

export default PhotoUpload;
