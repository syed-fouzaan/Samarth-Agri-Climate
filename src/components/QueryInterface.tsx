import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { QueryResults } from "./QueryResults";

const exampleQueries = [
  {
    label: "Rainfall Comparison",
    query: "Compare the average annual rainfall in Maharashtra and Karnataka for the last 5 years",
    category: "climate"
  },
  {
    label: "Crop Production",
    query: "What are the top 3 cereals by production in Punjab in 2022?",
    category: "agriculture"
  },
  {
    label: "District Analysis",
    query: "Show me rice production trends in West Bengal districts from 2018 to 2023",
    category: "agriculture"
  },
  {
    label: "Multi-State Climate",
    query: "Compare monsoon rainfall patterns across Madhya Pradesh, Rajasthan, and Gujarat",
    category: "climate"
  }
];

export const QueryInterface = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSubmit = async () => {
    if (!query.trim()) {
      toast({
        title: "Query required",
        description: "Please enter a question about agriculture or climate data.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResults(null);
    
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { data, error } = await supabase.functions.invoke('process-query', {
        body: { 
          question: query,
          sessionId: crypto.randomUUID()
        }
      });

      if (error) throw error;
      
      setResults(data);
      
      toast({
        title: "Query completed",
        description: "Results generated with full provenance tracking"
      });
    } catch (error: any) {
      console.error('Query error:', error);
      
      let errorMessage = "Failed to process query. Please try again.";
      
      if (error.message?.includes('rate limit')) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.message?.includes('credits')) {
        errorMessage = "AI usage credits depleted. Please contact support.";
      }
      
      toast({
        title: "Query failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <div className="space-y-6">
      {/* Query Input Card */}
      <Card className="p-6 bg-gradient-to-br from-card to-card shadow-soft">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">Ask a Question</h2>
              <p className="text-sm text-muted-foreground">
                Query agriculture production and climate data with natural language
              </p>
            </div>
          </div>

          <Textarea
            placeholder="Example: Compare wheat production in Punjab and Haryana over the last 5 years..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={isLoading}
          />

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              All queries include citation tracking
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || !query.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Run Query
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Example Queries */}
      <Card className="p-6 bg-card/50">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Example Queries
        </h3>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(example.query)}
              disabled={isLoading}
              className="group"
            >
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-all duration-200"
              >
                <span className="text-xs">{example.label}</span>
              </Badge>
            </button>
          ))}
        </div>
      </Card>

      {/* Results */}
      {results && <QueryResults results={results} />}
    </div>
  );
};
