import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.3';

const ALLOWED_ORIGIN_PATTERNS: (string | RegExp)[] = [
  /^https?:\/\/localhost(:\d+)?$/,
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
  /\.lovable\.dev$/,
];

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = !!origin && ALLOWED_ORIGIN_PATTERNS.some(p =>
    typeof p === 'string' ? p === origin : p.test(origin)
  );
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin! : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function sanitizeUrl(url: string): string {
  return url.replace(/api-key=[^&]+/i, 'api-key=***REDACTED***');
}

const DATA_GOV_API_KEY = Deno.env.get('DATA_GOV_API_KEY');

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ---- JWT auth check ----
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const supabaseUrlForAuth = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const authClient = createClient(supabaseUrlForAuth, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const resourceId = typeof body?.resourceId === 'string' ? body.resourceId.trim() : '';
    const limit = Math.min(Math.max(parseInt(body?.limit) || 100, 1), 500);
    const offset = Math.max(parseInt(body?.offset) || 0, 0);

    // Input validation
    if (!resourceId || resourceId.length > 200 || !/^[a-zA-Z0-9_-]+$/.test(resourceId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid resourceId is required (alphanumeric, max 200 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test database connection first
    const { error: pingError } = await supabase.from('datasets').select('id').limit(1);
    if (pingError) {
      console.error('Database connection error:', pingError);
      // Retry once after a short delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Syncing data from data.gov.in for resource:', resourceId);

    // Fetch data from data.gov.in API
    const apiUrl = `https://api.data.gov.in/resource/${resourceId}?api-key=${DATA_GOV_API_KEY}&format=json&limit=${limit}&offset=${offset}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from data.gov.in: ${response.status}`);
    }

    const apiData = await response.json();
    
    if (!apiData.records || !Array.isArray(apiData.records)) {
      throw new Error('Invalid response format from data.gov.in');
    }

    // Determine data type based on fields
    const firstRecord = apiData.records[0];
    let dataType = 'production';
    let category: 'agriculture' | 'climate' | 'mixed' = 'agriculture';
    
    if (firstRecord.rainfall_mm || firstRecord.rainfall) {
      dataType = 'rainfall';
      category = 'climate';
    }

    // Get or create dataset
    const { data: existingDataset, error: selectError } = await supabase
      .from('datasets')
      .select('*')
      .eq('resource_id', resourceId)
      .single();

    let dataset;
    if (!existingDataset) {
      const { data: newDataset, error: insertError } = await supabase
        .from('datasets')
        .insert({
          resource_id: resourceId,
          title: apiData.title || `Dataset ${resourceId}`,
          description: apiData.desc || apiData.description || 'Auto-synced from data.gov.in',
          api_url: apiUrl,
          category: category,
          columns_mapping: {},
          metadata: {
            source: 'data.gov.in',
            total: apiData.total || apiData.count || 0,
            fields: apiData.fields || []
          }
        })
        .select()
        .single();

      if (insertError) throw insertError;
      dataset = newDataset;
    } else {
      dataset = existingDataset;
    }

    let insertCount = 0;
    let errors: any[] = [];

    // Insert records based on type
    if (dataType === 'production') {
      for (const record of apiData.records) {
        const { error } = await supabase
          .from('fact_production')
          .insert({
            dataset_id: dataset.id,
            state: record.state || record.State || null,
            district: record.district || record.District || record.market || record.Market || null,
            crop: (record.crop || record.Crop || record.commodity || record.Commodity) ?? 'Unknown',
            year: (() => {
              const y = record.year || record.Year;
              if (y) return parseInt(y);
              const ad = record.arrival_date || record.Arrival_Date || record.arrivalDate;
              if (typeof ad === 'string') {
                const parts = ad.split(/[\/\-]/);
                const last = parts[parts.length - 1];
                const parsed = parseInt(last);
                if (!isNaN(parsed)) return parsed;
              }
              return new Date().getFullYear();
            })(),
            area_ha: record.area_ha || record.Area ? parseFloat(record.area_ha || record.Area) : null,
            production_t: record.production_t || record.Production ? parseFloat(record.production_t || record.Production) : null,
            yield_kg_per_ha: record.yield_kg_per_ha || record.Yield ? parseFloat(record.yield_kg_per_ha || record.Yield) : null,
            raw_record: record,
            data_source_url: apiUrl
          });

        if (error) {
          errors.push({ record, error: error.message });
        } else {
          insertCount++;
        }
      }
    } else {
      for (const record of apiData.records) {
        const { error } = await supabase
          .from('fact_rainfall')
          .insert({
            dataset_id: dataset.id,
            state: record.state || record.State,
            district: record.district || record.District || null,
            year: parseInt(record.year || record.Year),
            month: record.month || record.Month ? parseInt(record.month || record.Month) : null,
            rainfall_mm: parseFloat(record.rainfall_mm || record.rainfall || record.Rainfall),
            raw_record: record,
            data_source_url: apiUrl
          });

        if (error) {
          errors.push({ record, error: error.message });
        } else {
          insertCount++;
        }
      }
    }

    // Update dataset metadata
    if (insertCount > 0) {
      await supabase
        .from('datasets')
        .update({
          total_records: (dataset.total_records || 0) + insertCount,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', dataset.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: insertCount,
        errors: errors.length,
        error_details: errors.slice(0, 5),
        total_available: apiData.total || apiData.count || 0,
        dataset_id: dataset.id,
        data_type: dataType
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error syncing data:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to sync data. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
