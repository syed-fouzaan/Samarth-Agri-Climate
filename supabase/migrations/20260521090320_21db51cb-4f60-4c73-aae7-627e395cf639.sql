-- Remove redundant duplicate INSERT policy on query_logs
DROP POLICY IF EXISTS "Authenticated users can insert their own query logs" ON public.query_logs;
DROP POLICY IF EXISTS "Users can read their own queries" ON public.query_logs;
-- Keep the strict policies: "Users can insert their own query logs" + "Users can view their own query logs"