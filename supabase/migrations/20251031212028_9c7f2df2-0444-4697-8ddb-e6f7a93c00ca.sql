-- Create admin user for TKB Asset
-- Email: tkb.assetgestao@gmail.com
-- This user will have admin role and full access to admin dashboard

DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Create admin user in auth.users with encrypted password
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'tkb.assetgestao@gmail.com',
    crypt('Giovana1@', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Administrador TKB Asset","document_type":"CPF","document_number":"00000000000"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO admin_user_id;

  -- The handle_new_user() trigger will automatically create the profile

  -- Add admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin');

  RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
END $$;