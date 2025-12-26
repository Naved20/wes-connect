-- Create the admin user in auth.users using raw SQL
-- Note: This creates the user with hashed password
-- The trigger will automatically create the profile and assign 'employee' role
-- We then update the role to 'admin'

-- First, let's ensure we can insert the admin user
-- We'll use a DO block to handle this
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'info@wazireducationsociety.com';
  
  IF admin_user_id IS NULL THEN
    -- Insert the admin user
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
      'info@wazireducationsociety.com',
      crypt('WES@OneDesk786', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"WES Administrator"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_user_id;
    
    -- The handle_new_user trigger will create the profile and assign 'employee' role
    -- We need to update the role to 'admin'
    UPDATE public.user_roles 
    SET role = 'admin' 
    WHERE user_id = admin_user_id;
  ELSE
    -- User exists, make sure they have admin role
    UPDATE public.user_roles 
    SET role = 'admin' 
    WHERE user_id = admin_user_id;
  END IF;
END $$;