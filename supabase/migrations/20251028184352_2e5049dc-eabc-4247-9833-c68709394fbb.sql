-- Create enum types for data classification
CREATE TYPE public.dataset_category AS ENUM ('agriculture', 'climate', 'mixed');
CREATE TYPE public.query_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.data_quality_level AS ENUM ('high', 'medium', 'low', 'unknown');

-- Datasets registry table
CREATE TABLE public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category public.dataset_category NOT NULL,
  resource_id TEXT UNIQUE NOT NULL,
  api_url TEXT NOT NULL,
  description TEXT,
  columns_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  total_records INTEGER DEFAULT 0,
  quality_score public.data_quality_level DEFAULT 'unknown',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agricultural production facts
CREATE TABLE public.fact_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  district TEXT,
  crop TEXT NOT NULL,
  year INTEGER NOT NULL,
  area_ha NUMERIC,
  production_t NUMERIC,
  yield_kg_per_ha NUMERIC,
  raw_record JSONB NOT NULL,
  data_source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_year CHECK (year >= 1900 AND year <= 2100),
  CONSTRAINT valid_area CHECK (area_ha IS NULL OR area_ha >= 0),
  CONSTRAINT valid_production CHECK (production_t IS NULL OR production_t >= 0)
);

-- Climate/rainfall facts
CREATE TABLE public.fact_rainfall (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  district TEXT,
  year INTEGER NOT NULL,
  month INTEGER,
  rainfall_mm NUMERIC NOT NULL,
  raw_record JSONB NOT NULL,
  data_source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_year CHECK (year >= 1900 AND year <= 2100),
  CONSTRAINT valid_month CHECK (month IS NULL OR (month >= 1 AND month <= 12)),
  CONSTRAINT valid_rainfall CHECK (rainfall_mm >= 0)
);

-- Query execution logs with full provenance
CREATE TABLE public.query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  status public.query_status DEFAULT 'pending',
  answer_text TEXT,
  execution_plan JSONB,
  sql_queries JSONB,
  citations JSONB DEFAULT '[]'::jsonb,
  charts_data JSONB DEFAULT '[]'::jsonb,
  verification_results JSONB,
  execution_steps JSONB DEFAULT '[]'::jsonb,
  runtime_ms INTEGER,
  error_message TEXT,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Data quality tracking
CREATE TABLE public.data_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
  completeness_score NUMERIC CHECK (completeness_score >= 0 AND completeness_score <= 100),
  accuracy_score NUMERIC CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
  timeliness_score NUMERIC CHECK (timeliness_score >= 0 AND timeliness_score <= 100),
  anomalies_detected INTEGER DEFAULT 0,
  missing_values INTEGER DEFAULT 0,
  total_records_checked INTEGER DEFAULT 0,
  issues_found JSONB DEFAULT '[]'::jsonb,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User alerts and notifications
CREATE TABLE public.user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_fact_production_state_crop_year ON public.fact_production(state, crop, year);
CREATE INDEX idx_fact_production_year ON public.fact_production(year);
CREATE INDEX idx_fact_rainfall_state_year ON public.fact_rainfall(state, year);
CREATE INDEX idx_fact_rainfall_year_month ON public.fact_rainfall(year, month);
CREATE INDEX idx_query_logs_created_at ON public.query_logs(created_at DESC);
CREATE INDEX idx_query_logs_status ON public.query_logs(status);
CREATE INDEX idx_datasets_category ON public.datasets(category);
CREATE INDEX idx_datasets_resource_id ON public.datasets(resource_id);

-- Enable RLS on all tables
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_rainfall ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

-- Public read access for datasets and facts (public data)
CREATE POLICY "Public read access for datasets"
  ON public.datasets FOR SELECT
  USING (true);

CREATE POLICY "Public read access for production facts"
  ON public.fact_production FOR SELECT
  USING (true);

CREATE POLICY "Public read access for rainfall facts"
  ON public.fact_rainfall FOR SELECT
  USING (true);

CREATE POLICY "Public read access for quality metrics"
  ON public.data_quality_metrics FOR SELECT
  USING (true);

-- Query logs: users can read their own queries
CREATE POLICY "Users can read their own queries"
  ON public.query_logs FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Anyone can insert query logs"
  ON public.query_logs FOR INSERT
  WITH CHECK (true);

-- User alerts: users can only see their own alerts
CREATE POLICY "Users can read their own alerts"
  ON public.user_alerts FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can update their own alerts"
  ON public.user_alerts FOR UPDATE
  USING (user_id IS NULL OR user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for datasets updated_at
CREATE TRIGGER update_datasets_updated_at
  BEFORE UPDATE ON public.datasets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample dataset configurations
INSERT INTO public.datasets (title, category, resource_id, api_url, description, columns_mapping) VALUES
('Crop Production - State wise', 'agriculture', 'SAMPLE_AGRI_001', 'https://api.data.gov.in/resource/SAMPLE_AGRI_001', 'State-wise crop production data including area, production, and yield', '{"state": ["state_name", "state"], "crop": ["crop_name", "crop"], "year": ["year"], "area_ha": ["area_ha"], "production_t": ["production_t"]}'::jsonb),
('IMD Rainfall - Monthly', 'climate', 'SAMPLE_CLIMATE_001', 'https://api.data.gov.in/resource/SAMPLE_CLIMATE_001', 'Monthly rainfall data from India Meteorological Department', '{"state": ["state", "subdivision"], "year": ["year"], "month": ["month"], "rainfall_mm": ["rainfall_mm"]}'::jsonb);
