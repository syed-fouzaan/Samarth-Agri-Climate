import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, Cloud, Search, Database, TrendingUp, BarChart3, Brain, MapPin } from "lucide-react";
import { QueryInterface } from "@/components/QueryInterface";
import { DataInsights } from "@/components/DataInsights";
import { DataIngestion } from "@/components/DataIngestion";
import { BackendExplorer } from "@/components/BackendExplorer";
import { StateDashboard } from "@/components/StateDashboard";
import { AIAnalytics } from "@/components/AIAnalytics";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

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
                  AI-Powered Agricultural Intelligence
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
                  <Brain className="h-4 w-4 text-accent" />
                  <span>AI Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-6 bg-muted/50">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="compare" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              <BarChart3 className="h-4 w-4 mr-2" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Brain className="h-4 w-4 mr-2" />
              AI Analytics
            </TabsTrigger>
            <TabsTrigger value="query" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Search className="h-4 w-4 mr-2" />
              Query
            </TabsTrigger>
            <TabsTrigger value="ingest" className="data-[state=active]:bg-foreground data-[state=active]:text-background">
              <Database className="h-4 w-4 mr-2" />
              Ingest
            </TabsTrigger>
            <TabsTrigger value="backend" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <TrendingUp className="h-4 w-4 mr-2" />
              Backend
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <StateDashboard />
          </TabsContent>

          <TabsContent value="compare" className="space-y-6">
            <StateDashboard />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <AIAnalytics />
          </TabsContent>

          <TabsContent value="query" className="space-y-6">
            <QueryInterface />
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
            <p className="mt-2">AI-powered predictions with full citation and provenance tracking</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
