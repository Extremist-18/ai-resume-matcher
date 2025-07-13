const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Calls OpenAI GPT to extract skills and experience from resume text.
 * @param {string} text - Resume text
 * @returns {Promise<{skills: string[], experience: string[]}>}
 */
async function extractSkillsAndExperience(text) {
  const prompt = `Extract two lists from the following resume text:\n1. Skills (as a JSON array of strings)\n2. Experience (as a JSON array of strings, each string describing a relevant experience or job role)\nResume Text:\n"""\n${text}\n"""\nReturn the result as a JSON object with 'skills' and 'experience' keys.`;

  const response = await axios.post(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      }
    }
  );
  // Extract JSON from Gemini response
  const content = response.data.candidates[0].content.parts[0].text;
  try {
    // Find first and last curly braces to extract JSON
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    const jsonString = content.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Failed to parse skills/experience JSON from Gemini response. Raw content: ' + content);
  }
}

module.exports = { extractSkillsAndExperience };
