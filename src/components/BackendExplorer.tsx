import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, FileText, Activity, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const BackendExplorer = () => {
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [recentQueries, setRecentQueries] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDatasets: 0,
    totalProduction: 0,
    totalRainfall: 0,
    totalQueries: 0
  });

  useEffect(() => {
    loadBackendData();
  }, []);

  const loadBackendData = async () => {
    setLoading(true);
    try {
      // Load datasets
      const { data: datasetsData, error: datasetsError } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (datasetsError) throw datasetsError;
      setDatasets(datasetsData || []);

      // Load recent queries
      const { data: queriesData, error: queriesError } = await supabase
        .from('query_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (queriesError) throw queriesError;
      setRecentQueries(queriesData || []);

      // Load stats
      const { count: productionCount } = await supabase
        .from('fact_production')
        .select('*', { count: 'exact', head: true });

      const { count: rainfallCount } = await supabase
        .from('fact_rainfall')
        .select('*', { count: 'exact', head: true });

      const { count: queryCount } = await supabase
        .from('query_logs')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalDatasets: datasetsData?.length || 0,
        totalProduction: productionCount || 0,
        totalRainfall: rainfallCount || 0,
        totalQueries: queryCount || 0
      });

    } catch (error: any) {
      console.error('Error loading backend data:', error);
      toast({
        title: "Failed to load backend data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Datasets</p>
              <p className="text-2xl font-bold">{stats.totalDatasets}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Production Records</p>
              <p className="text-2xl font-bold">{stats.totalProduction}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rainfall Records</p>
              <p className="text-2xl font-bold">{stats.totalRainfall}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Queries</p>
              <p className="text-2xl font-bold">{stats.totalQueries}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Datasets Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Datasets
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Last Synced</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell className="font-medium">{dataset.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{dataset.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{dataset.resource_id}</TableCell>
                  <TableCell>{dataset.total_records || 0}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={dataset.quality_score === 'high' ? 'default' : 'secondary'}
                    >
                      {dataset.quality_score}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dataset.last_synced_at 
                      ? new Date(dataset.last_synced_at).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Recent Queries */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Recent Queries
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Runtime</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentQueries.map((query) => (
                <TableRow key={query.id}>
                  <TableCell className="max-w-md truncate">{query.question}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        query.status === 'completed' ? 'default' : 
                        query.status === 'error' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {query.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{query.runtime_ms ? `${query.runtime_ms}ms` : '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(query.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
