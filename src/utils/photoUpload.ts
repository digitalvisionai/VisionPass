
import { supabase } from '@/integrations/supabase/client';

export const uploadEmployeePhoto = async (photo: File, employeeName: string): Promise<string | null> => {
  if (!photo) return null;

  try {
    console.log('Starting photo upload for employee:', employeeName);
    const fileExt = photo.name.split('.').pop();
    const fileName = `${employeeName}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('faces')
      .upload(filePath, photo, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('faces')
      .getPublicUrl(filePath);

    console.log('Photo uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    return null;
  }
};

export const deleteEmployeePhoto = async (employeeName: string): Promise<boolean> => {
  try {
    console.log('Starting photo deletion for employee:', employeeName);
    
    // Try different file extensions since we don't know which one was used
    const possibleExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    let deleted = false;

    for (const ext of possibleExtensions) {
      const fileName = `${employeeName}.${ext}`;
      const { error } = await supabase.storage
        .from('faces')
        .remove([fileName]);

      if (!error) {
        console.log(`Photo deleted successfully: ${fileName}`);
        deleted = true;
      }
    }

    return deleted;
  } catch (error) {
    console.error('Error deleting photo:', error);
    return false;
  }
};
