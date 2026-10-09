import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, Lightbulb, Users, Brain, Zap, Trophy, Building, TrendingUp, Code, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const ACCESS_CODE = "SHAREBRAIN_FUTURE_2025";

export default function AdminFeatures() {
  const [accessCode, setAccessCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === ACCESS_CODE) {
      setIsAuthenticated(true);
    } else {
      alert("Invalid access code");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-2xl font-bold">ShareBrain Admin</CardTitle>
            <CardDescription>
              Private feature roadmap and innovation ideas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="access-code" className="block text-sm font-medium mb-2">
                  Access Code
                </label>
                <Input
                  id="access-code"
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter access code"
                  className="w-full"
                />
              </div>
              <Button type="submit" className="w-full">
                Access Features
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const featureCategories = [
    {
      title: "Advanced Agent Features",
      icon: <Brain className="w-5 h-5" />,
      color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
      features: [
        {
          name: "Agent Collaboration",
          description: "Multiple agents working together on complex tasks (e.g., Marketing + Design + Code agents collaborating on a website)",
          priority: "High",
          complexity: "Medium"
        },
        {
          name: "Agent Workflows",
          description: "Chain agents together for multi-step processes (Research → Analysis → Writing → Review)",
          priority: "High",
          complexity: "High"
        },
        {
          name: "Agent Specialization Levels",
          description: "Beginner, Intermediate, Advanced versions of each agent type",
          priority: "Medium",
          complexity: "Low"
        },
        {
          name: "Agent Memory Sharing",
          description: "Cross-agent memory where Code Mentors can learn from Business agents' insights",
          priority: "Medium",
          complexity: "High"
        }
      ]
    },
    {
      title: "Enhanced Memory & Learning",
      icon: <Zap className="w-5 h-5" />,
      color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
      features: [
        {
          name: "Visual Memory",
          description: "Agents remember images, diagrams, and visual content users share",
          priority: "High",
          complexity: "Medium"
        },
        {
          name: "Long-term Context",
          description: "Agents track user progress over weeks/months in their specialization",
          priority: "Medium",
          complexity: "Medium"
        },
        {
          name: "Memory Analytics",
          description: "Show users what agents have learned collectively and individually",
          priority: "Medium",
          complexity: "Low"
        },
        {
          name: "Memory Export",
          description: "Users can export their personalized agent knowledge",
          priority: "Low",
          complexity: "Low"
        }
      ]
    },
    {
      title: "Social & Community Features",
      icon: <Users className="w-5 h-5" />,
      color: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
      features: [
        {
          name: "Agent Competitions",
          description: "Monthly coding challenges, fitness goals, creative contests between agents",
          priority: "Medium",
          complexity: "Medium"
        },
        {
          name: "Agent Leaderboards",
          description: "Most helpful agents, fastest learning, best user satisfaction",
          priority: "Low",
          complexity: "Low"
        },
        {
          name: "Agent Marketplace",
          description: "Users can sell/share their customized agents",
          priority: "High",
          complexity: "High"
        },
        {
          name: "Community Templates",
          description: "User-generated agent templates with ratings and reviews",
          priority: "Medium",
          complexity: "Medium"
        }
      ]
    },
    {
      title: "Advanced Integrations",
      icon: <Lightbulb className="w-5 h-5" />,
      color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
      features: [
        {
          name: "Calendar Integration",
          description: "Agents can schedule and remind about practice sessions, goals",
          priority: "Medium",
          complexity: "Medium"
        },
        {
          name: "File System Integration",
          description: "Agents can create, edit, and organize files for users",
          priority: "High",
          complexity: "High"
        },
        {
          name: "Third-party Integrations",
          description: "Connect with GitHub, Spotify, fitness apps, etc.",
          priority: "Medium",
          complexity: "Medium"
        },
        {
          name: "Voice Commands",
          description: "\"Hey ShareBrain, ask my Python coach about async functions\"",
          priority: "Low",
          complexity: "Medium"
        }
      ]
    },
    {
      title: "Gamification & Progress",
      icon: <Trophy className="w-5 h-5" />,
      color: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
      features: [
        {
          name: "Skill Trees",
          description: "Visual progress tracking for each domain (music, coding, fitness)",
          priority: "High",
          complexity: "Medium"
        },
        {
          name: "Achievement Badges",
          description: "Unlock badges for consistent practice, milestones",
          priority: "Medium",
          complexity: "Low"
        },
        {
          name: "Daily Challenges",
          description: "Personalized challenges from agents based on user goals",
          priority: "Medium",
          complexity: "Medium"
        },
        {
          name: "Progress Visualization",
          description: "Charts showing improvement over time",
          priority: "Medium",
          complexity: "Low"
        }
      ]
    },
    {
      title: "Enterprise & Advanced Features",
      icon: <Building className="w-5 h-5" />,
      color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
      features: [
        {
          name: "Team Agents",
          description: "Company-wide agents that learn from entire teams",
          priority: "High",
          complexity: "High"
        },
        {
          name: "Agent Analytics Dashboard",
          description: "Usage statistics, popular categories, user engagement",
          priority: "Medium",
          complexity: "Medium"
        },
        {
          name: "Custom Agent Builder",
          description: "Visual drag-and-drop interface for creating agents",
          priority: "High",
          complexity: "High"
        },
        {
          name: "Multi-language Agents",
          description: "Agents that can switch languages mid-conversation",
          priority: "Medium",
          complexity: "Medium"
        }
      ]
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "High": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Medium": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Low": return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              ShareBrain Future Features
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Innovative ideas and roadmap for the next generation of AI-powered learning and collaboration
          </p>
        </div>

        {/* Agent Builder Access */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Code className="w-6 h-6" />
                Agent Builder - Private Beta
              </CardTitle>
              <CardDescription className="text-white/90">
                Create custom AI agents with JavaScript code, memory systems, and deployment capabilities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button asChild variant="secondary" size="lg">
                  <Link href="/agent-builder">
                    <Code className="w-4 h-4 mr-2" />
                    Access Agent Builder
                  </Link>
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    Beta
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    Private Access
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">24</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Features</p>
                </div>
                <Lightbulb className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">9</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">6</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
                </div>
                <Brain className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">138</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Agents</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Categories */}
        <div className="space-y-8">
          {featureCategories.map((category, categoryIndex) => (
            <Card key={categoryIndex} className="overflow-hidden">
              <CardHeader className={`${category.color} border-b`}>
                <CardTitle className="flex items-center gap-3 text-xl">
                  {category.icon}
                  {category.title}
                </CardTitle>
                <CardDescription className="text-current opacity-80">
                  {category.features.length} innovative features in this category
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {category.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg">{feature.name}</h3>
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor(feature.priority)}>
                            {feature.priority}
                          </Badge>
                          <Badge className={getComplexityColor(feature.complexity)}>
                            {feature.complexity}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold mb-2">Ready to Build the Future?</h3>
              <p className="text-purple-100 mb-4">
                These features represent the next evolution of AI-powered learning and collaboration.
              </p>
              <Button variant="secondary" size="lg">
                Start Development Planning
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}