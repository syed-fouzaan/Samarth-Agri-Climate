
CREATE POLICY "Block direct client inserts on datasets" ON public.datasets FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Block direct client updates on datasets" ON public.datasets FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Block direct client deletes on datasets" ON public.datasets FOR DELETE TO anon, authenticated USING (false);

CREATE POLICY "Block direct client inserts on fact_production" ON public.fact_production FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Block direct client updates on fact_production" ON public.fact_production FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Block direct client deletes on fact_production" ON public.fact_production FOR DELETE TO anon, authenticated USING (false);

CREATE POLICY "Block direct client inserts on fact_rainfall" ON public.fact_rainfall FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Block direct client updates on fact_rainfall" ON public.fact_rainfall FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Block direct client deletes on fact_rainfall" ON public.fact_rainfall FOR DELETE TO anon, authenticated USING (false);

CREATE POLICY "Block direct client inserts on data_quality_metrics" ON public.data_quality_metrics FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Block direct client updates on data_quality_metrics" ON public.data_quality_metrics FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Block direct client deletes on data_quality_metrics" ON public.data_quality_metrics FOR DELETE TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "Users can read their own alerts" ON public.user_alerts;
DROP POLICY IF EXISTS "Users can update their own alerts" ON public.user_alerts;

CREATE POLICY "Users can read their own alerts"
  ON public.user_alerts FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update their own alerts"
  ON public.user_alerts FOR UPDATE TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert query logs" ON public.query_logs;

CREATE POLICY "Authenticated users can insert their own query logs"
  ON public.query_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
