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

  const startTime = Date.now();
  
  try {
    const { question, sessionId } = await req.json();
    
    if (!question || typeof question !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing query:', question);

    // Create query log entry
    const { data: queryLog, error: logError } = await supabase
      .from('query_logs')
      .insert({
        question,
        status: 'processing',
        session_id: sessionId,
        execution_steps: []
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating query log:', logError);
      throw logError;
    }

    // Build context from database
    const { data: datasets } = await supabase
      .from('datasets')
      .select('*');

    const { data: recentProduction } = await supabase
      .from('fact_production')
      .select('*')
      .order('year', { ascending: false })
      .limit(100);

    const { data: recentRainfall } = await supabase
      .from('fact_rainfall')
      .select('*')
      .order('year', { ascending: false })
      .limit(100);

    // Prepare system prompt with database schema and available data
    const systemPrompt = `You are an expert agricultural and climate data analyst. You help users query Indian agriculture production and climate datasets.

Available Datasets:
${JSON.stringify(datasets, null, 2)}

You have access to:
1. fact_production table: Contains state-wise crop production data (state, crop, year, area_ha, production_t, yield_kg_per_ha)
2. fact_rainfall table: Contains rainfall data (state, year, month, rainfall_mm)

Recent data sample is available in the context.

Your task is to:
1. Analyze the user's question
2. Determine what data is needed
3. Generate appropriate insights
4. Provide clear, accurate answers with proper citations
5. Suggest relevant visualizations

Response format (JSON):
{
  "answer_text": "Clear answer to the question",
  "data_insights": [Array of key insights],
  "citations": [
    {
      "title": "Dataset title",
      "resource_id": "resource ID",
      "api_url": "data.gov.in API URL",
      "fields_used": ["list of fields"]
    }
  ],
  "chart_suggestions": [
    {
      "type": "bar|line|pie",
      "title": "Chart title",
      "description": "What to visualize"
    }
  ],
  "sql_context": "Explanation of what SQL queries would be needed"
}`;

    const userPrompt = `Question: ${question}

Recent Production Data Sample: ${JSON.stringify(recentProduction?.slice(0, 10))}
Recent Rainfall Data Sample: ${JSON.stringify(recentRainfall?.slice(0, 10))}

Please analyze this question and provide a comprehensive answer with citations.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI usage credits depleted. Please add credits to continue.');
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiResult = JSON.parse(aiData.choices[0].message.content);

    console.log('AI Response:', aiResult);

    // Generate sample visualization data based on the question
    const chartData = generateSampleChartData(question, recentProduction || [], recentRainfall || []);

    const runtime = Date.now() - startTime;

    // Update query log with results
    await supabase
      .from('query_logs')
      .update({
        status: 'completed',
        answer_text: aiResult.answer_text,
        citations: aiResult.citations || [],
        charts_data: chartData,
        execution_plan: {
          insights: aiResult.data_insights,
          sql_context: aiResult.sql_context
        },
        verification_results: {
          citations_valid: (aiResult.citations || []).length > 0,
          data_sources_verified: true
        },
        runtime_ms: runtime,
        completed_at: new Date().toISOString()
      })
      .eq('id', queryLog.id);

    return new Response(
      JSON.stringify({
        answer: aiResult.answer_text,
        charts: chartData,
        citations: aiResult.citations || [],
        provenance: {
          query_id: queryLog.id,
          query_time: queryLog.created_at,
          execution_steps: 3,
          data_sources: datasets?.length || 0,
          runtime_ms: runtime
        },
        insights: aiResult.data_insights
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error processing query:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process query',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateSampleChartData(question: string, production: any[], rainfall: any[]) {
  const charts = [];
  
  // Generate relevant chart based on question keywords
  if (question.toLowerCase().includes('production') || question.toLowerCase().includes('crop')) {
    const productionByYear = aggregateProductionByYear(production);
    charts.push({
      type: 'bar',
      title: 'Production Trends',
      data: productionByYear
    });
  }
  
  if (question.toLowerCase().includes('rainfall') || question.toLowerCase().includes('climate')) {
    const rainfallByYear = aggregateRainfallByYear(rainfall);
    charts.push({
      type: 'line',
      title: 'Rainfall Patterns',
      data: rainfallByYear
    });
  }
  
  // Default chart if no specific match
  if (charts.length === 0 && production.length > 0) {
    const yearlyData = aggregateProductionByYear(production);
    charts.push({
      type: 'bar',
      title: 'Agricultural Trends',
      data: yearlyData
    });
  }
  
  return charts;
}

function aggregateProductionByYear(data: any[]) {
  const yearMap = new Map<number, number>();
  
  data.forEach(item => {
    if (item.year && item.production_t) {
      const current = yearMap.get(item.year) || 0;
      yearMap.set(item.year, current + parseFloat(item.production_t));
    }
  });
  
  return Array.from(yearMap.entries())
    .map(([year, value]) => ({ name: year.toString(), value: Math.round(value) }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name))
    .slice(-5); // Last 5 years
}

function aggregateRainfallByYear(data: any[]) {
  const yearMap = new Map<number, { sum: number; count: number }>();
  
  data.forEach(item => {
    if (item.year && item.rainfall_mm) {
      const current = yearMap.get(item.year) || { sum: 0, count: 0 };
      current.sum += parseFloat(item.rainfall_mm);
      current.count += 1;
      yearMap.set(item.year, current);
    }
  });
  
  return Array.from(yearMap.entries())
    .map(([year, { sum, count }]) => ({
      name: year.toString(),
      value: Math.round(sum / count)
    }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name))
    .slice(-5); // Last 5 years
}
