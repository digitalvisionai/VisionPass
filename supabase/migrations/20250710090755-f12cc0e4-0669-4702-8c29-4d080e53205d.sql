
-- Drop the existing insert policy for admins
DROP POLICY IF EXISTS "Admins can insert new admins" ON public.admins;

-- Create a new policy that allows the first admin to be created
-- or existing admins to create new admins
CREATE POLICY "Allow admin creation" 
  ON public.admins FOR INSERT 
  WITH CHECK (
    -- Allow if no admins exist yet (first admin)
    NOT EXISTS (SELECT 1 FROM public.admins)
    OR 
    -- Allow if current user is already an admin
    public.is_admin(auth.uid())
  );
