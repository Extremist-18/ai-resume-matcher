// const axios = require('axios');
// const pdfParser = require('pdf-parse');
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// const { extractRequirementsFromJD } = require('./openaiJDExtractor');
// const { normalizeDegreeString } = require('./synonymHelper');
// const { generateContextLine } = require('./openaiContextHelper');

// // Delay to manage API rate limits
// function delay(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// // Convert short sentences into paragraph-like blocks (~50-80 words)
// function groupSentencesToParagraphs(sentences, targetWords = 60) {
//   const paragraphs = [];
//   let current = [];
//   let wordCount = 0;

//   for (let sentence of sentences) {
//     const wordsInSentence = sentence.split(/\s+/).length;
//     if (wordCount + wordsInSentence > targetWords && current.length > 0) {
//       paragraphs.push(current.join(' '));
//       current = [];
//       wordCount = 0;
//     }
//     current.push(sentence);
//     wordCount += wordsInSentence;
//   }

//   if (current.length > 0) {
//     paragraphs.push(current.join(' '));
//   }

//   return paragraphs;
// }

// function extractSentences(text) {
//   return text
//     .split(/(?<=[.!?])\s+/)
//     .map(s => s.trim())
//     .filter(s => s.length > 10);
// }

// async function getGeminiSimilarityScore(reqLine, resPara, retries = 3) {
//   const prompt = `Rate semantic similarity between the job requirement and resume content on a scale of 0 to 1.\n\nJob Requirement:\n"${reqLine}"\n\nResume Content:\n"${resPara}"\n\nReturn only a number between 0 and 1.`;

//   try {
//     const response = await axios.post(
//       'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
//       { contents: [{ parts: [{ text: prompt }] }] },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'x-goog-api-key': GEMINI_API_KEY
//         }
//       }
//     );
//     const content = response.data.candidates[0].content.parts[0].text;
//     const score = parseFloat(content.match(/\d*\.?\d+/)?.[0] || '0');
//     return score;
//   } catch (err) {
//     if (err.response?.status === 429 && retries > 0) {
//       console.warn('429 Too Many Requests — retrying...');
//       await delay(1000);
//       return getGeminiSimilarityScore(reqLine, resPara, retries - 1);
//     }
//     console.error('Gemini Error:', err.message);
//     return 0;
//   }
// }

// function generateResumeTips(resumeText, jobText) {
//   const suggestions = [];
//   if (!/\b(\d+%|\$|projects?|clients?|growth|ROI|users?|savings)\b/i.test(resumeText)) {
//     suggestions.push('Include quantified results (e.g., “increased revenue by 20%”).');
//   }
//   if (!/led|managed|collaborated|mentored/i.test(resumeText)) {
//     suggestions.push('Highlight leadership or team contributions.');
//   }
//   if (!/certificat(e|ion)|award|licensed|credential/i.test(resumeText)) {
//     suggestions.push('Mention certifications or recognitions.');
//   }
//   if (resumeText.split(/\s+/).length < 100) {
//     suggestions.push('Expand the resume with more detailed achievements.');
//   }
//   if (/communication|teamwork|problem[- ]?solving/i.test(jobText) &&
//       !/communication|teamwork|problem[- ]?solving/i.test(resumeText)) {
//     suggestions.push('Include soft skills matching the job description.');
//   }
//   return suggestions;
// }

// async function matchResumeWithJob(resumeBuffer, jobBuffer) {
//   const { text: resumeText = '' } = await pdfParser(resumeBuffer);
//   const { text: jobText = '' } = await pdfParser(jobBuffer);

//   let jobRequirements = [];
//   try {
//     jobRequirements = await extractRequirementsFromJD(jobText);
//   } catch {
//     jobRequirements = jobText.split('\n').map(l => l.trim()).filter(l => l.length > 20).slice(0, 15);
//   }

//   // Single Gemini call for all requirements
//   let detailedMatches = [];
//   try {
//     detailedMatches = await matchRequirementsWithResumeGemini(jobRequirements, resumeText);
//   } catch (e) {
//     console.error('Gemini batch match error:', e.message);
//     // fallback: empty matches
//     detailedMatches = jobRequirements.map(r => ({ requirement: r, score: 0, matched_resume_snippet: '' }));
//   }
//   const totalSim = detailedMatches.reduce((sum, m) => sum + (m.score || 0), 0);
//   const semanticMatch = detailedMatches.length > 0 ? totalSim / detailedMatches.length : 0;
//   const suggestions = detailedMatches
//     .filter(m => (m.score || 0) < 0.65)
//     .map(m => `Missing or weak match for: "${m.requirement}"`);
//   const resumeTips = generateResumeTips(resumeText, jobText);

//   return {
//     matchPercent: Math.round(semanticMatch * 100),
//     suggestions: [...suggestions, ...resumeTips],
//     detailedMatches,
//     jobRequirements
//   };
// }

