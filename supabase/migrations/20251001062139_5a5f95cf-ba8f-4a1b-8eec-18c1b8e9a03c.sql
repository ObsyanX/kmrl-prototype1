-- Fix missing RLS policies for decision_conflicts and mileage_records

-- Decision conflicts policies
CREATE POLICY "Authenticated users can view conflicts"
ON public.decision_conflicts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage conflicts"
ON public.decision_conflicts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

-- Mileage records policies
CREATE POLICY "Admins can manage mileage records"
ON public.mileage_records FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));