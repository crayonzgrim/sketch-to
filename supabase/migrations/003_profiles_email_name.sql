-- Add email and name columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Reset existing data (no users yet)
DELETE FROM daily_usage;
DELETE FROM subscriptions;
DELETE FROM profiles;

-- Update trigger to capture email and name from auth.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
