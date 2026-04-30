-- ============================================================
-- FIX: Allow admins to delete users from profiles table
-- ============================================================

-- 1. Enable RLS on profiles (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing delete policy if exists
DROP POLICY IF EXISTS "Admins can delete users" ON public.profiles;

-- 3. Create new delete policy for admins
CREATE POLICY "Admins can delete users"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (
        -- Allow if the current user is an admin
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Create a secure function to delete user (RPC)
CREATE OR REPLACE FUNCTION public.delete_user_by_id(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Get current user's role
    SELECT role INTO current_user_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Only admins can delete
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can delete users';
    END IF;
    
    -- Delete the target user from profiles
    DELETE FROM public.profiles WHERE id = target_user_id;
    
    RETURN FOUND;
END;
$$;

-- 5. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(UUID) TO authenticated;

-- Verification
SELECT 'Policy created successfully' as status;
