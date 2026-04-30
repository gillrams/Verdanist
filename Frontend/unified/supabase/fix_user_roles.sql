    -- ============================================================
    -- EMERGENCY FIX: Reset user roles to 'guest'
    -- ============================================================

    -- Fix 1: Update specific user (e1583) back to 'guest'
    UPDATE public.profiles 
    SET role = 'guest' 
    WHERE id LIKE '%e1583';

    -- Alternative: If you know the exact email
    -- UPDATE public.profiles 
    -- SET role = 'guest' 
    -- WHERE email = 'user@example.com';

    -- Fix 2: Reset ALL non-admin users to 'guest' (use with caution!)
    -- UPDATE public.profiles 
    -- SET role = 'guest' 
    -- WHERE role IS NULL OR role NOT IN ('admin', 'farmer', 'guest');

    -- Fix 3: Verify the trigger is correct
    -- First, drop the existing trigger and recreate it
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

    -- Recreate the function with CORRECT default role
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO public.profiles (id, farm_name, role)
        VALUES (NEW.id, 'Persada Farm', 'guest');  -- FORCE 'guest' here
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Recreate the trigger
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();

    -- Verification query
    SELECT id, email, role, farm_name, created_at 
    FROM public.profiles 
    ORDER BY created_at DESC 
    LIMIT 10;
