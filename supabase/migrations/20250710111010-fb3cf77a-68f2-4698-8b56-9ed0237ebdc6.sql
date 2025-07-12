
-- Add DELETE policy for admins table to allow admins to delete other admins
CREATE POLICY "Admins can delete other admins" 
  ON public.admins FOR DELETE 
  USING (public.is_admin(auth.uid()));
