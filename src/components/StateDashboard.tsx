import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Database, MapPin, TrendingUp, BarChart3, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

interface DatasetStats {
  id: string;
  title: string;
  category: string;
  total_records: number;
  last_synced_at: string;
}

interface StateData {
  state: string;
  record_count: number;
  avg_modal_price: number;
  commodities: string[];
  markets: number;
  price_trend: { date: string; price: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];

export const StateDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<DatasetStats[]>([]);
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch datasets
      const { data: datasetsData, error: datasetsError } = await supabase
        .from('datasets')
        .select('id, title, category, total_records, last_synced_at');
      
      if (datasetsError) throw datasetsError;
      setDatasets(datasetsData || []);

      // Fetch state-wise aggregated data
      const { data: productionData, error: productionError } = await supabase
        .from('fact_production')
        .select('state, raw_record, crop, district, created_at');
      
      if (productionError) throw productionError;

      // Process state data
      const stateMap = new Map<string, StateData>();
      
      (productionData || []).forEach((record: any) => {
        const state = record.state;
        if (!stateMap.has(state)) {
          stateMap.set(state, {
            state,
            record_count: 0,
            avg_modal_price: 0,
            commodities: [],
            markets: 0,
            price_trend: []
          });
        }
        
        const stateEntry = stateMap.get(state)!;
        stateEntry.record_count++;
        
        // Extract price from raw_record
        const rawRecord = record.raw_record as any;
        if (rawRecord?.modal_price) {
          const price = parseFloat(rawRecord.modal_price);
          if (!isNaN(price)) {
            stateEntry.avg_modal_price = (stateEntry.avg_modal_price * (stateEntry.record_count - 1) + price) / stateEntry.record_count;
          }
        }
        
        // Track commodities
        if (record.crop && !stateEntry.commodities.includes(record.crop)) {
          stateEntry.commodities.push(record.crop);
        }
        
        // Track markets
        if (rawRecord?.market) {
          stateEntry.markets++;
        }
      });

      const processedStates = Array.from(stateMap.values())
        .sort((a, b) => b.record_count - a.record_count);
      
      setStateData(processedStates);
      setTotalRecords(productionData?.length || 0);
      
