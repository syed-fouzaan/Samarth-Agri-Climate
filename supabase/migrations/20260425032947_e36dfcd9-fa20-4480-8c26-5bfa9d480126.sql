DROP POLICY IF EXISTS "Anyone can insert query logs" ON public.query_logs;

CREATE POLICY "Authenticated users can insert query logs"
  ON public.query_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);