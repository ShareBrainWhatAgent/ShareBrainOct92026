import { useState } from "react";
import { Volume2, VolumeX, Play, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function TTSTest() {
  const { toast } = useToast();
  const [text, setText] = useState("Hello! This is a test of the OpenAI Text-to-Speech functionality. I can speak in different voices with various qualities.");
  const [voiceType, setVoiceType] = useState("alloy");
  const [voiceModel, setVoiceModel] = useState("tts-1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const voiceOptions = [
    { value: "alloy", label: "Alloy (Neutral)" },
    { value: "echo", label: "Echo (Masculine)" },
    { value: "fable", label: "Fable (British)" },
    { value: "onyx", label: "Onyx (Deep)" },
    { value: "nova", label: "Nova (Feminine)" },
    { value: "shimmer", label: "Shimmer (Soft)" },
  ];

  const qualityOptions = [
    { value: "tts-1", label: "Standard (Faster)" },
    { value: "tts-1-hd", label: "HD (Higher Quality)" },
  ];

  const sampleTexts = [
    "Hello! This is a test of the OpenAI Text-to-Speech functionality.",
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet.",
    "Welcome to AgentForge, where you can create and test AI agents with voice capabilities.",
    "In a world where technology meets creativity, artificial intelligence opens new possibilities for human expression.",
    "Good morning! I hope you're having a wonderful day. How can I assist you today?",
  ];

  const playAudio = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to convert to speech",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
        setIsPlaying(false);
      }

      const response = await fetch("/api/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text, 
          voiceType,
          voiceModel 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onloadstart = () => {
        setIsLoading(false);
        setIsPlaying(true);
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsLoading(false);
        setIsPlaying(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Playback Error",
          description: "Failed to play the generated audio",
          variant: "destructive",
        });
      };

      setCurrentAudio(audio);
      await audio.play();
      
      toast({
        title: "Success",
        description: `Playing audio with ${voiceType} voice in ${voiceModel} quality`,
      });

    } catch (error: any) {
      setIsLoading(false);
      setIsPlaying(false);
      console.error("TTS Error:", error);
      
      let errorMessage = "Failed to generate speech";
      if (error.message.includes("503")) {
        errorMessage = "Text-to-Speech service is currently unavailable";
      } else if (error.message.includes("400")) {
        errorMessage = "Invalid request - check your text and settings";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsPlaying(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Text-to-Speech Test</h2>
          <p className="text-slate-600 mt-1">Test OpenAI's voice synthesis functionality</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Voice Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Voice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="voice-type">Voice Type</Label>
                  <Select value={voiceType} onValueChange={setVoiceType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="voice-quality">Voice Quality</Label>
                  <Select value={voiceModel} onValueChange={setVoiceModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {qualityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Input */}
          <Card>
            <CardHeader>
              <CardTitle>Text to Convert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                className="min-h-32"
                maxLength={4000}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {text.length}/4000 characters
                </span>
                
                <div className="flex gap-2">
                  {isPlaying ? (
                    <Button 
                      onClick={stopAudio}
                      variant="destructive"
                      disabled={isLoading}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  ) : (
                    <Button 
                      onClick={playAudio}
                      disabled={isLoading || !text.trim()}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Play Audio
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Texts */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Texts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {sampleTexts.map((sampleText, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => setText(sampleText)}
                  >
                    <p className="text-sm text-slate-700">{sampleText}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">OpenAI API:</span>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Selected Voice:</span>
                  <span className="font-medium">{voiceOptions.find(v => v.value === voiceType)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Quality:</span>
                  <span className="font-medium">{qualityOptions.find(q => q.value === voiceModel)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <span className={`font-medium ${isPlaying ? 'text-blue-600' : isLoading ? 'text-yellow-600' : 'text-slate-600'}`}>
                    {isPlaying ? 'Playing' : isLoading ? 'Loading' : 'Ready'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}