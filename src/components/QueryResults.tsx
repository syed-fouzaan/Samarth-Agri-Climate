import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FileText, Database, Clock, ChevronDown, ExternalLink, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface QueryResultsProps {
  results: {
    answer: string;
    charts: any[];
    citations: any[];
    provenance: any;
  };
}

export const QueryResults = ({ results }: QueryResultsProps) => {
  const [citationsOpen, setCitationsOpen] = useState(false);
  const [provenanceOpen, setProvenanceOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Answer Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-card border-primary/20 shadow-soft">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Answer</h3>
            <p className="text-sm text-muted-foreground">Generated from verified data sources</p>
          </div>
        </div>
        <p className="text-foreground leading-relaxed">{results.answer}</p>
      </Card>

      {/* Charts */}
      {results.charts && results.charts.length > 0 && (
        <Card className="p-6 bg-card shadow-soft">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <BarChart className="h-5 w-5 text-accent" />
            Data Visualization
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results.charts[0].data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                  name="Value"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Citations */}
      <Collapsible open={citationsOpen} onOpenChange={setCitationsOpen}>
        <Card className="p-6 bg-card/50 border-accent/20">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Data Citations</h3>
                  <p className="text-sm text-muted-foreground">
                    {results.citations.length} source{results.citations.length !== 1 ? 's' : ''} referenced
                  </p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${citationsOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-3">
            <Separator />
            {results.citations.map((citation, idx) => (
              <div key={idx} className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{citation.title}</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Database className="h-3 w-3" />
                        <code className="bg-muted px-2 py-0.5 rounded">
                          {citation.resource_id}
                        </code>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <code className="bg-muted px-2 py-0.5 rounded break-all flex-1">
                          {citation.api_url}
                        </code>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs border-accent/30">
                    Verified
                  </Badge>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Provenance Info */}
      <Collapsible open={provenanceOpen} onOpenChange={setProvenanceOpen}>
        <Card className="p-6 bg-card/50">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-foreground/10 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-foreground" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Execution Provenance</h3>
                  <p className="text-sm text-muted-foreground">
                    Full query execution details
                  </p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${provenanceOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-3">
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Query Time</p>
                <p className="text-sm font-mono">
                  {new Date(results.provenance.query_time).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Execution Steps</p>
                <p className="text-sm font-mono">{results.provenance.execution_steps}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Data Sources</p>
                <p className="text-sm font-mono">{results.provenance.data_sources}</p>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
