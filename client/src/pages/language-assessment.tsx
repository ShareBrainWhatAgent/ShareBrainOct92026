import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, BookOpen, Users, Briefcase } from "lucide-react";

interface AssessmentQuestion {
  id: number;
  question: string;
  options: {
    text: string;
    level: "beginner" | "intermediate" | "advanced";
    points: number;
  }[];
}

const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: 1,
    question: "How would you describe your current language learning experience?",
    options: [
      { text: "I'm completely new to this language", level: "beginner", points: 1 },
      { text: "I know some basic words and phrases", level: "beginner", points: 2 },
      { text: "I can have simple conversations", level: "intermediate", points: 3 },
      { text: "I can discuss various topics comfortably", level: "advanced", points: 4 }
    ]
  },
  {
    id: 2,
    question: "When someone speaks this language at normal speed, you can:",
    options: [
      { text: "Understand very little or nothing", level: "beginner", points: 1 },
      { text: "Understand some familiar words", level: "beginner", points: 2 },
      { text: "Understand the main points", level: "intermediate", points: 3 },
      { text: "Understand most of what they say", level: "advanced", points: 4 }
    ]
  },
  {
    id: 3,
    question: "Your vocabulary size in this language is approximately:",
    options: [
      { text: "Less than 100 words", level: "beginner", points: 1 },
      { text: "100-500 words", level: "beginner", points: 2 },
      { text: "500-2000 words", level: "intermediate", points: 3 },
      { text: "More than 2000 words", level: "advanced", points: 4 }
    ]
  },
  {
    id: 4,
    question: "When speaking this language, you can:",
    options: [
      { text: "Say only basic greetings and simple phrases", level: "beginner", points: 1 },
      { text: "Have short conversations about familiar topics", level: "beginner", points: 2 },
      { text: "Express opinions and discuss various subjects", level: "intermediate", points: 3 },
      { text: "Debate complex topics and express nuanced ideas", level: "advanced", points: 4 }
    ]
  },
  {
    id: 5,
    question: "Your main learning goals are:",
    options: [
      { text: "Learn basic survival phrases for travel", level: "beginner", points: 1 },
      { text: "Build everyday conversation skills", level: "beginner", points: 2 },
      { text: "Improve fluency for work or study", level: "intermediate", points: 3 },
      { text: "Master advanced expression and cultural nuances", level: "advanced", points: 4 }
    ]
  }
];

export default function LanguageAssessment() {
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  const languages = [
    "English", "Mandarin Chinese", "Hindi", "Spanish", "French", 
    "Standard Arabic", "Bengali", "Russian", "Portuguese", "Urdu"
  ];

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
  };

  const handleAnswer = (points: number) => {
    const newAnswers = [...answers, points];
    setAnswers(newAnswers);

    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateLevel = () => {
    const totalPoints = answers.reduce((sum, points) => sum + points, 0);
    const maxPoints = assessmentQuestions.length * 4;
    const percentage = (totalPoints / maxPoints) * 100;

    if (percentage <= 40) return "beginner";
    if (percentage <= 70) return "intermediate";
    return "advanced";
  };

  const getLevelDescription = (level: string) => {
    switch (level) {
      case "beginner":
        return {
          title: "Beginner Level",
          description: "Perfect for building foundational skills with basic greetings, numbers, and everyday vocabulary.",
          icon: <BookOpen className="h-6 w-6" />,
          color: "bg-green-100 text-green-800",
          themes: ["Basic Greetings & Introductions", "Numbers & Time", "Family & Relationships", "Food & Dining"]
        };
      case "intermediate":
        return {
          title: "Intermediate Level",
          description: "Ideal for expanding practical communication skills for work, travel, and daily life.",
          icon: <Users className="h-6 w-6" />,
          color: "bg-blue-100 text-blue-800",
          themes: ["Travel & Transportation", "Work & Professional Life", "Health & Wellness", "Culture & Entertainment"]
        };
      case "advanced":
        return {
          title: "Advanced Level",
          description: "Designed for mastering complex topics, professional communication, and cultural nuances.",
          icon: <Briefcase className="h-6 w-6" />,
          color: "bg-purple-100 text-purple-800",
          themes: ["Current Events & News", "Business & Economics", "Literature & Arts", "Philosophy & Abstract Concepts"]
        };
      default:
        return {
          title: "Assessment Complete",
          description: "Your level has been determined based on your responses.",
          icon: <CheckCircle className="h-6 w-6" />,
          color: "bg-gray-100 text-gray-800",
          themes: []
        };
    }
  };

  const startLessonPlan = () => {
    const level = calculateLevel();
    // Navigate to agent directory filtered by the recommended lesson plan
    setLocation(`/agent-directory?search=${selectedLanguage} ${level} lesson plan`);
  };

  if (!selectedLanguage) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Language Proficiency Assessment</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Take our quick assessment to find the perfect lesson plan for your language learning journey. 
              We'll recommend the right proficiency level based on your current skills and goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {languages.map((language) => (
              <Card key={language} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleLanguageSelect(language)}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {language}
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Take assessment to find your ideal learning level
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const level = calculateLevel();
    const levelInfo = getLevelDescription(level);
    const totalPoints = answers.reduce((sum, points) => sum + points, 0);
    const maxPoints = assessmentQuestions.length * 4;
    const percentage = Math.round((totalPoints / maxPoints) * 100);

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
            <p className="text-gray-600">Based on your responses, we've found your ideal learning level.</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${levelInfo.color}`}>
                    {levelInfo.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{selectedLanguage} - {levelInfo.title}</CardTitle>
                    <p className="text-gray-600 mt-1">{levelInfo.description}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-4">
                  Score: {percentage}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Your 4-Week Learning Plan:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {levelInfo.themes.map((theme, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                        </div>
                        <span className="text-sm text-gray-700">{theme}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">Ready to start learning?</p>
                      <p className="text-sm text-gray-600">Access your personalized lesson plan with TTS pronunciation and visual vocabulary.</p>
                    </div>
                    <Button onClick={startLessonPlan} className="ml-4">
                      Start Lesson Plan
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button variant="outline" onClick={() => setSelectedLanguage("")}>
              Take Assessment for Another Language
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const question = assessmentQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{selectedLanguage} Proficiency Assessment</h1>
            <Badge variant="outline">
              Question {currentQuestion + 1} of {assessmentQuestions.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{question.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start p-4 h-auto text-left hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => handleAnswer(option.points)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">{String.fromCharCode(65 + index)}</span>
                    </div>
                    <span className="text-gray-900">{option.text}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Your responses help us recommend the most appropriate lesson plan for your learning goals.
          </p>
        </div>
      </div>
    </div>
  );
}