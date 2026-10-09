import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Volume2, Eye, X } from 'lucide-react';

interface InlineLessonViewerProps {
  lessonContent: string;
  onClose: () => void;
}

interface LessonWord {
  word: string;
  translation: string;
  pronunciation?: string;
}

export function InlineLessonViewer({ lessonContent, onClose }: InlineLessonViewerProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [words, setWords] = useState<LessonWord[]>([]);
  const [showTranslations, setShowTranslations] = useState(false);

  useEffect(() => {
    // Parse lesson content to extract vocabulary words
    const parseLesson = (content: string): LessonWord[] => {
      console.log('🔍 Full lesson content:', content);
      console.log('🔍 Content length:', content.length);
      
      const words: LessonWord[] = [];
      
      // Method 1: Look for numbered word lists with more flexible patterns
      // Pattern: "1. hello", "1. hello - hola", "1) hello", etc.
      const numberedPattern = /(?:^|\n)\s*(\d+)[\.\)]\s*([a-zA-ZÀ-ÿ\u0100-\u017F\u0400-\u04FF\u4E00-\u9FFF]+)(?:\s*[-–]\s*([a-zA-ZÀ-ÿ\u0100-\u017F\u0400-\u04FF\u4E00-\u9FFF\s]+))?/gm;
      let match;
      while ((match = numberedPattern.exec(content)) !== null) {
        console.log('Found numbered match:', match);
        words.push({
          word: match[2].toLowerCase().trim(),
          translation: match[3] ? match[3].trim() : match[2].trim()
        });
      }
      console.log('After numbered pattern:', words.length, 'words');
      
      // Method 2: Look for word - translation pairs (more flexible)
      if (words.length < 5) {
        const dashPattern = /([a-zA-ZÀ-ÿ\u0100-\u017F\u0400-\u04FF\u4E00-\u9FFF]{2,})\s*[-–]\s*([a-zA-ZÀ-ÿ\u0100-\u017F\u0400-\u04FF\u4E00-\u9FFF\s]{2,})/g;
        while ((match = dashPattern.exec(content)) !== null) {
          console.log('Found dash match:', match);
          words.push({
            word: match[1].toLowerCase().trim(),
            translation: match[2].trim()
          });
        }
      }
      console.log('After dash pattern:', words.length, 'words');
      
      // Method 3: Look for universal first 10 words more aggressively
      if (words.length < 5) {
        const universalWords = [
          { en: 'hello', variations: ['hola', 'bonjour', 'hallo', 'ciao', 'olá', 'привет', 'こんにちは'] },
          { en: 'water', variations: ['agua', 'eau', 'wasser', 'acqua', 'água', 'вода', '水'] },
          { en: 'food', variations: ['comida', 'nourriture', 'essen', 'cibo', 'comida', 'еда', '食べ物'] },
          { en: 'house', variations: ['casa', 'maison', 'haus', 'casa', 'casa', 'дом', '家'] },
          { en: 'friend', variations: ['amigo', 'ami', 'freund', 'amico', 'amigo', 'друг', '友達'] },
          { en: 'book', variations: ['libro', 'livre', 'buch', 'libro', 'livro', 'книга', '本'] },
          { en: 'good', variations: ['bueno', 'bon', 'gut', 'buono', 'bom', 'хорошо', '良い'] },
          { en: 'yes', variations: ['sí', 'oui', 'ja', 'sì', 'sim', 'да', 'はい'] },
          { en: 'no', variations: ['no', 'non', 'nein', 'no', 'não', 'нет', 'いいえ'] },
          { en: 'thank', variations: ['gracias', 'merci', 'danke', 'grazie', 'obrigado', 'спасибо', 'ありがとう'] }
        ];
        
        universalWords.forEach(wordSet => {
          const contentLower = content.toLowerCase();
          // Look for both English and foreign variations
          const allWords = [wordSet.en, ...wordSet.variations];
          
          allWords.forEach(word => {
            if (contentLower.includes(word.toLowerCase()) && !words.some(w => w.word === word.toLowerCase())) {
              const translation = wordSet.variations.find(variant => 
                contentLower.includes(variant.toLowerCase()) && variant.toLowerCase() !== word.toLowerCase()
              ) || wordSet.en;
              
              words.push({ 
                word: word.toLowerCase(), 
                translation: translation 
              });
            }
          });
        });
      }
      console.log('After universal words:', words.length, 'words');
      
      // Method 4: Extract from any structured list
      if (words.length < 5) {
        const lines = content.split(/[\n\r]/);
        console.log('Lines to process:', lines.length);
        
        lines.forEach((line, index) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return;
          
          // Look for any word that appears to be vocabulary
          const wordMatches = trimmedLine.match(/\b([a-zA-ZÀ-ÿ\u0100-\u017F\u0400-\u04FF\u4E00-\u9FFF]{3,})\b/g);
          
          if (wordMatches && wordMatches.length >= 1) {
            wordMatches.slice(0, 2).forEach(word => {
              if (words.length < 10 && !words.some(w => w.word === word.toLowerCase())) {
                words.push({
                  word: word.toLowerCase(),
                  translation: word
                });
              }
            });
          }
        });
      }
      console.log('After line extraction:', words.length, 'words');
      
      // Method 5: Emergency fallback - use common words
      if (words.length === 0) {
        console.log('No words found, using fallback');
        const fallbackWords = ['hello', 'water', 'food', 'house', 'friend', 'book', 'good', 'yes', 'no', 'thank'];
        fallbackWords.forEach(word => {
          words.push({ word, translation: word });
        });
      }
      
      console.log('📝 Final extracted words:', words);
      return words.slice(0, 10); // Limit to 10 words
    };

    setWords(parseLesson(lessonContent));
  }, [lessonContent]);

  const playWordAudio = async (word: string, index: number) => {
    setIsPlaying(true);
    setCurrentWordIndex(index);
    
    try {
      console.log('🔊 Playing word:', word);
      
      // First try to get cached audio from lesson audio API
      try {
        const response = await fetch(`/api/lesson-audio/word/${encodeURIComponent(word)}`);
        
        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          
          const audio = new Audio(audioUrl);
          
          audio.onended = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
          };
          
          audio.onerror = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
          };
          
          await audio.play();
          console.log('🔊 Played cached audio for:', word);
          return;
        }
      } catch (cacheError) {
        console.log('🔊 Cache miss for word:', word, 'falling back to live generation');
      }
      
      // Fallback to live TTS generation if cached audio not available
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: word })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
        console.log('🔊 Played live-generated audio for:', word);
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlaying(false);
    }
  };

  const getVocabularyImage = async (word: string): Promise<string | null> => {
    try {
      console.log('🖼️ Fetching image for word:', word);
      const response = await fetch(`/api/vocabulary-cache/word/${encodeURIComponent(word)}`);
      console.log('🖼️ Image API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🖼️ Image data received:', data);
        return data.imageUrl;
      } else {
        console.log('🖼️ Image not found for word:', word);
      }
    } catch (error) {
      console.error('🖼️ Image fetch error for', word, ':', error);
    }
    return null;
  };

  const [wordImages, setWordImages] = useState<Record<string, string>>({});

  useEffect(() => {
    // Preload images for vocabulary words
    const loadImages = async () => {
      const imagePromises = words.map(async (wordObj) => {
        const imageUrl = await getVocabularyImage(wordObj.word);
        return { word: wordObj.word, imageUrl };
      });
      
      const results = await Promise.all(imagePromises);
      const imageMap: Record<string, string> = {};
      
      results.forEach(({ word, imageUrl }) => {
        if (imageUrl) {
          console.log('🖼️ Image loaded for word:', word, imageUrl);
          imageMap[word] = imageUrl;
        } else {
          console.log('🖼️ No image available for word:', word);
        }
      });
      
      console.log('🖼️ Final image map:', imageMap);
      setWordImages(imageMap);
    };
    
    if (words.length > 0) {
      loadImages();
    }
  }, [words]);

  if (words.length === 0) {
    return (
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-blue-800">Interactive Lesson</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No vocabulary found in this lesson.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-blue-800">Interactive Vocabulary Lesson</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTranslations(!showTranslations)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {showTranslations ? 'Hide' : 'Show'} Translations
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {words.map((wordObj, index) => (
            <div
              key={index}
              className={`flex flex-col items-center p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                currentWordIndex === index && isPlaying
                  ? 'border-blue-500 bg-blue-100 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
              onClick={() => playWordAudio(wordObj.word, index)}
            >
              {/* Word Image */}
              {wordImages[wordObj.word] ? (
                <div className="w-16 h-16 mb-2 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={wordImages[wordObj.word]}
                    alt={wordObj.word}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('🖼️ Image failed to load:', wordObj.word, wordImages[wordObj.word]);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => console.log('🖼️ Image successfully displayed:', wordObj.word)}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 mb-2 rounded-lg border border-gray-300 bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-500">No image</span>
                </div>
              )}
              
              {/* Word Text */}
              <div className="text-center">
                <div className="font-semibold text-gray-800 mb-1">
                  {wordObj.word}
                </div>
                
                {showTranslations && (
                  <div className="text-sm text-gray-600">
                    {wordObj.translation}
                  </div>
                )}
                
                {/* Audio Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 p-1 h-8 w-8"
                  disabled={isPlaying && currentWordIndex === index}
                >
                  <Volume2 className={`h-4 w-4 ${
                    isPlaying && currentWordIndex === index ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-sm text-gray-600 text-center">
          Click on any word to hear its pronunciation
        </div>
      </CardContent>
    </Card>
  );
}