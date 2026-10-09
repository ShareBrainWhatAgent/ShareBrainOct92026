import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Book, Plus, Edit, Save, FileText, Lightbulb, Map, Globe } from "lucide-react";

export default function AgentCreationManual() {
  const { toast } = useToast();
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [editingManual, setEditingManual] = useState<any>(null);
  const [newDomain, setNewDomain] = useState("");
  const [newDomainData, setNewDomainData] = useState({
    name: "",
    description: "",
    domainQuestions: "",
    enthusiastQuestions: "",
    contentStructure: "",
    qualityBenchmarks: "",
    exampleAgent: ""
  });

  const { data: manuals, isLoading } = useQuery({
    queryKey: ["/api/agent-creation-manual"],
  });

  const createManualMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/agent-creation-manual", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-creation-manual"] });
      toast({
        title: "Success",
        description: "Agent creation manual created successfully",
      });
      setNewDomain("");
      setNewDomainData({
        name: "",
        description: "",
        domainQuestions: "",
        enthusiastQuestions: "",
        contentStructure: "",
        qualityBenchmarks: "",
        exampleAgent: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create manual",
        variant: "destructive",
      });
    },
  });

  const updateManualMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/agent-creation-manual/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-creation-manual"] });
      toast({
        title: "Success",
        description: "Agent creation manual updated successfully",
      });
      setEditingManual(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update manual",
        variant: "destructive",
      });
    },
  });

  const selectedManual = manuals?.find((m: any) => m.domain === selectedDomain);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Book className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agent Creation Manual</h1>
            <p className="text-slate-600">Standardized creation templates for comprehensive agent websites</p>
          </div>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Domain Manual
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Domain Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="domain">Domain Key</Label>
                <Input
                  id="domain"
                  placeholder="motorcycle-travel"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  placeholder="Motorcycle Travel"
                  value={newDomainData.name}
                  onChange={(e) => setNewDomainData({...newDomainData, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Template for creating comprehensive motorcycle travel agents..."
                  value={newDomainData.description}
                  onChange={(e) => setNewDomainData({...newDomainData, description: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="domainQuestions">Domain-Specific Questions Template</Label>
                <Textarea
                  id="domainQuestions"
                  placeholder="What are 500 of the most popular routes between the 500 biggest cities in [Country]..."
                  value={newDomainData.domainQuestions}
                  onChange={(e) => setNewDomainData({...newDomainData, domainQuestions: e.target.value})}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="enthusiastQuestions">Enthusiast Questions Template</Label>
                <Textarea
                  id="enthusiastQuestions"
                  placeholder="What are the 500 most relevant questions an enthusiast would ask about [Topic]..."
                  value={newDomainData.enthusiastQuestions}
                  onChange={(e) => setNewDomainData({...newDomainData, enthusiastQuestions: e.target.value})}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="contentStructure">Content Structure Guidelines</Label>
                <Textarea
                  id="contentStructure"
                  placeholder="How to organize the resulting website content..."
                  value={newDomainData.contentStructure}
                  onChange={(e) => setNewDomainData({...newDomainData, contentStructure: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="qualityBenchmarks">Quality Benchmarks</Label>
                <Textarea
                  id="qualityBenchmarks"
                  placeholder="Minimum content requirements and quality standards..."
                  value={newDomainData.qualityBenchmarks}
                  onChange={(e) => setNewDomainData({...newDomainData, qualityBenchmarks: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="exampleAgent">Example Agent</Label>
                <Input
                  id="exampleAgent"
                  placeholder="India Motorcycle Trip Agent"
                  value={newDomainData.exampleAgent}
                  onChange={(e) => setNewDomainData({...newDomainData, exampleAgent: e.target.value})}
                />
              </div>
              <Button 
                onClick={() => createManualMutation.mutate({
                  domain: newDomain,
                  ...newDomainData
                })}
                disabled={createManualMutation.isPending}
                className="w-full"
              >
                {createManualMutation.isPending ? "Creating..." : "Create Manual"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Domain List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Domain Manuals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {manuals?.map((manual: any) => (
                <Button
                  key={manual.domain}
                  variant={selectedDomain === manual.domain ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedDomain(manual.domain)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {manual.name}
                </Button>
              ))}
              {!manuals?.length && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No manuals created yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manual Details */}
        <div className="lg:col-span-3">
          {selectedManual ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {selectedManual.name}
                    </CardTitle>
                    <p className="text-slate-600 mt-1">{selectedManual.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setEditingManual(selectedManual)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="domain-questions">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="domain-questions">Domain Questions</TabsTrigger>
                    <TabsTrigger value="enthusiast-questions">Enthusiast Questions</TabsTrigger>
                    <TabsTrigger value="structure">Structure</TabsTrigger>
                    <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="domain-questions" className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Map className="h-4 w-4" />
                        Domain-Specific Questions Template
                      </h3>
                      <p className="text-blue-800 whitespace-pre-line">
                        {selectedManual.domainQuestions}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="enthusiast-questions" className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Enthusiast Questions Template
                      </h3>
                      <p className="text-green-800 whitespace-pre-line">
                        {selectedManual.enthusiastQuestions}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="structure" className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-purple-900 mb-2">Content Structure Guidelines</h3>
                      <p className="text-purple-800 whitespace-pre-line">
                        {selectedManual.contentStructure}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="benchmarks" className="space-y-4">
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h3 className="font-semibold text-orange-900 mb-2">Quality Benchmarks</h3>
                      <p className="text-orange-800 whitespace-pre-line">
                        {selectedManual.qualityBenchmarks}
                      </p>
                    </div>
                    
                    {selectedManual.exampleAgent && (
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h3 className="font-semibold text-slate-900 mb-2">Example Agent</h3>
                        <Badge variant="outline">{selectedManual.exampleAgent}</Badge>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Book className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Manual Selected</h3>
                <p className="text-slate-500">
                  Select a domain manual from the left to view its creation template
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Manual Dialog */}
      {editingManual && (
        <Dialog open={!!editingManual} onOpenChange={() => setEditingManual(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {editingManual.name} Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Display Name</Label>
                <Input
                  id="edit-name"
                  value={editingManual.name}
                  onChange={(e) => setEditingManual({...editingManual, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingManual.description}
                  onChange={(e) => setEditingManual({...editingManual, description: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-domainQuestions">Domain-Specific Questions Template</Label>
                <Textarea
                  id="edit-domainQuestions"
                  value={editingManual.domainQuestions}
                  onChange={(e) => setEditingManual({...editingManual, domainQuestions: e.target.value})}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="edit-enthusiastQuestions">Enthusiast Questions Template</Label>
                <Textarea
                  id="edit-enthusiastQuestions"
                  value={editingManual.enthusiastQuestions}
                  onChange={(e) => setEditingManual({...editingManual, enthusiastQuestions: e.target.value})}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="edit-contentStructure">Content Structure Guidelines</Label>
                <Textarea
                  id="edit-contentStructure"
                  value={editingManual.contentStructure}
                  onChange={(e) => setEditingManual({...editingManual, contentStructure: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-qualityBenchmarks">Quality Benchmarks</Label>
                <Textarea
                  id="edit-qualityBenchmarks"
                  value={editingManual.qualityBenchmarks}
                  onChange={(e) => setEditingManual({...editingManual, qualityBenchmarks: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-exampleAgent">Example Agent</Label>
                <Input
                  id="edit-exampleAgent"
                  value={editingManual.exampleAgent}
                  onChange={(e) => setEditingManual({...editingManual, exampleAgent: e.target.value})}
                />
              </div>
              <Button 
                onClick={() => updateManualMutation.mutate(editingManual)}
                disabled={updateManualMutation.isPending}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateManualMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}