      // Auto-select top 3 states
      if (processedStates.length > 0 && selectedStates.length === 0) {
        setSelectedStates(processedStates.slice(0, 3).map(s => s.state));
      }

    } catch (error: any) {
      console.error('Dashboard load error:', error);
      toast({
        title: "Failed to load dashboard",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleState = (state: string) => {
    setSelectedStates(prev => 
      prev.includes(state) 
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  const getSelectedStatesData = () => {
    return stateData.filter(s => selectedStates.includes(s.state));
  };

  const getPriceComparisonData = () => {
    return getSelectedStatesData().map(s => ({
      state: s.state,
      avgPrice: Math.round(s.avg_modal_price),
      records: s.record_count,
      commodities: s.commodities.length,
      markets: s.markets
    }));
  };

  const getCommodityDistribution = () => {
    const commodityCount = new Map<string, number>();
    getSelectedStatesData().forEach(state => {
      state.commodities.forEach(commodity => {
        commodityCount.set(commodity, (commodityCount.get(commodity) || 0) + 1);
      });
    });
    return Array.from(commodityCount.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const getRadarData = () => {
    const metrics = ['Records', 'Avg Price', 'Commodities', 'Markets'];
    const maxValues = {
      Records: Math.max(...stateData.map(s => s.record_count)),
      'Avg Price': Math.max(...stateData.map(s => s.avg_modal_price)),
      Commodities: Math.max(...stateData.map(s => s.commodities.length)),
      Markets: Math.max(...stateData.map(s => s.markets))
    };

    return metrics.map(metric => {
      const dataPoint: any = { metric };
      getSelectedStatesData().forEach(state => {
        let value = 0;
        switch(metric) {
          case 'Records': value = (state.record_count / maxValues.Records) * 100; break;
          case 'Avg Price': value = (state.avg_modal_price / maxValues['Avg Price']) * 100; break;
          case 'Commodities': value = (state.commodities.length / maxValues.Commodities) * 100; break;
          case 'Markets': value = (state.markets / maxValues.Markets) * 100; break;
        }
        dataPoint[state.state] = Math.round(value);
      });
      return dataPoint;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show empty state when no data is synced yet
  if (datasets.length === 0 && stateData.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Data Synced Yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Go to the <strong>Ingest Data</strong> tab to sync commodity market data from data.gov.in. 
          Once synced, you'll see state-wise comparisons and analytics here.
        </p>
        <Button variant="outline" onClick={loadDashboardData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Dashboard
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dataset Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Synced Datasets</p>
              <p className="text-2xl font-bold">{datasets.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-card to-accent/5 border-accent/20">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-2xl font-bold">{totalRecords.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-card to-green-500/5 border-green-500/20">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">States Covered</p>
              <p className="text-2xl font-bold">{stateData.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-card to-orange-500/5 border-orange-500/20">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Commodities</p>
              <p className="text-2xl font-bold">
                {new Set(stateData.flatMap(s => s.commodities)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Datasets Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Synced Datasets
          </h3>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Dataset</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Records</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Last Synced</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((dataset) => (
                <tr key={dataset.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-3">
                    <span className="font-medium">{dataset.title}</span>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={dataset.category === 'agriculture' ? 'default' : 'secondary'}>
                      {dataset.category}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {dataset.total_records.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-sm text-muted-foreground">
                    {dataset.last_synced_at 
                      ? new Date(dataset.last_synced_at).toLocaleString()
                      : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* State Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Select States to Compare (min 2)
        </h3>
        <div className="flex flex-wrap gap-3">
          {stateData.map((state) => (
            <label
              key={state.state}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                selectedStates.includes(state.state)
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card hover:bg-muted/50 border-border'
              }`}
            >
              <Checkbox
                checked={selectedStates.includes(state.state)}
                onCheckedChange={() => toggleState(state.state)}
              />
              <span className="font-medium">{state.state}</span>
              <Badge variant="outline" className="ml-1">
                {state.record_count}
              </Badge>
            </label>
          ))}
        </div>
      </Card>

      {/* Comparison Charts */}
      {selectedStates.length >= 2 && (
        <Tabs defaultValue="price" className="space-y-4">
          <TabsList className="grid w-full max-w-xl grid-cols-4">
            <TabsTrigger value="price">Price Comparison</TabsTrigger>
            <TabsTrigger value="volume">Volume Analysis</TabsTrigger>
            <TabsTrigger value="commodities">Commodities</TabsTrigger>
            <TabsTrigger value="radar">Multi-Metric</TabsTrigger>
          </TabsList>

          <TabsContent value="price">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">Average Modal Price by State (₹/Quintal)</h4>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getPriceComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="state" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="avgPrice" name="Avg Modal Price (₹)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="volume">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">Record Volume & Market Coverage</h4>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getPriceComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="state" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="records" name="Total Records" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="markets" name="Markets Covered" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="commodities">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">Commodity Distribution (Selected States)</h4>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={getCommodityDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getCommodityDistribution().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="radar">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">Multi-Metric State Comparison</h4>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  {getSelectedStatesData().map((state, index) => (
                    <Radar
                      key={state.state}
                      name={state.state}
                      dataKey={state.state}
                      stroke={COLORS[index % COLORS.length]}
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity={0.3}
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {selectedStates.length < 2 && (
        <Card className="p-8 text-center bg-muted/50">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select at least 2 states</h3>
          <p className="text-muted-foreground">
            Choose states from above to compare their agricultural data
          </p>
        </Card>
      )}

      {/* Individual State Cards */}
      {selectedStates.length >= 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getSelectedStatesData().map((state, index) => (
            <Card key={state.state} className="p-6" style={{ borderColor: COLORS[index % COLORS.length] }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-bold">{state.state}</h4>
                  <p className="text-sm text-muted-foreground">{state.record_count} records</p>
                </div>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Modal Price</span>
                  <span className="font-mono font-medium">₹{Math.round(state.avg_modal_price).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Commodities</span>
                  <span className="font-medium">{state.commodities.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Markets</span>
                  <span className="font-medium">{state.markets}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Top Commodities</p>
                <div className="flex flex-wrap gap-1">
                  {state.commodities.slice(0, 5).map(c => (
                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
