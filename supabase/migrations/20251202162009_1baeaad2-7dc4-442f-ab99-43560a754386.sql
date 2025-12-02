-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'supervisor', 'voter');

-- Create enum for user status
CREATE TYPE public.user_status AS ENUM ('pending', 'active', 'suspended');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dni VARCHAR(20) UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone VARCHAR(20),
  age INTEGER,
  role user_role NOT NULL DEFAULT 'voter',
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create polls table
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  min_age INTEGER DEFAULT 18,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidates table
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  party TEXT NOT NULL,
  photo_url TEXT,
  age INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table with unique constraint to prevent double voting
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Create security definer function for status checking
CREATE OR REPLACE FUNCTION public.get_user_status(user_id UUID)
RETURNS user_status
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status FROM public.profiles WHERE id = user_id;
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Polls policies
CREATE POLICY "Active users can view active polls" ON public.polls
  FOR SELECT USING (
    is_active = true 
    AND public.get_user_status(auth.uid()) = 'active'
  );

CREATE POLICY "Admins can view all polls" ON public.polls
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Supervisors can view their own polls" ON public.polls
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Active supervisors can create polls" ON public.polls
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) = 'supervisor'
    AND public.get_user_status(auth.uid()) = 'active'
  );

CREATE POLICY "Supervisors can update their own polls" ON public.polls
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Admins can update any poll" ON public.polls
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Supervisors can delete their own polls" ON public.polls
  FOR DELETE USING (created_by = auth.uid());

-- Candidates policies
CREATE POLICY "Anyone can view candidates of active polls" ON public.candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = candidates.poll_id 
      AND polls.is_active = true
    )
  );

CREATE POLICY "Poll creators can manage candidates" ON public.candidates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = candidates.poll_id 
      AND polls.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all candidates" ON public.candidates
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Votes policies
CREATE POLICY "Active voters can vote" ON public.votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.get_user_status(auth.uid()) = 'active'
  );

CREATE POLICY "Users can view their own votes" ON public.votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Poll creators can view votes on their polls" ON public.votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = votes.poll_id 
      AND polls.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can view all votes" ON public.votes
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, dni, full_name, phone, age, role, status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'dni',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'age')::INTEGER,
    (NEW.raw_user_meta_data->>'role')::user_role,
    CASE 
      WHEN (NEW.raw_user_meta_data->>'role') = 'supervisor' THEN 'pending'::user_status
      ELSE 'active'::user_status
    END
  );
  RETURN NEW;
END;
$$;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for votes (for live results)
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;