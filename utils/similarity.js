import fs from 'fs';
import path from 'path';

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

function calculateCosine(vecA, vecB) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (const key in vecA) {
    if (vecB[key]) dotProduct += vecA[key] * vecB[key];
    magnitudeA += vecA[key] * vecA[key];
  }
  for (const key in vecB) {
    magnitudeB += vecB[key] * vecB[key];
  }
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

export function getRelevantContext(query, topK = 2) {
  const filePath = path.join(process.cwd(), 'data/knowledge.json');
  if (!fs.existsSync(filePath)) return [];
  
  const knowledgeBase = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const queryTokens = tokenize(query);
  
  const queryVector = {};
  queryTokens.forEach(token => {
    queryVector[token] = (queryVector[token] || 0) + 1;
  });

  const scoredChunks = knowledgeBase.map(chunk => {
    const chunkTokens = tokenize(chunk.text + " " + chunk.title);
    const chunkVector = {};
    chunkTokens.forEach(token => {
      chunkVector[token] = (chunkVector[token] || 0) + 1;
    });

    const score = calculateCosine(queryVector, chunkVector);
    return { ...chunk, score };
  });

  return scoredChunks
    .filter(item => item.score > 0.04)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}