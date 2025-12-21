import { invokeLLM } from "./llm";

/**
 * Supported languages for real-time translation
 */
export const SUPPORTED_LANGUAGES = {
  en: "English",
  ar: "Arabic",
  es: "Spanish",
  fr: "French",
  de: "German",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ru: "Russian",
  pt: "Portuguese",
  it: "Italian",
  nl: "Dutch",
  tr: "Turkish",
  hi: "Hindi",
  ur: "Urdu",
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Detect the language of a given text
 */
export async function detectLanguage(text: string): Promise<LanguageCode> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a language detection system. Analyze the given text and return ONLY the ISO 639-1 language code (2 letters). Supported codes: ${Object.keys(SUPPORTED_LANGUAGES).join(", ")}. Return only the code, nothing else.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "language_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              language: {
                type: "string",
                description: "ISO 639-1 language code",
                enum: Object.keys(SUPPORTED_LANGUAGES),
              },
            },
            required: ["language"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = typeof response.choices[0].message.content === 'string' ? response.choices[0].message.content : '{}';
    const result = JSON.parse(content);
    return (result.language || "en") as LanguageCode;
  } catch (error) {
    console.error("[Translation] Language detection failed:", error);
    return "en"; // Default to English on error
  }
}

/**
 * Translate text to a target language
 */
export async function translateText(
  text: string,
  targetLanguage: LanguageCode,
  sourceLanguage?: LanguageCode
): Promise<string> {
  try {
    // If source and target are the same, return original text
    if (sourceLanguage && sourceLanguage === targetLanguage) {
      return text;
    }

    const sourceLangName = sourceLanguage ? SUPPORTED_LANGUAGES[sourceLanguage] : "auto-detected";
    const targetLangName = SUPPORTED_LANGUAGES[targetLanguage];

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the given text from ${sourceLangName} to ${targetLangName}. Maintain the tone, context, and meaning. Return ONLY the translated text, nothing else.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const content = response.choices[0].message.content;
    return (typeof content === 'string' ? content.trim() : text) || text;
  } catch (error) {
    console.error(`[Translation] Translation to ${targetLanguage} failed:`, error);
    return text; // Return original text on error
  }
}

/**
 * Translate text to multiple target languages at once
 */
export async function translateToMultipleLanguages(
  text: string,
  targetLanguages: LanguageCode[],
  sourceLanguage?: LanguageCode
): Promise<Record<string, string>> {
  const translations: Record<string, string> = {};

  // Translate to each target language
  await Promise.all(
    targetLanguages.map(async (lang) => {
      if (sourceLanguage && lang === sourceLanguage) {
        translations[lang] = text; // No need to translate to source language
      } else {
        translations[lang] = await translateText(text, lang, sourceLanguage);
      }
    })
  );

  return translations;
}

/**
 * Auto-translate a message to common languages
 * This is used for chat messages to pre-translate to frequently used languages
 */
export async function autoTranslateMessage(
  text: string,
  detectedLanguage?: LanguageCode
): Promise<{
  detectedLanguage: LanguageCode;
  translations: Record<string, string>;
}> {
  // Detect language if not provided
  const sourceLang = detectedLanguage || (await detectLanguage(text));

  // Common languages to translate to (excluding source language)
  const targetLanguages: LanguageCode[] = ["en", "ar"];
  const uniqueTargets = targetLanguages.filter((lang) => lang !== sourceLang);

  // Translate to target languages
  const translations = await translateToMultipleLanguages(text, uniqueTargets, sourceLang);

  // Include original text in translations
  translations[sourceLang] = text;

  return {
    detectedLanguage: sourceLang,
    translations,
  };
}
