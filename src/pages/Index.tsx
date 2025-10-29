import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, Cloud, Search, Database, TrendingUp, BarChart3 } from "lucide-react";
import { QueryInterface } from "@/components/QueryInterface";
import { DataInsights } from "@/components/DataInsights";
import { DataIngestion } from "@/components/DataIngestion";
import { BackendExplorer } from "@/components/BackendExplorer";

const Index = () => {
  const [activeTab, setActiveTab] = useState("query");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
                <div className="relative bg-gradient-to-br from-primary to-primary/80 p-3 rounded-xl">
                  <Leaf className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Samarth Agri-Climate
                </h1>
                <p className="text-sm text-muted-foreground">
                  Data-Driven Agricultural Intelligence
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span>Live Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span>Real-time Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-primary/20 shadow-soft hover:shadow-hover transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Agriculture Data</p>
                <h3 className="text-3xl font-bold text-primary">12.5K+</h3>
                <p className="text-xs text-muted-foreground mt-1">Production Records</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-accent/5 border-accent/20 shadow-soft hover:shadow-hover transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Climate Data</p>
                <h3 className="text-3xl font-bold text-accent">8.3K+</h3>
                <p className="text-xs text-muted-foreground mt-1">Rainfall Records</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <Cloud className="h-6 w-6 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-foreground/5 border-border shadow-soft hover:shadow-hover transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Queries Processed</p>
                <h3 className="text-3xl font-bold text-foreground">2.1K+</h3>
                <p className="text-xs text-muted-foreground mt-1">With Full Provenance</p>
              </div>
              <div className="bg-foreground/10 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-foreground" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 bg-muted/50">
            <TabsTrigger value="query" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Search className="h-4 w-4 mr-2" />
              Query
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              <TrendingUp className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="ingest" className="data-[state=active]:bg-foreground data-[state=active]:text-background">
              <Database className="h-4 w-4 mr-2" />
              Ingest
            </TabsTrigger>
            <TabsTrigger value="backend" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <BarChart3 className="h-4 w-4 mr-2" />
              Backend
            </TabsTrigger>
          </TabsList>

          <TabsContent value="query" className="space-y-6">
            <QueryInterface />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <DataInsights />
          </TabsContent>

          <TabsContent value="ingest" className="space-y-6">
            <DataIngestion />
          </TabsContent>

          <TabsContent value="backend" className="space-y-6">
            <BackendExplorer />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Powered by data.gov.in Agriculture & IMD Climate Datasets</p>
            <p className="mt-2">All queries include full citation and provenance tracking</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
