-- Enable RLS on the jobs and trainsets tables that were missed
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainsets ENABLE ROW LEVEL SECURITY;

-- Create basic policies for jobs table (admin access only for now)
CREATE POLICY "Admins can manage jobs"
    ON public.jobs FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Maintenance planners can view jobs"
    ON public.jobs FOR SELECT
    USING (public.has_role(auth.uid(), 'maintenance_planner'));

-- Create basic policies for trainsets table (accessible to authenticated users)
CREATE POLICY "Authenticated users can view trainsets"
    ON public.trainsets FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage trainsets"
    ON public.trainsets FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));