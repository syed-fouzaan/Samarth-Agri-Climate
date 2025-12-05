import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Brain, TrendingUp, AlertTriangle, Lightbulb, BarChart3, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface Prediction {
  commodity: string;
  state: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
}

interface Anomaly {
  commodity: string;
  state: string;
  market: string;
  price: number;
  expectedRange: { min: number; max: number };
  severity: 'high' | 'medium' | 'low';
  reason: string;
}

interface Insight {
  title: string;
  description: string;
  actionable: boolean;
  category: 'opportunity' | 'risk' | 'trend';
}

export const AIAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("");
  const [states, setStates] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);

  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      runAnalysis();
    }
  }, [selectedState]);

  const loadStates = async () => {
    try {
      const { data, error } = await supabase
        .from('fact_production')
        .select('state')
        .order('state');
      
      if (error) throw error;
      
      const uniqueStates = [...new Set((data || []).map(d => d.state))];
      setStates(uniqueStates);
      
      if (uniqueStates.length > 0) {
        setSelectedState(uniqueStates[0]);
      }
    } catch (error: any) {
      console.error('Error loading states:', error);
    }
  };

  const runAnalysis = async () => {
    if (!selectedState) return;
    
    setLoading(true);
    try {
      // Fetch state data
      const { data: stateData, error } = await supabase
        .from('fact_production')
        .select('*')
        .eq('state', selectedState);
      
      if (error) throw error;
      
      // Process data for analysis
      const commodityPrices = new Map<string, number[]>();
      const priceByDate = new Map<string, { date: string; prices: number[] }>();
      
      (stateData || []).forEach((record: any) => {
        const rawRecord = record.raw_record as any;
        const commodity = record.crop;
        const modalPrice = parseFloat(rawRecord?.modal_price) || 0;
        
        if (modalPrice > 0) {
          if (!commodityPrices.has(commodity)) {
            commodityPrices.set(commodity, []);
          }
          commodityPrices.get(commodity)!.push(modalPrice);
          
          // Track by date
          const date = rawRecord?.arrival_date || record.created_at?.split('T')[0];
          if (date) {
            if (!priceByDate.has(date)) {
              priceByDate.set(date, { date, prices: [] });
            }
            priceByDate.get(date)!.prices.push(modalPrice);
          }
        }
      });

      // Generate predictions using statistical analysis
      const newPredictions: Prediction[] = [];
      commodityPrices.forEach((prices, commodity) => {
        if (prices.length >= 2) {
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
          const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
          const stdDev = Math.sqrt(variance);
          const trend = prices[prices.length - 1] > avgPrice ? 'up' : prices[prices.length - 1] < avgPrice ? 'down' : 'stable';
          
          // Simple linear regression for prediction
          const n = prices.length;
          const sumX = (n * (n + 1)) / 2;
          const sumY = prices.reduce((a, b) => a + b, 0);
          const sumXY = prices.reduce((sum, y, i) => sum + (i + 1) * y, 0);
          const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
          
          const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
          const predictedPrice = prices[prices.length - 1] + slope * 2; // Predict 2 periods ahead
          
          newPredictions.push({
            commodity,
            state: selectedState,
            currentPrice: Math.round(prices[prices.length - 1]),
            predictedPrice: Math.round(Math.max(0, predictedPrice)),
            confidence: Math.min(95, Math.max(60, 100 - (stdDev / avgPrice * 100))),
            trend,
            factors: generateFactors(trend, stdDev, avgPrice)
          });
        }
      });

      setPredictions(newPredictions.slice(0, 10));

      // Detect anomalies
      const newAnomalies: Anomaly[] = [];
      (stateData || []).forEach((record: any) => {
        const rawRecord = record.raw_record as any;
        const commodity = record.crop;
        const modalPrice = parseFloat(rawRecord?.modal_price) || 0;
        const prices = commodityPrices.get(commodity) || [];
        
        if (prices.length >= 3 && modalPrice > 0) {
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
          const stdDev = Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length);
          const zScore = Math.abs((modalPrice - avgPrice) / stdDev);
          
          if (zScore > 2) {
            newAnomalies.push({
              commodity,
              state: selectedState,
              market: rawRecord?.market || 'Unknown',
              price: modalPrice,
              expectedRange: {
                min: Math.round(avgPrice - stdDev),
                max: Math.round(avgPrice + stdDev)
              },
              severity: zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low',
              reason: modalPrice > avgPrice 
                ? 'Price significantly above market average'
                : 'Price significantly below market average'
            });
          }
        }
      });

      setAnomalies(newAnomalies.slice(0, 10));

      // Generate insights
      const newInsights: Insight[] = [];
      
      // Price trend insights
      const upTrends = newPredictions.filter(p => p.trend === 'up');
      const downTrends = newPredictions.filter(p => p.trend === 'down');
      
      if (upTrends.length > downTrends.length) {
        newInsights.push({
          title: 'Overall Bullish Market',
          description: `${upTrends.length} out of ${newPredictions.length} commodities show upward price trends. Consider timing sales for maximum returns.`,
          actionable: true,
          category: 'opportunity'
        });
      }

      if (downTrends.length > 0) {
        newInsights.push({
          title: 'Price Decline Alert',
          description: `${downTrends.map(d => d.commodity).join(', ')} showing downward trends. Consider early harvesting or alternative markets.`,
          actionable: true,
          category: 'risk'
        });
      }

      if (newAnomalies.length > 0) {
        newInsights.push({
          title: 'Price Anomalies Detected',
          description: `Found ${newAnomalies.length} unusual price points in ${selectedState}. These may indicate local supply/demand imbalances or data quality issues.`,
          actionable: true,
          category: 'trend'
        });
      }

      // Commodity diversity insight
      const commodityCount = commodityPrices.size;
      newInsights.push({
        title: 'Market Diversity Analysis',
        description: `${commodityCount} different commodities tracked in ${selectedState}. ${commodityCount > 10 ? 'High market diversity offers risk mitigation.' : 'Consider expanding crop variety tracking.'}`,
        actionable: commodityCount <= 10,
        category: 'trend'
      });

      setInsights(newInsights);

      // Price history for charts
      const historyData = Array.from(priceByDate.values())
        .map(d => ({
          date: d.date,
          avgPrice: Math.round(d.prices.reduce((a, b) => a + b, 0) / d.prices.length)
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);
      
      setPriceHistory(historyData);

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-query', {
        body: {
          question: `Analyze agricultural market trends for ${selectedState}. Provide detailed insights on price patterns, seasonal variations, and recommendations for farmers. Focus on the top commodities and identify any risks or opportunities.`,
          sessionId: crypto.randomUUID()
        }
      });

      if (error) throw error;

      toast({
        title: "AI Analysis Complete",
        description: "Check the Query tab for detailed AI-generated insights"
      });

    } catch (error: any) {
      toast({
        title: "AI Analysis failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const generateFactors = (trend: string, stdDev: number, avgPrice: number): string[] => {
    const factors = [];
    if (trend === 'up') {
      factors.push('Increasing demand');
      factors.push('Seasonal factors');
    } else if (trend === 'down') {
      factors.push('Supply surplus');
      factors.push('Market saturation');
    }
    if (stdDev / avgPrice > 0.2) {
      factors.push('High price volatility');
    }
    factors.push('Market competition');
    return factors.slice(0, 3);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-card to-primary/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI-Powered Analytics</h2>
              <p className="text-sm text-muted-foreground">
                Machine learning predictions & anomaly detection on real market data
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={runAIAnalysis} disabled={analyzing || !selectedState}>
              {analyzing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Deep AI Analysis
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="predictions" className="space-y-4">
          <TabsList className="grid w-full max-w-xl grid-cols-4">
            <TabsTrigger value="predictions">
              <TrendingUp className="h-4 w-4 mr-2" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="anomalies">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Anomalies
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Lightbulb className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="trends">
              <BarChart3 className="h-4 w-4 mr-2" />
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Price Predictions (Statistical Model)
              </h3>
              
              {predictions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Select a state with sufficient data to generate predictions
                </p>
              ) : (
                <div className="grid gap-4">
                  {predictions.map((pred, idx) => (
                    <Card key={idx} className={`p-4 border-l-4 ${
                      pred.trend === 'up' ? 'border-l-green-500 bg-green-500/5' :
                      pred.trend === 'down' ? 'border-l-red-500 bg-red-500/5' :
                      'border-l-yellow-500 bg-yellow-500/5'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{pred.commodity}</h4>
                          <p className="text-sm text-muted-foreground">{pred.state}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">₹{pred.currentPrice}</span>
                            <span className="text-lg">→</span>
                            <span className={`font-bold text-lg ${
                              pred.trend === 'up' ? 'text-green-600' :
                              pred.trend === 'down' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              ₹{pred.predictedPrice}
                            </span>
                          </div>
                          <Badge variant="outline" className="mt-1">
                            {pred.confidence.toFixed(0)}% confidence
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {pred.factors.map((factor, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Price Anomalies Detected
              </h3>
              
              {anomalies.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No anomalies detected in current data</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {anomalies.map((anomaly, idx) => (
                    <Card key={idx} className={`p-4 border-l-4 ${
                      anomaly.severity === 'high' ? 'border-l-red-500 bg-red-500/5' :
                      anomaly.severity === 'medium' ? 'border-l-orange-500 bg-orange-500/5' :
                      'border-l-yellow-500 bg-yellow-500/5'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{anomaly.commodity}</h4>
                            <Badge variant={
                              anomaly.severity === 'high' ? 'destructive' :
                              anomaly.severity === 'medium' ? 'default' :
                              'secondary'
                            }>
                              {anomaly.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{anomaly.market}, {anomaly.state}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">₹{anomaly.price}</p>
                          <p className="text-xs text-muted-foreground">
                            Expected: ₹{anomaly.expectedRange.min} - ₹{anomaly.expectedRange.max}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{anomaly.reason}</p>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI-Generated Insights
              </h3>
              
              {insights.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Analyzing data to generate insights...
                </p>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight, idx) => (
                    <Card key={idx} className={`p-4 border-l-4 ${
                      insight.category === 'opportunity' ? 'border-l-green-500 bg-green-500/5' :
                      insight.category === 'risk' ? 'border-l-red-500 bg-red-500/5' :
                      'border-l-blue-500 bg-blue-500/5'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                        </div>
                        <Badge variant={
                          insight.category === 'opportunity' ? 'default' :
                          insight.category === 'risk' ? 'destructive' :
                          'secondary'
                        }>
                          {insight.category}
                        </Badge>
                      </div>
                      {insight.actionable && (
                        <Badge variant="outline" className="mt-3">
                          Actionable
                        </Badge>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Price Trend Analysis - {selectedState}</h3>
              
              {priceHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Insufficient data for trend visualization
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="avgPrice" 
                      name="Avg Price (₹)"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
