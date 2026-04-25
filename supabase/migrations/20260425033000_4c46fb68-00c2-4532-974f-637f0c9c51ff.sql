DROP POLICY IF EXISTS "Authenticated users can insert query logs" ON public.query_logs;

CREATE POLICY "Users can insert their own query logs"
  ON public.query_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own query logs"
  ON public.query_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);