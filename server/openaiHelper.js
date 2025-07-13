const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function getEmbedding(text) {
  throw new Error('Gemini API does not support direct embeddings. Use prompt-based similarity or integrate Vertex AI for embeddings.');
}

async function getBatchEmbeddings(texts, maxRetries = 3) {
  throw new Error('Gemini API does not support direct embeddings. Use prompt-based similarity or integrate Vertex AI for embeddings.');
}

function cosineSimilarity(vecA, vecB) {
  // This function is not used unless you have embeddings.
  return 0;
}

module.exports = { getEmbedding, getBatchEmbeddings, cosineSimilarity };
