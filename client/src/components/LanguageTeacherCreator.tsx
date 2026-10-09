import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Code, Edit, BookOpen, Play, Settings } from "lucide-react";

interface LanguageTeacherCreatorProps {
  onApplyTemplate: (templateData: any) => void;
}

const STRUCTURED_LESSON_SCRIPT = `// Universal 500-word curriculum - identical for all languages
const universalCurriculum = [
  // Words 1-10: Basic Survival
  ["Hello/Hi", "Water", "Food", "House", "Friend", "Book", "Good", "Yes", "No", "Thank you"],
  
  // Words 11-20: Essential Daily Life
  ["Please", "Sorry", "Help", "Time", "Money", "Work", "Home", "Family", "Love", "Happy"],
  
  // Words 21-30: Basic Communication
  ["What", "Where", "When", "How", "Why", "Who", "Big", "Small", "Hot", "Cold"],
  
  // Words 31-40: Numbers and Quantities
  ["One", "Two", "Three", "Four", "Five", "Many", "Few", "All", "Some", "None"],
  
  // Words 41-50: Movement and Actions
  ["Go", "Come", "Stop", "Walk", "Run", "Sit", "Stand", "Sleep", "Wake", "Eat"],
  
  // Continue through all 50 lessons (500 words total)
  // Each lesson builds on previous vocabulary through spaced repetition
];

// Generate system prompt for language teacher
function generateLanguageTeacherPrompt(language, customCurriculum = null) {
  const curriculum = customCurriculum || universalCurriculum;
  
  return \`You are an enthusiastic \${language} teacher who uses a structured 500-word curriculum with systematic lesson plans.

CORE TEACHING SYSTEM:
- 50 lessons with exactly 10 words each (500 words total)
- Universal curriculum ensuring consistent learning progression
- ALL languages follow the EXACT same 500-word progression

LESSON NAVIGATION SYSTEM:
- When a user first opens this agent, assume they are a beginner and start with Lesson 1
- IMPORTANT: Always recognize and respond to lesson navigation commands:
  * "start with lesson 10" → Jump directly to lesson 10
  * "jump to lesson 5" → Begin at lesson 5
  * "what lesson are we on?" → Tell them the current lesson number

LESSON STRUCTURE SYSTEM:
- Default behavior: Start with Lesson 1 unless user specifies otherwise
- Present exactly 10 words and 10 sentences for the requested lesson
- Universal Lesson 1 Words (translate to \${language}):
  \${curriculum[0].map((word, index) => \`\${index + 1}. \${word}\`).join(', ')}

TEXT-TO-SPEECH FORMATTING RULES:
- When presenting words, NEVER use numbers (1., 2., 3.)
- Use natural speech patterns for pronunciation practice
- Always consider text-to-speech compatibility

CULTURAL CONTEXT:
- Provide cultural insights and context for words and phrases
- Use only the target language when presenting lessons
- Correct mistakes gently and encouragingly\`;
}`;

