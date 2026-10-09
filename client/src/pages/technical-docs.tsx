import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft, Database, Brain, Users, CreditCard, CheckCircle } from "lucide-react";

export default function TechnicalDocs() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }
    
    if (user?.email !== "tom@colorfulranch.com") {
      setLocation("/");
      return;
    }
  }, [isAuthenticated, user, setLocation]);

  if (!isAuthenticated || user?.email !== "tom@colorfulranch.com") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-300">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin">
            <Button variant="ghost" className="text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Panel
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Technical Documentation</h1>
          <p className="text-gray-300">System specifications, architecture documentation, and implementation status.</p>
        </div>

        {/* Latest Implementation Status */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Latest Implementation: Invite Brain System Phase 1
              <Badge className="bg-green-600 text-white">COMPLETE</Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              July 19, 2025 - Comprehensive database and memory architecture implementation
            </CardDescription>
          </CardHeader>
          <CardContent className="text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-green-400">✅ Database Architecture</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• 5 New Tables: invite_brains, brain_memberships, brain_invitations, invite_brain_memories, brain_payments</li>
                  <li>• Schema Extensions: Added is_invite_brain and invite_brain_type fields to agents table</li>
                  <li>• Complete Isolation: Separate memory storage with zero crossover to existing systems</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-green-400">✅ Storage Layer</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• 25+ Storage Methods: Full CRUD operations for all invite brain components</li>
                  <li>• Role-Based Access: Creator/contributor/viewer permission validation</li>
                  <li>• Memory Operations: AI-powered memory classification and storage</li>
                  <li>• Payment Infrastructure: Stripe-ready payment tracking system</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-green-400">✅ Memory System</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Isolated Memory Service: inviteBrainMemoryService extending intelligentMemoryService</li>
                  <li>• AI-Powered Classification: Consistent memory detection using Llama 3.1 70B</li>
                  <li>• Context Injection: Formatted memory context for AI responses</li>
                  <li>• Statistics & Analytics: Memory tracking, contributor analytics, activity monitoring</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-green-400">✅ Zero-Breakage Guarantee</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• All Existing Systems Protected: Personal, Template, Global Brains, Master Agents, AI Friend Chat unaffected</li>
                  <li>• Additive-Only Implementation: No modifications to existing functionality</li>
                  <li>• Production Ready: Complete Phase 1 infrastructure ready for Phase 2</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Architecture Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Database Schema */}
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-400" />
                Database Schema
              </CardTitle>
              <CardDescription className="text-gray-400">
                Complete database architecture and relationships
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-blue-400 mb-2">Invite Brain Tables</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• invite_brains - Core brain instances</li>
                    <li>• brain_memberships - User memberships</li>
                    <li>• brain_invitations - Invitation system</li>
                    <li>• invite_brain_memories - Memory storage</li>
                    <li>• brain_payments - Payment tracking</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-400 mb-2">Existing Tables</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• agents - Enhanced with invite brain fields</li>
                    <li>• All other tables - Completely unaffected</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memory System Architecture */}
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                Memory System
              </CardTitle>
              <CardDescription className="text-gray-400">
                Isolated memory architecture with AI classification
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">Memory Isolation</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Personal Memories: personalMemories table</li>
                    <li>• Friends Memories: friendsMemories table</li>
                    <li>• Global Memories: sharedMemories table</li>
                    <li>• Invite Brain Memories: invite_brain_memories table</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">AI Classification</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Llama 3.1 70B powered analysis</li>
                    <li>• Consistent memory detection</li>
                    <li>• Category-based organization</li>
                    <li>• Context injection for responses</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role-Based Access Control */}
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-green-400" />
                Access Control
              </CardTitle>
              <CardDescription className="text-gray-400">
                Role-based permissions and membership management
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">User Roles</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Creator: Full control & management</li>
                    <li>• Contributor: Memory addition & participation</li>
                    <li>• Viewer: Read-only access</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">Brain Types</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Private Invite: Creator-only visibility</li>
                    <li>• Public Invite: Directory discoverable</li>
                    <li>• Access Models: Invite/Request/Paid</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Implementation Files */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Key Implementation Files</CardTitle>
            <CardDescription className="text-gray-400">
              Core files modified or created for Phase 1 implementation
            </CardDescription>
          </CardHeader>
          <CardContent className="text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-blue-400">Database & Schema</h4>
                <ul className="space-y-2 text-sm text-gray-300 font-mono">
                  <li>• shared/schema.ts - TypeScript types & schemas</li>
                  <li>• server/storage.ts - 25+ new storage methods</li>
                  <li>• server/db.ts - Database connection & tables</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-purple-400">Memory Services</h4>
                <ul className="space-y-2 text-sm text-gray-300 font-mono">
                  <li>• server/inviteBrainMemoryService.ts - New service</li>
                  <li>• server/intelligentMemoryService.ts - Extended</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-green-400">Documentation</h4>
                <ul className="space-y-2 text-sm text-gray-300 font-mono">
                  <li>• AGENT_MANUAL.md - Updated with Phase 1 status</li>
                  <li>• docs/DEVELOPMENT_WORKFLOW.md - Implementation notes</li>
                  <li>• replit.md - Architectural changes documented</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-yellow-400">SQL Migrations</h4>
                <ul className="space-y-2 text-sm text-gray-300 font-mono">
                  <li>• SQL tables created via execute_sql_tool</li>
                  <li>• Database indexes added for performance</li>
                  <li>• Agent fields extended (is_invite_brain, type)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Phase Planning */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-400" />
              Phase 2: API Routes & Business Logic
              <Badge className="bg-orange-600 text-white">READY TO START</Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Next implementation phase - API endpoints and user interface integration
            </CardDescription>
          </CardHeader>
          <CardContent className="text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-orange-400">API Endpoints Required</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• POST /api/invite-brains - Create invite brain</li>
                  <li>• GET /api/invite-brains - List user's invite brains</li>
                  <li>• POST /api/invite-brains/:id/invite - Send invitations</li>
                  <li>• POST /api/invite-brains/:id/join - Join/request access</li>
                  <li>• GET /api/invite-brains/:id/members - Member management</li>
                  <li>• POST /api/invite-brains/:id/memories - Memory operations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-orange-400">UI Integration</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Easy Brains: Add Private/Public Invite options</li>
                  <li>• Brain Directory: Public invite brain discovery</li>
                  <li>• My Brains: Creator dashboard & management</li>
                  <li>• Invitations: Accept/decline invitation flow</li>
                  <li>• Member Management: Role assignment interface</li>
                  <li>• Payment Integration: Stripe checkout flow</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}