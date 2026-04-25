import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    const datasetId = typeof body?.datasetId === 'string' ? body.datasetId.trim() : '';
    const sampleData = Array.isArray(body?.sampleData) ? body.sampleData : [];
    const dataType = typeof body?.dataType === 'string' ? body.dataType : '';

    // Input validation
    if (!datasetId || datasetId.length > 200) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid datasetId is required (max 200 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!['production', 'rainfall'].includes(dataType)) {
      return new Response(
        JSON.stringify({ success: false, error: 'dataType must be "production" or "rainfall"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (sampleData.length === 0 || sampleData.length > 500) {
      return new Response(
        JSON.stringify({ success: false, error: 'sampleData must contain 1-500 records' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Ingesting sample data for dataset:', datasetId);

    let insertCount = 0;
    let errors: any[] = [];

    if (dataType === 'production' && sampleData && Array.isArray(sampleData)) {
      // Insert production data
      const { data: dataset } = await supabase
        .from('datasets')
        .select('id')
        .eq('resource_id', datasetId)
        .single();

      if (!dataset) {
        throw new Error(`Dataset ${datasetId} not found`);
      }

      for (const record of sampleData) {
        const { error } = await supabase
          .from('fact_production')
          .insert({
            dataset_id: dataset.id,
            state: record.state,
            district: record.district || null,
            crop: record.crop,
            year: parseInt(record.year),
            area_ha: record.area_ha ? parseFloat(record.area_ha) : null,
            production_t: record.production_t ? parseFloat(record.production_t) : null,
            yield_kg_per_ha: record.yield_kg_per_ha ? parseFloat(record.yield_kg_per_ha) : null,
            raw_record: record,
            data_source_url: `https://api.data.gov.in/resource/${datasetId}`
          });

        if (error) {
          errors.push({ record, error: error.message });
        } else {
          insertCount++;
        }
      }
    } else if (dataType === 'rainfall' && sampleData && Array.isArray(sampleData)) {
      // Insert rainfall data
      const { data: dataset } = await supabase
        .from('datasets')
        .select('id')
        .eq('resource_id', datasetId)
        .single();

      if (!dataset) {
        throw new Error(`Dataset ${datasetId} not found`);
      }

      for (const record of sampleData) {
        const { error } = await supabase
          .from('fact_rainfall')
          .insert({
            dataset_id: dataset.id,
            state: record.state,
            district: record.district || null,
            year: parseInt(record.year),
            month: record.month ? parseInt(record.month) : null,
            rainfall_mm: parseFloat(record.rainfall_mm),
            raw_record: record,
            data_source_url: `https://api.data.gov.in/resource/${datasetId}`
          });

        if (error) {
          errors.push({ record, error: error.message });
        } else {
          insertCount++;
        }
      }
    }

    // Update dataset record count
    if (insertCount > 0) {
      const { data: dataset } = await supabase
        .from('datasets')
        .select('total_records')
        .eq('resource_id', datasetId)
        .single();

      if (dataset) {
        await supabase
          .from('datasets')
          .update({
            total_records: (dataset.total_records || 0) + insertCount,
            last_synced_at: new Date().toISOString()
          })
          .eq('resource_id', datasetId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: insertCount,
        errors: errors.length,
        error_details: errors.slice(0, 5) // First 5 errors only
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error ingesting data:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to ingest data. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