export function LanguageTeacherCreator({ onApplyTemplate }: LanguageTeacherCreatorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [customScript, setCustomScript] = useState(STRUCTURED_LESSON_SCRIPT);
  const [showScriptEditor, setShowScriptEditor] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState("");

  const popularLanguages = [
    "Spanish", "French", "German", "Italian", "Portuguese", "Chinese", "Japanese", 
    "Korean", "Russian", "Arabic", "Hindi", "Dutch", "Swedish", "Polish"
  ];

  const generatePreview = () => {
    if (!selectedLanguage) return;
    
    try {
      // Execute the script to generate the prompt
      const func = new Function('return ' + customScript)();
      const prompt = func.split('function generateLanguageTeacherPrompt')[1]
        .split('return `')[1]
        .split('`;')[0]
        .replace(/\${language}/g, selectedLanguage);
      setPreviewPrompt(prompt);
    } catch (error) {
      setPreviewPrompt("Error in script: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const applyLanguageTeacher = () => {
    if (!selectedLanguage) return;

    const templateData = {
      name: `${selectedLanguage} Teacher`,
      description: `Structured ${selectedLanguage} teacher with 500-word curriculum and lesson plans`,
      category: "Research Helper",
      systemPrompt: previewPrompt || generateFallbackPrompt(),
      sampleUser: `Teach me my first ${selectedLanguage} lesson`,
      sampleAgent: `Welcome! Let's start with Lesson 1 (Words 1-10): Basic Survival words. Here are your first 10 ${selectedLanguage} words...`,
      voiceEnabled: true,
      voiceModel: "tts-1",
      voiceType: "alloy",
      imageEnabled: true,
      imageModel: "dall-e-3",
      imageQuality: "standard"
    };

    onApplyTemplate(templateData);
  };

  const generateFallbackPrompt = () => {
    return `You are an enthusiastic ${selectedLanguage} teacher who uses a structured 500-word curriculum with systematic lesson plans.

CORE TEACHING SYSTEM:
- 50 lessons with exactly 10 words each (500 words total)
- Universal curriculum ensuring consistent learning progression

LESSON NAVIGATION SYSTEM:
- Always recognize lesson navigation commands like "start with lesson 10"
- Default to Lesson 1 for beginners

TEXT-TO-SPEECH FORMATTING:
- Use natural speech patterns for pronunciation practice
- Avoid numbered lists in responses

CULTURAL CONTEXT:
- Provide cultural insights for words and phrases
- Use only the target language when presenting lessons
- Correct mistakes gently and encouragingly`;
  };

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-orange-600" />
          Language Teacher Creator
          <Badge variant="secondary">Structured Curriculum</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Target Language</Label>
          <Input
            placeholder="Enter language (e.g., Spanish, French, Japanese)"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="mb-2"
          />
          <div className="flex flex-wrap gap-2">
            {popularLanguages.map((lang) => (
              <Button
                key={lang}
                variant={selectedLanguage === lang ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLanguage(lang)}
              >
                {lang}
              </Button>
            ))}
          </div>
        </div>

        {/* Lesson Plan Script Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            <Label className="text-sm font-medium">Structured Lesson Plan Script</Label>
          </div>
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="script">View Script</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Universal 500-Word Curriculum System</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• 50 structured lessons with 10 words each</li>
                  <li>• Identical progression across ALL languages</li>
                  <li>• Lesson navigation commands (jump to any lesson 1-50)</li>
                  <li>• TTS-optimized formatting for pronunciation</li>
                  <li>• Spaced repetition and cultural context</li>
                  <li>• Visual learning with image descriptions</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="script" className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScriptEditor(!showScriptEditor)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {showScriptEditor ? 'Hide' : 'Edit'} Script
                </Button>
              </div>
              
              {showScriptEditor ? (
                <Textarea
                  value={customScript}
                  onChange={(e) => setCustomScript(e.target.value)}
                  className="font-mono text-xs h-64"
                  placeholder="Edit the lesson plan generation script..."
                />
              ) : (
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto h-64">
                  {STRUCTURED_LESSON_SCRIPT}
                </pre>
              )}
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePreview}
                  disabled={!selectedLanguage}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Generate Preview
                </Button>
              </div>
              
              {previewPrompt && (
                <div className="bg-blue-50 p-4 rounded-lg max-h-64 overflow-auto">
                  <h4 className="font-medium mb-2 text-blue-800">
                    Generated System Prompt for {selectedLanguage}
                  </h4>
                  <pre className="text-xs text-blue-700 whitespace-pre-wrap">
                    {previewPrompt}
                  </pre>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Apply Button */}
        <Button
          onClick={applyLanguageTeacher}
          disabled={!selectedLanguage}
          className="w-full"
          size="lg"
        >
          <Settings className="h-4 w-4 mr-2" />
          Create {selectedLanguage} Teacher Agent
        </Button>
      </CardContent>
    </Card>
  );
}