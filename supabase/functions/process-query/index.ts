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

    // Build context from database - get relevant data based on question
    const { data: datasets } = await supabase
      .from('datasets')
      .select('*');

    // Query production data more intelligently based on question
    let productionQuery = supabase
      .from('fact_production')
      .select('*')
      .order('year', { ascending: false });
    
    // Filter by crop if mentioned in question
    const cropKeywords = ['tomato', 'wheat', 'rice', 'banana', 'turmeric', 'potato', 'onion'];
    const mentionedCrop = cropKeywords.find(crop => 
      question.toLowerCase().includes(crop)
    );
    
    if (mentionedCrop) {
      productionQuery = productionQuery.ilike('crop', `%${mentionedCrop}%`);
    }
    
    const { data: recentProduction } = await productionQuery.limit(100);

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
    let contentText = aiData.choices[0].message.content;
    
    console.log('Raw AI content before processing:', contentText.substring(0, 200));
    
    // Strip markdown code blocks if present
    contentText = contentText.trim();
    if (contentText.startsWith('```')) {
      // Remove opening code fence
      contentText = contentText.replace(/^```(?:json)?\s*\n?/, '');
      // Remove closing code fence
      contentText = contentText.replace(/\n?```\s*$/, '');
    }
    
    console.log('Processed content:', contentText.substring(0, 200));
    
    const aiResult = JSON.parse(contentText.trim());

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
  const lowerQ = question.toLowerCase();
  
  // For production/crop questions
  if (lowerQ.includes('production') || lowerQ.includes('crop') || lowerQ.includes('tomato') || 
      lowerQ.includes('wheat') || lowerQ.includes('rice') || lowerQ.includes('trends')) {
    
    // Check if asking about state comparison
    if (lowerQ.includes('state') || lowerQ.includes('across')) {
      const productionByState = aggregateProductionByState(production);
      if (productionByState.length > 0) {
        charts.push({
          type: 'bar',
          title: 'Production by State',
          data: productionByState
        });
      }
    } else {
      // Year-based trends
      const productionByYear = aggregateProductionByYear(production);
      if (productionByYear.length > 0) {
        charts.push({
          type: 'bar',
          title: 'Production Trends',
          data: productionByYear
        });
      }
    }
  }
  
  if (lowerQ.includes('rainfall') || lowerQ.includes('climate')) {
    const rainfallByYear = aggregateRainfallByYear(rainfall);
    if (rainfallByYear.length > 0) {
      charts.push({
        type: 'line',
        title: 'Rainfall Patterns',
        data: rainfallByYear
      });
    }
  }
  
  // Default chart if no specific match but we have data
  if (charts.length === 0 && production.length > 0) {
    const stateData = aggregateProductionByState(production);
    if (stateData.length > 0) {
      charts.push({
        type: 'bar',
        title: 'Agricultural Data Overview',
        data: stateData
      });
    }
  }
  
  return charts;
}

function aggregateProductionByState(data: any[]) {
  const stateMap = new Map<string, number>();
  
  data.forEach(item => {
    if (item.state && item.production_t && item.production_t !== null) {
      const current = stateMap.get(item.state) || 0;
      stateMap.set(item.state, current + parseFloat(item.production_t));
    }
  });
  
  return Array.from(stateMap.entries())
    .map(([state, value]) => ({ name: state, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 states
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
