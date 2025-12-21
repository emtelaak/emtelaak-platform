import { translateText, detectLanguage } from './server/_core/translation.js';

console.log('Testing Translation Service...\n');

// Test 1: Language Detection
console.log('Test 1: Language Detection');
console.log('---------------------------');
const testTexts = [
  { text: 'Hello, how are you?', expected: 'en' },
  { text: 'مرحبا، كيف حالك؟', expected: 'ar' },
  { text: 'Hola, ¿cómo estás?', expected: 'es' },
  { text: 'Bonjour, comment allez-vous?', expected: 'fr' },
];

for (const { text, expected } of testTexts) {
  try {
    const detected = await detectLanguage(text);
    console.log(`✓ "${text.substring(0, 30)}..." → Detected: ${detected} (Expected: ${expected})`);
  } catch (error) {
    console.log(`✗ Failed to detect language for "${text}": ${error.message}`);
  }
}

// Test 2: Translation
console.log('\nTest 2: Translation');
console.log('-------------------');
const translationTests = [
  { text: 'Hello, welcome to our platform!', from: 'en', to: 'ar' },
  { text: 'مرحبا بكم في منصتنا', from: 'ar', to: 'en' },
  { text: 'I need help with my investment', from: 'en', to: 'ar' },
];

for (const { text, from, to } of translationTests) {
  try {
    const translated = await translateText(text, to, from);
    console.log(`✓ [${from}→${to}] "${text}" → "${translated}"`);
  } catch (error) {
    console.log(`✗ Translation failed: ${error.message}`);
  }
}

console.log('\n✅ Translation service tests complete!');
