const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Extracts requirement sentences from a job description using OpenAI GPT.
 * @param {string} jdText - The full job description text
 * @returns {Promise<string[]>} Array of requirement sentences
 */
async function extractRequirementsFromJD(jdText) {
  const prompt = `Extract only the requirement sentences (not keywords or n-grams) from the following job description. Return them as a JSON array of strings. Only include requirement statements, not company info, benefits, or other details.\nJob Description:\n"""\n${jdText}\n"""\nResult:`;

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
  // Gemini returns candidates[0].content.parts[0].text
  const content = response.data.candidates[0].content.parts[0].text;
  try {
    const jsonStart = content.indexOf('[');
    const jsonEnd = content.lastIndexOf(']') + 1;
    const jsonString = content.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Failed to parse requirements JSON from OpenAI response. Raw content: ' + content);
  }
}

module.exports = { extractRequirementsFromJD };
