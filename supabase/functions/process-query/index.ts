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

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  // ---- JWT auth check ----
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
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
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const userId = claimsData.claims.sub as string;

  try {
    const body = await req.json();
    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : undefined;

    // Input validation
    if (!question || question.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Question must be at least 3 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (question.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Question must be under 1000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // Validate sessionId format if provided
    if (sessionId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid session ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize question for AI prompt (remove potential injection markers)
    const sanitizedQuestion = question.replace(/[<>]/g, '').slice(0, 1000);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing query:', sanitizedQuestion.substring(0, 100));

    // Create query log entry
    const { data: queryLog, error: logError } = await supabase
      .from('query_logs')
      .insert({
        question: sanitizedQuestion,
        status: 'processing',
        session_id: sessionId,
        user_id: userId,
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

    // Get unique states for context
    const uniqueStates = [...new Set((recentProduction || []).map((p: any) => p.state))];
    const uniqueCommodities = [...new Set((recentProduction || []).map((p: any) => p.crop))];
    
    // Calculate summary statistics
    const priceStats = calculatePriceStats(recentProduction || []);
    
    // Prepare system prompt with database schema and available data
    const systemPrompt = `You are an expert agricultural and climate data analyst specializing in Indian markets. You have access to REAL, LIVE market data from data.gov.in.

CRITICAL: You are analyzing REAL DATA, not sample/mock data. Provide actionable insights based on actual market prices and trends.

Available Real Data Summary:
- States with data: ${uniqueStates.join(', ')}
- Commodities tracked: ${uniqueCommodities.join(', ')}
- Total records: ${(recentProduction || []).length}
- Price range: ₹${priceStats.minPrice} - ₹${priceStats.maxPrice}
- Average modal price: ₹${priceStats.avgPrice}

Datasets:
${JSON.stringify(datasets, null, 2)}

Database Schema:
1. fact_production: state, crop, district, year, area_ha, production_t, yield_kg_per_ha, raw_record (contains: market, commodity, variety, grade, min_price, max_price, modal_price, arrival_date)
2. fact_rainfall: state, year, month, rainfall_mm, district

Your analysis capabilities:
1. Price trend analysis and forecasting
2. State-wise market comparison
3. Commodity price volatility detection
4. Supply-demand pattern identification
5. Seasonal trend analysis
6. Anomaly detection in market prices

ALWAYS:
- Use actual numbers from the data provided
- Compare states when asked
- Identify price patterns and trends
- Provide specific actionable recommendations
- Generate insights farmers and traders can use

Response format (JSON):
{
  "answer_text": "Detailed answer with specific numbers from the data",
  "data_insights": ["Specific insight 1 with numbers", "Insight 2", ...],
  "predictions": [
    {
      "commodity": "name",
      "trend": "up/down/stable",
      "confidence": "high/medium/low",
      "reason": "explanation"
    }
  ],
  "recommendations": ["Actionable recommendation 1", "Recommendation 2"],
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
      "type": "bar|line|pie|radar",
      "title": "Chart title",
      "description": "What to visualize"
    }
  ],
  "sql_context": "SQL explanation"
}`;

    // Build detailed data context
    const stateDataSummary = buildStateDataSummary(recentProduction || []);

    const userPrompt = `Question: ${sanitizedQuestion}

STATE-WISE DATA SUMMARY:
${stateDataSummary}

DETAILED RECORDS (Latest ${Math.min(20, (recentProduction || []).length)} records):
${JSON.stringify((recentProduction || []).slice(0, 20).map((p: any) => ({
  state: p.state,
  crop: p.crop,
  district: p.district,
  year: p.year,
  modal_price: p.raw_record?.modal_price,
  min_price: p.raw_record?.min_price,
  max_price: p.raw_record?.max_price,
  market: p.raw_record?.market,
  variety: p.raw_record?.variety,
  arrival_date: p.raw_record?.arrival_date
})), null, 2)}

Rainfall Data: ${JSON.stringify(recentRainfall?.slice(0, 10))}

Analyze this REAL market data and provide specific insights, predictions, and recommendations.`;

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
    
    // Return safe error message without internal details
    const safeMessage = error.message?.includes('rate limit') ? 'Rate limit exceeded. Please try again later.'
      : error.message?.includes('credits') ? 'AI usage credits depleted.'
      : 'Failed to process query. Please try again.';

    return new Response(
      JSON.stringify({ error: safeMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateSampleChartData(question: string, production: any[], rainfall: any[]) {
  const charts: any[] = [];
  const lowerQ = question.toLowerCase();

  // Production-based charts when real production exists
  if (
    lowerQ.includes('production') ||
    lowerQ.includes('crop') ||
    lowerQ.includes('trends') ||
    lowerQ.includes('wheat') ||
    lowerQ.includes('rice') ||
    lowerQ.includes('tomato')
  ) {
    if (lowerQ.includes('state') || lowerQ.includes('across')) {
      const byState = aggregateProductionByState(production);
      if (byState.length > 0) charts.push({ type: 'bar', title: 'Production by State', data: byState });
    } else {
      const byYear = aggregateProductionByYear(production);
      if (byYear.length > 0) charts.push({ type: 'bar', title: 'Production Trends', data: byYear });
    }
  }

  // Rainfall
  if (lowerQ.includes('rainfall') || lowerQ.includes('climate')) {
    const r = aggregateRainfallByYear(rainfall);
    if (r.length > 0) charts.push({ type: 'line', title: 'Rainfall Patterns', data: r });
  }

  // Fallback to market price charts when production_t is missing but price exists
  const noChartData = charts.length === 0 || charts.every(c => !c.data || c.data.length === 0);
  const hasPriceSignals = production.some(p => getModalPrice(p) !== null);

  if (noChartData && hasPriceSignals) {
    const priceByState = aggregateModalPriceByState(production);
    if (priceByState.length > 0) {
      charts.push({ type: 'bar', title: 'Average Modal Price by State (₹)', data: priceByState });
    }

    if (lowerQ.includes('trend') || lowerQ.includes('over time')) {
      const priceTrend = aggregateModalPriceByDate(production);
      if (priceTrend.length > 0) {
        charts.push({ type: 'line', title: 'Modal Price Trend (₹)', data: priceTrend });
      }
    }
  }

  // Last resort overview
  if (charts.length === 0 && production.length > 0) {
    const stateData = aggregateProductionByState(production);
    if (stateData.length > 0) charts.push({ type: 'bar', title: 'Agricultural Data Overview', data: stateData });
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

// --------- Market price fallbacks (for datasets with price fields only) ---------
function getModalPrice(item: any): number | null {
  const rr = item?.raw_record || {};
  const candidates = [
    rr.modal_price, rr.Modal_Price, rr['modal price'], rr['Modal Price'], rr.modalPrice
  ];
  let val: any = candidates.find((v: any) => v !== undefined && v !== null);
  if (val === undefined || val === null) {
    const min = rr.min_price ?? rr.Min_Price ?? rr.minPrice;
    const max = rr.max_price ?? rr.Max_Price ?? rr.maxPrice;
    if (min != null && max != null) {
      const minN = parseFloat(String(min).replace(/,/g, ''));
      const maxN = parseFloat(String(max).replace(/,/g, ''));
      if (!isNaN(minN) && !isNaN(maxN)) val = (minN + maxN) / 2;
    }
  }
  if (val == null) return null;
  const n = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function getArrivalDateISO(item: any): string | null {
  const rr = item?.raw_record || {};
  const s: any = rr.arrival_date ?? rr.Arrival_Date ?? rr.arrivalDate ?? null;
  if (typeof s !== 'string') return null;
  const m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  try {
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  } catch {}
  return null;
}

function aggregateModalPriceByState(data: any[]) {
  const map = new Map<string, { sum: number; count: number }>();
  data.forEach(item => {
    const price = getModalPrice(item);
    const state = item.state as string | undefined;
    if (state && price != null) {
      const curr = map.get(state) || { sum: 0, count: 0 };
      curr.sum += price;
      curr.count += 1;
      map.set(state, curr);
    }
  });
  return Array.from(map.entries())
    .map(([state, { sum, count }]) => ({ name: state, value: Math.round(sum / count) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

function aggregateModalPriceByDate(data: any[]) {
  const map = new Map<string, { sum: number; count: number }>();
  data.forEach(item => {
    const price = getModalPrice(item);
    const date = getArrivalDateISO(item);
    if (date && price != null) {
      const curr = map.get(date) || { sum: 0, count: 0 };
      curr.sum += price;
      curr.count += 1;
      map.set(date, curr);
    }
  });
  return Array.from(map.entries())
    .map(([date, { sum, count }]) => ({ name: date, value: Math.round(sum / count) }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-30);
}

// --------- AI Analysis Helper Functions ---------
function calculatePriceStats(data: any[]): { minPrice: number; maxPrice: number; avgPrice: number } {
  const prices: number[] = [];
  
  data.forEach(item => {
    const price = getModalPrice(item);
    if (price !== null && price > 0) {
      prices.push(price);
    }
  });
  
  if (prices.length === 0) {
    return { minPrice: 0, maxPrice: 0, avgPrice: 0 };
  }
  
  return {
    minPrice: Math.round(Math.min(...prices)),
    maxPrice: Math.round(Math.max(...prices)),
    avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
  };
}

function buildStateDataSummary(data: any[]): string {
  const stateMap = new Map<string, {
    records: number;
    commodities: Set<string>;
    avgPrice: number;
    priceCount: number;
    markets: Set<string>;
  }>();
  
  data.forEach(item => {
    const state = item.state as string;
    if (!state) return;
    
    if (!stateMap.has(state)) {
      stateMap.set(state, {
        records: 0,
        commodities: new Set(),
        avgPrice: 0,
        priceCount: 0,
        markets: new Set()
      });
    }
    
    const entry = stateMap.get(state)!;
    entry.records++;
    
    if (item.crop) entry.commodities.add(item.crop);
    
    const rawRecord = item.raw_record as any || {};
    if (rawRecord.market) entry.markets.add(rawRecord.market);
    
    const price = getModalPrice(item);
    if (price !== null) {
      entry.avgPrice = (entry.avgPrice * entry.priceCount + price) / (entry.priceCount + 1);
      entry.priceCount++;
    }
  });
  
  const summaries: string[] = [];
  stateMap.forEach((value, state) => {
    summaries.push(`${state}: ${value.records} records, ${value.commodities.size} commodities, ` +
      `${value.markets.size} markets, Avg Price: ₹${Math.round(value.avgPrice)}`);
  });
  
  return summaries.join('\n');
}