// module.exports = { matchResumeWithJob };

const axios = require('axios');
const pdfParser = require('pdf-parse');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const { extractRequirementsFromJD } = require('./openaiJDExtractor');
const { normalizeDegreeString } = require('./synonymHelper');
const { generateContextLine } = require('./openaiContextHelper');

// Delay for handling retries
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Extract sentences from text
function extractSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

// Group small sentences into paragraph-like blocks
function groupSentencesToParagraphs(sentences, targetWords = 60) {
  const paragraphs = [];
  let current = [];
  let wordCount = 0;

  for (let sentence of sentences) {
    const wordsInSentence = sentence.split(/\s+/).length;
    if (wordCount + wordsInSentence > targetWords && current.length > 0) {
      paragraphs.push(current.join(' '));
      current = [];
      wordCount = 0;
    }
    current.push(sentence);
    wordCount += wordsInSentence;
  }

  if (current.length > 0) {
    paragraphs.push(current.join(' '));
  }

  return paragraphs;
}

// Generates resume writing tips
function generateResumeTips(resumeText, jobText) {
  const suggestions = [];
  if (!/\b(\d+%|\$|projects?|clients?|growth|ROI|users?|savings)\b/i.test(resumeText)) {
    suggestions.push('Include quantified results (e.g., “increased revenue by 20%”).');
  }
  if (!/led|managed|collaborated|mentored/i.test(resumeText)) {
    suggestions.push('Highlight leadership or team contributions.');
  }
  if (!/certificat(e|ion)|award|licensed|credential/i.test(resumeText)) {
    suggestions.push('Mention certifications or recognitions.');
  }
  if (resumeText.split(/\s+/).length < 100) {
    suggestions.push('Expand the resume with more detailed achievements.');
  }
  if (/communication|teamwork|problem[- ]?solving/i.test(jobText) &&
    !/communication|teamwork|problem[- ]?solving/i.test(resumeText)) {
    suggestions.push('Include soft skills matching the job description.');
  }
  return suggestions;
}

// ✅ NEW FUNCTION: Batch request to Gemini
async function matchRequirementsWithResumeGemini(requirements, resumeText, retries = 3) {
  const prompt = `
You are a resume evaluator.

Compare the following RESUME with the list of JOB REQUIREMENTS.

Return a JSON array. For each requirement, return an object with:
- requirement (string)
- score (number between 0 and 1, semantic similarity of resume to requirement)
- matched_resume_snippet (optional sentence or short excerpt from resume)

Only return valid JSON. No extra explanation or commentary.

JOB REQUIREMENTS:
${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

RESUME:
"""
${resumeText}
"""
`;

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      { contents: [{ parts: [{ text: prompt }] }] },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        }
      }
    );

    const raw = response.data.candidates[0].content.parts[0].text;

    // Extract JSON from response
    const jsonStart = raw.indexOf('[');
    const jsonEnd = raw.lastIndexOf(']') + 1;
    const jsonStr = raw.slice(jsonStart, jsonEnd);

    return JSON.parse(jsonStr);
  } catch (err) {
    if (err.response?.status === 429 && retries > 0) {
      console.warn('429 Too Many Requests — retrying...');
      await delay(1000);
      return matchRequirementsWithResumeGemini(requirements, resumeText, retries - 1);
    }
    console.error('Gemini Error:', err.message);
    throw new Error('Failed to match requirements with resume using Gemini');
  }
}

// Main matching logic
async function matchResumeWithJob(resumeBuffer, jobBuffer) {
  const { text: resumeText = '' } = await pdfParser(resumeBuffer);
  const { text: jobText = '' } = await pdfParser(jobBuffer);

  let jobRequirements = [];
  try {
    jobRequirements = await extractRequirementsFromJD(jobText);
  } catch {
    jobRequirements = jobText.split('\n').map(l => l.trim()).filter(l => l.length > 20).slice(0, 15);
  }

  let detailedMatches = [];
  try {
    detailedMatches = await matchRequirementsWithResumeGemini(jobRequirements, resumeText);
  } catch (e) {
    console.error('Gemini batch match error:', e.message);
    detailedMatches = jobRequirements.map(r => ({
      requirement: r,
      score: 0,
      matched_resume_snippet: ''
    }));
  }

  const totalSim = detailedMatches.reduce((sum, m) => sum + (m.score || 0), 0);
  const semanticMatch = detailedMatches.length > 0 ? totalSim / detailedMatches.length : 0;

  const suggestions = detailedMatches
    .filter(m => (m.score || 0) < 0.65)
    .map(m => `Missing or weak match for: "${m.requirement}"`);

  const resumeTips = generateResumeTips(resumeText, jobText);

  return {
    matchPercent: Math.round(semanticMatch * 100),
    suggestions: [...suggestions, ...resumeTips],
    detailedMatches,
    jobRequirements
  };
}

module.exports = { matchResumeWithJob };
