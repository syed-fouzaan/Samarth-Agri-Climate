import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Upload, CheckCircle2, AlertCircle, Loader2, Cloud, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const DataIngestion = () => {
  const [dataType, setDataType] = useState<string>("production");
  const [datasetId, setDatasetId] = useState<string>("SAMPLE_AGRI_001");
  const [sampleData, setSampleData] = useState<string>("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [resourceId, setResourceId] = useState<string>("9ef84268-d588-465a-a308-a864a43d0070");
  const [syncLimit, setSyncLimit] = useState<number>(100);
  const [results, setResults] = useState<any>(null);

  const handleIngest = async () => {
    if (!sampleData.trim()) {
      toast({
        title: "Data required",
        description: "Please provide sample data in JSON format",
        variant: "destructive"
      });
      return;
    }

    setIsIngesting(true);
    setResults(null);

    try {
      const parsedData = JSON.parse(sampleData);
      
      const { data, error } = await supabase.functions.invoke('ingest-data', {
        body: {
          datasetId,
          sampleData: Array.isArray(parsedData) ? parsedData : [parsedData],
          dataType
        }
      });

      if (error) throw error;

      setResults(data);
      setSampleData("");
      
      toast({
        title: "Data ingestion completed",
        description: `Successfully ingested ${data.inserted} records`
      });
    } catch (error: any) {
      console.error('Ingestion error:', error);
      
      toast({
        title: "Ingestion failed",
        description: error.message || "Failed to ingest data. Check format and try again.",
        variant: "destructive"
      });
    } finally {
      setIsIngesting(false);
    }
  };

  const sampleProductionData = [
    {
      state: "Punjab",
      district: "Ludhiana",
      crop: "Wheat",
      year: "2023",
      area_ha: "50000",
      production_t: "175000",
      yield_kg_per_ha: "3500"
    },
    {
      state: "Punjab",
      district: "Amritsar",
      crop: "Rice",
      year: "2023",
      area_ha: "45000",
      production_t: "180000",
      yield_kg_per_ha: "4000"
    }
  ];

  const sampleRainfallData = [
    {
      state: "Maharashtra",
      district: "Pune",
      year: "2023",
      month: "7",
      rainfall_mm: "250.5"
    },
    {
      state: "Maharashtra",
      district: "Mumbai",
      year: "2023",
      month: "7",
      rainfall_mm: "350.2"
    }
  ];

  const loadSampleData = () => {
    const sample = dataType === "production" ? sampleProductionData : sampleRainfallData;
    setSampleData(JSON.stringify(sample, null, 2));
  };

  const handleSync = async () => {
    if (!resourceId.trim()) {
      toast({
        title: "Resource ID required",
        description: "Please provide a data.gov.in resource ID",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('sync-data-gov-in', {
        body: {
          resourceId,
          limit: syncLimit,
          offset: 0
        }
      });

      if (error) throw error;
      
      if (data && !data.success) {
        throw new Error(data.error || 'Sync failed');
      }

      setResults(data);
      
      toast({
        title: "Data sync completed",
        description: `Successfully synced ${data.inserted} records from data.gov.in`
      });
    } catch (error: any) {
      console.error('Sync error:', error);
      
      const errorMessage = error.message || "Failed to sync data from data.gov.in";
      const isTemporaryError = errorMessage.includes('schema cache') || errorMessage.includes('521');
      
      toast({
        title: isTemporaryError ? "Temporary error - please retry" : "Sync failed",
        description: isTemporaryError 
          ? "The database connection is warming up. Please try again in a few seconds."
          : errorMessage,
        variant: "destructive"
      });
      
      setResults({ success: false, error: errorMessage });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="sync">Live Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-card to-card shadow-soft">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">Manual Data Entry</h2>
                <p className="text-sm text-muted-foreground">
                  Add sample agricultural or climate data to the system
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Type</label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Agricultural Production</SelectItem>
                    <SelectItem value="rainfall">Climate Rainfall</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dataset ID</label>
                <Select value={datasetId} onValueChange={setDatasetId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAMPLE_AGRI_001">SAMPLE_AGRI_001</SelectItem>
                    <SelectItem value="SAMPLE_CLIMATE_001">SAMPLE_CLIMATE_001</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Sample Data (JSON)</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSampleData}
                  disabled={isIngesting}
                >
                  Load Sample
                </Button>
              </div>
              <Textarea
                placeholder='[{"state": "Punjab", "crop": "Wheat", "year": "2023", ...}]'
                value={sampleData}
                onChange={(e) => setSampleData(e.target.value)}
                className="min-h-[200px] resize-none font-mono text-sm"
                disabled={isIngesting}
              />
            </div>

            <Button
              onClick={handleIngest}
              disabled={isIngesting || !sampleData.trim()}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ingesting Data...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Ingest Data
                </>
              )}
            </Button>
          </div>
        </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-card to-card shadow-soft">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Cloud className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-1">Live Data Sync</h2>
                  <p className="text-sm text-muted-foreground">
                    Sync real data from data.gov.in API
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Resource ID</label>
                <Input
                  placeholder="e.g., 9ef84268-d588-465a-a308-a864a43d0070"
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  disabled={isSyncing}
                />
                <p className="text-xs text-muted-foreground">
                  Find resource IDs at <a href="https://data.gov.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">data.gov.in</a>
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Records to Sync</label>
                <Input
                  type="number"
                  min="10"
                  max="1000"
                  value={syncLimit}
                  onChange={(e) => setSyncLimit(parseInt(e.target.value))}
                  disabled={isSyncing}
                />
              </div>

              <Button
                onClick={handleSync}
                disabled={isSyncing || !resourceId.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing from data.gov.in...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Data
                  </>
                )}
              </Button>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h3 className="text-sm font-semibold">Popular Datasets:</h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><strong>Agricultural Production:</strong> 9ef84268-d588-465a-a308-a864a43d0070</p>
                  <p><strong>Rainfall Data:</strong> e9a7921f-8924-4f1d-b1f9-1b9f8c0a3c8d</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {results && (
        <Card className={`p-6 ${results.success ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${results.success ? 'bg-primary/10' : 'bg-destructive/10'}`}>
              {results.success ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Ingestion Results</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Records Inserted:</span>
                  <Badge variant={results.inserted > 0 ? "default" : "outline"}>
                    {results.inserted}
                  </Badge>
                </div>
                {results.errors > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Errors:</span>
                    <Badge variant="destructive">{results.errors}</Badge>
                  </div>
                )}
                {results.error_details && results.error_details.length > 0 && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium mb-2">Error Details:</p>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(results.error_details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-muted/50">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          Data Format Guidelines
        </h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p><strong>Production Data:</strong> state, district, crop, year, area_ha, production_t, yield_kg_per_ha</p>
          <p><strong>Rainfall Data:</strong> state, district, year, month, rainfall_mm</p>
          <p className="mt-2 text-primary">All data is stored with full provenance for citation tracking</p>
        </div>
      </Card>
    </div>
  );
};
