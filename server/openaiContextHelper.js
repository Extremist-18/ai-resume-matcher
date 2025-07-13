const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Generates a contextual summary line for a requirement or resume using OpenAI GPT.
 * @param {string} text - The input text (requirement or resume section)
 * @param {string} type - 'requirement' or 'resume'
 * @returns {Promise<string>} - A single context-rich line
 */
// async function generateContextLine(text, type = 'requirement') {
//   const prompt =
//     type === 'requirement'
//       ? `Rewrite the following job requirement as a clear, context-rich, single line that captures its full intent and meaning.\nRequirement:\n"""${text}"""\nContext line:`
//       : `Summarize the following resume section or sentence as a single context-rich line, focusing on skills and experience relevant to job requirements.\nResume Text:\n"""${text}"""\nContext line:`;

//   const response = await axios.post(
//     'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
//     {
//       contents: [
//         {
//           parts: [
//             { text: prompt }
//           ]
//         }
//       ]
//     },
//     {
//       headers: {
//         'Content-Type': 'application/json',
//         'x-goog-api-key': GEMINI_API_KEY
//       }
//     }
//   );
//   return response.data.candidates[0].content.parts[0].text.trim();
// }

async function generateContextLine(text, type = 'requirement', maxRetries = 3) {
    const prompt =
    type === 'requirement'
      ? `Rewrite the following job requirement as a clear, context-rich, single line that captures its full intent and meaning.\nRequirement:\n"""${text}"""\nContext line:`
      : `Summarize the following resume section or sentence as a single context-rich line, focusing on skills and experience relevant to job requirements.\nResume Text:\n"""${text}"""\nContext line:`;

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const response = await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
          { contents: [ { parts: [ { text: prompt } ] } ] },
          { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY } }
        );
        return response.data.candidates[0].content.parts[0].text.trim();
      } catch (err) {
        if (err.response && err.response.status === 429) {
          await new Promise(res => setTimeout(res, 1500 * (attempt + 1)));
          attempt++;
        } else {
          throw err;
        }
      }
    }
    throw new Error('Gemini context line generation failed after retries');
  }

module.exports = { generateContextLine };
