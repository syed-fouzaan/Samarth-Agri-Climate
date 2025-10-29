import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, Sparkles, AlertCircle, Filter } from "lucide-react";
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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dataType: "all",
    state: "",
    yearFrom: "",
    yearTo: "",
    crop: ""
  });

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
      // Build enhanced question with filters
      let enhancedQuestion = query;
      const activeFilters = [];
      
      if (filters.state) activeFilters.push(`for state: ${filters.state}`);
      if (filters.crop) activeFilters.push(`for crop: ${filters.crop}`);
      if (filters.yearFrom && filters.yearTo) {
        activeFilters.push(`between years ${filters.yearFrom} and ${filters.yearTo}`);
      } else if (filters.yearFrom) {
        activeFilters.push(`from year ${filters.yearFrom}`);
      } else if (filters.yearTo) {
        activeFilters.push(`up to year ${filters.yearTo}`);
      }
      if (filters.dataType !== "all") {
        activeFilters.push(`using ${filters.dataType} data`);
      }
      
      if (activeFilters.length > 0) {
        enhancedQuestion = `${query} ${activeFilters.join(', ')}`;
      }

      const { supabase } = await import("@/integrations/supabase/client");
      
      const { data, error } = await supabase.functions.invoke('process-query', {
        body: { 
          question: enhancedQuestion,
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="ml-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>

          {showFilters && (
            <Card className="p-4 bg-muted/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Type</Label>
                  <Select value={filters.dataType} onValueChange={(value) => setFilters({...filters, dataType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Data</SelectItem>
                      <SelectItem value="production">Production Only</SelectItem>
                      <SelectItem value="rainfall">Rainfall Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>State (Optional)</Label>
                  <Select value={filters.state} onValueChange={(value) => setFilters({...filters, state: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All states" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All States</SelectItem>
                      <SelectItem value="Punjab">Punjab</SelectItem>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                      <SelectItem value="Karnataka">Karnataka</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Crop (Optional)</Label>
                  <Select value={filters.crop} onValueChange={(value) => setFilters({...filters, crop: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All crops" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Crops</SelectItem>
                      <SelectItem value="Wheat">Wheat</SelectItem>
                      <SelectItem value="Rice">Rice</SelectItem>
                      <SelectItem value="Cotton">Cotton</SelectItem>
                      <SelectItem value="Sugarcane">Sugarcane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Year Range (Optional)</Label>
                  <div className="flex gap-2">
                    <Select value={filters.yearFrom} onValueChange={(value) => setFilters({...filters, yearFrom: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="From" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        <SelectItem value="2020">2020</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.yearTo} onValueChange={(value) => setFilters({...filters, yearTo: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="To" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        <SelectItem value="2020">2020</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>
          )}

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
