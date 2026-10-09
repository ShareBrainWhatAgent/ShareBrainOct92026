#!/usr/bin/env tsx

/**
 * Populate lesson_cache table with the universal 500-word curriculum
 * translated for each supported language. This ensures every language tutor
 * serves identical lessons in its target language.
 */

import OpenAI from "openai";
import { lessonAudioService } from "../services/lessonAudioService";
import { universalCurriculum } from "../data/universalCurriculum";
import topLanguages from "../data/topLanguages";

const openai = new OpenAI();

async function translateWords(words: string[], language: string): Promise<string[]> {
  const prompt = `Translate the following words into ${language}. ` +
    `Return the results as a JSON array preserving order: ${JSON.stringify(words)}`;

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });

  const text = response.output_text || "[]";
  try {
    const arr = JSON.parse(text);
    if (Array.isArray(arr) && arr.length === words.length) return arr.map(String);
  } catch (err) {
    console.error("Failed to parse translation for", language, words, text);
  }
  // Fallback: return original words if translation fails
  return words;
}

async function main() {
  console.log("Populating lesson cache for", topLanguages.length, "languages");

  for (const language of topLanguages) {
    console.log(`\n🌍 Processing ${language}`);
    for (let i = 0; i < universalCurriculum.length; i++) {
      const lessonNumber = i + 1;
      const englishWords = universalCurriculum[i];
      const translated = await translateWords(englishWords, language);

      const vocabulary = translated.map((w, idx) => ({
        word: w,
        translation: englishWords[idx],
      }));

      const lessonTitle = `Lesson ${lessonNumber}`;
      const lessonContent = `Lesson ${lessonNumber}: ${translated.join(', ')}`;

      await lessonAudioService.cacheLesson(
        language,
        lessonNumber,
        lessonTitle,
        lessonContent,
        vocabulary,
      );
    }
  }

  console.log("✅ Lesson cache population complete");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
