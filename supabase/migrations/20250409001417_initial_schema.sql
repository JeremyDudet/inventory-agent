
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  image TEXT,
  has_access BOOLEAN,
  customer_id TEXT,
  price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY,
  name TEXT,
  permissions JSONB,
  createdat TIMESTAMP WITH TIME ZONE,
  updatedat TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.items (
  id BIGINT PRIMARY KEY,
  name TEXT,
  description TEXT,
  unit_of_measure TEXT,
  qty_on_hand REAL,
  par DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE,
  last_edited TIMESTAMP WITH TIME ZONE,
  last_edited_by UUID
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY,
  name TEXT
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  quantity NUMERIC,
  threshold NUMERIC,
  unit TEXT,
  category TEXT,
  embedding VECTOR,
  createdat TIMESTAMP WITH TIME ZONE,
  updatedat TIMESTAMP WITH TIME ZONE,
  lastupdated TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.inventory_updates (
  id UUID PRIMARY KEY,
  itemid UUID,
  action TEXT,
  quantity NUMERIC,
  previousquantity NUMERIC,
  newquantity NUMERIC,
  unit TEXT,
  userid UUID,
  username TEXT,
  createdat TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.session_logs (
  id UUID PRIMARY KEY,
  session_id TEXT,
  user_id UUID,
  type TEXT,
  text TEXT,
  action TEXT,
  status TEXT,
  is_final BOOLEAN,
  confidence DOUBLE PRECISION,
  timestamp TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, has_access)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
