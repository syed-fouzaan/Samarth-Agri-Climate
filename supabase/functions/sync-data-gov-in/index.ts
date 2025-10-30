import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DATA_GOV_API_KEY = Deno.env.get('DATA_GOV_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resourceId, limit = 100, offset = 0 } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
    if (firstRecord.rainfall_mm || firstRecord.rainfall) {
      dataType = 'rainfall';
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
          category: dataType as 'agricultural' | 'climate',
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
            state: record.state || record.State,
            district: record.district || record.District || null,
            crop: record.crop || record.Crop,
            year: parseInt(record.year || record.Year),
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
        error: error.message || 'Failed to sync data',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
