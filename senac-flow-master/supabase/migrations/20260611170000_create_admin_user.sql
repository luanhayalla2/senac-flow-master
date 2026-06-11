-- Enable pgcrypto extension if not already enabled (required for crypt function)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_uid UUID := gen_random_uuid();
BEGIN
  -- Check if the admin user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@senac.br') THEN
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      id, 
      instance_id, 
      aud, 
      role, 
      email, 
      encrypted_password, 
      email_confirmed_at, 
      raw_app_meta_data, 
      raw_user_meta_data, 
      created_at, 
      updated_at
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@senac.br',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name": "Administrador Principal"}',
      NOW(),
      NOW()
    );
    
    -- The trigger `on_auth_user_created` will automatically insert a profile and a role.
    -- However, if there are other users, the trigger defaults to 'solicitante'.
    -- We force the 'admin' role here to guarantee they have full access.
    UPDATE public.user_roles 
    SET role = 'admin' 
    WHERE user_id = admin_uid;
    
  END IF;
END
$$;
