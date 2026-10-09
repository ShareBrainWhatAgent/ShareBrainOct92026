import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Download, CheckCircle, XCircle, Search, Database, Brain } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgentDocument {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  isActive: boolean;
  createdAt: string;
  metadata?: any;
}

interface Agent {
  id: number;
  name: string;
  description: string;
  documentSearchMode: string;
}

export default function AgentDocuments() {
  const { id } = useParams<{ id: string }>();
  const agentId = parseInt(id || "0");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agent details
  const { data: agent } = useQuery<Agent>({
    queryKey: [`/api/agents/${agentId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/agents/${agentId}`);
      return response.json();
    },
    enabled: !!agentId
  });

  // Fetch agent documents
  const { data: documents = [], isLoading } = useQuery<AgentDocument[]>({
    queryKey: [`/api/agents/${agentId}/documents`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/agents/${agentId}/documents`);
      return response.json();
    },
    enabled: !!agentId
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agentId', agentId.toString());
      
      const response = await fetch(`/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agentId}/documents`] });
      setUploadFile(null);
      toast({
        title: "Document Uploaded",
        description: "Your document has been processed and added to the agent's knowledge base.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await apiRequest('DELETE', `/api/documents/${documentId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agentId}/documents`] });
      toast({
        title: "Document Deleted",
        description: "The document has been removed from the knowledge base.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  // Toggle document status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ documentId, isActive }: { documentId: number; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/documents/${documentId}/status`, {
        isActive
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agentId}/documents`] });
      toast({
        title: "Document Status Updated",
        description: "The document status has been changed.",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type - be more flexible with JSON files
      const allowedTypes = ['.pdf', '.txt', '.md', '.docx', '.json', '.jsonl', '.geojson'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      // Also check if it's a JSON-like file by content type or name
      const isJsonFile = fileExtension === '.json' || 
                        fileExtension === '.jsonl' || 
                        fileExtension === '.geojson' ||
                        file.type === 'application/json' ||
                        file.type === 'text/json';
      
      if (!allowedTypes.includes(fileExtension) && !isJsonFile) {
        toast({
          title: "Invalid File Type",
          description: "Please upload PDF, TXT, MD, DOCX, or JSON files only.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload files smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setUploadFile(file);
    }
  };

  const handleUpload = () => {
    if (uploadFile) {
      uploadMutation.mutate(uploadFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSearchModeInfo = (mode: string) => {
    switch (mode) {
      case 'documents_memory_and_general':
        return {
          icon: <Database className="h-4 w-4" />,
          title: "Documents, Memory & General Knowledge",
          description: "Uses all available sources"
        };
      case 'documents_and_memory_only':
        return {
          icon: <FileText className="h-4 w-4" />,
          title: "Documents & Memory Only",
          description: "Focuses on uploaded documents and personal memories"
        };
      case 'memory_only':
        return {
          icon: <Brain className="h-4 w-4" />,
          title: "Memory Only",
          description: "Uses only personal memories"
        };
      default:
        return {
          icon: <Database className="h-4 w-4" />,
          title: "Default Mode",
          description: "Standard search configuration"
        };
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading agent documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {agent.name} - Knowledge Base
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage documents and configure search settings for your AI agent
            </p>
          </div>
        </div>

        {/* Search Mode Info */}
        {agent.documentSearchMode && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              {getSearchModeInfo(agent.documentSearchMode).icon}
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Current Search Mode: {getSearchModeInfo(agent.documentSearchMode).title}
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {getSearchModeInfo(agent.documentSearchMode).description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Documents</span>
              </CardTitle>
              <CardDescription>
                Add documents to enhance your agent's knowledge base. Supported formats: PDF, TXT, MD, DOCX, JSON (max 10MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept=".pdf,.txt,.md,.docx,.json,.jsonl,.geojson,application/json,text/json,*/*"
                      onChange={handleFileChange}
                      className="max-w-sm mx-auto"
                    />
                    <p className="text-sm text-gray-500">
                      Select a file to upload to the knowledge base
                    </p>
                    <p className="text-xs text-gray-400">
                      If your JSON file doesn't appear, try selecting "All Files" in the file browser
                    </p>
                  </div>
                </div>
              </div>

              {uploadFile && (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{uploadFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(uploadFile.size)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadFile(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Document Library</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                  <p className="text-gray-600">Loading documents...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchQuery ? "No documents found matching your search." : "No documents uploaded yet."}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Upload documents to enhance your agent's knowledge base.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span className="uppercase">{doc.fileType}</span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={doc.isActive ? "default" : "secondary"}>
                          {doc.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatusMutation.mutate({
                            documentId: doc.id,
                            isActive: !doc.isActive
                          })}
                          disabled={toggleStatusMutation.isPending}
                        >
                          {doc.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(doc.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}