import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Leaf, Cloud, Database, RefreshCw } from "lucide-react";

const trendData = [
  { year: "2019", agriculture: 4200, rainfall: 850 },
  { year: "2020", agriculture: 4500, rainfall: 920 },
  { year: "2021", agriculture: 4300, rainfall: 780 },
  { year: "2022", agriculture: 4800, rainfall: 1050 },
  { year: "2023", agriculture: 5100, rainfall: 980 }
];

const cropDistribution = [
  { name: "Rice", value: 35 },
  { name: "Wheat", value: 28 },
  { name: "Pulses", value: 18 },
  { name: "Other", value: 19 }
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-agriculture))', 'hsl(var(--muted))'];

export const DataInsights = () => {
  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-card border-primary/30">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Production Growth</h3>
                <p className="text-sm text-muted-foreground">Year-over-year</p>
              </div>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30">+12.5%</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Agricultural production shows consistent growth trend across major states
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/10 to-card border-accent/30">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-accent/20 p-2 rounded-lg">
                <TrendingDown className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Rainfall Variance</h3>
                <p className="text-sm text-muted-foreground">Regional analysis</p>
              </div>
            </div>
            <Badge className="bg-accent/20 text-accent border-accent/30">±8.3%</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Climate patterns show moderate variability requiring adaptive strategies
          </p>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card className="p-6 bg-card shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Historical Trends
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Agriculture production and rainfall patterns over time
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="year"
                stroke="hsl(var(--muted-foreground))"
                className="text-xs"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                className="text-xs"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="agriculture" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Production (MT)"
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="rainfall" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                name="Rainfall (mm)"
                dot={{ fill: "hsl(var(--accent))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-card shadow-soft">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            Crop Distribution
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cropDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {cropDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 bg-card shadow-soft">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-accent" />
            Data Quality Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completeness</span>
                <span className="text-sm text-muted-foreground">94%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '94%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Accuracy</span>
                <span className="text-sm text-muted-foreground">97%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: '97%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Timeliness</span>
                <span className="text-sm text-muted-foreground">89%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-chart-agriculture rounded-full" style={{ width: '89%' }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Alert Card */}
      <Card className="p-6 bg-gradient-to-br from-destructive/5 to-card border-destructive/20">
        <div className="flex items-start gap-3">
          <div className="bg-destructive/10 p-2 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Data Ingestion Required</h3>
            <p className="text-sm text-muted-foreground mb-3">
              To enable live queries, connect to data.gov.in API and configure resource IDs
            </p>
            <Button variant="outline" size="sm" className="border-destructive/30">
              Configure Data Sources
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
