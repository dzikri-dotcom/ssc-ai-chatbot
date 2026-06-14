import { list } from '@vercel/blob';

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

// Fungsi ini harus bersifat ASYNC karena sekarang mengambil data dari internet
export async function getRelevantContext(query, topK = 2) {
  try {
    // 1. Ambil list file di Blob untuk mencari knowledge.json
    const { blobs } = await list({ prefix: 'knowledge.json' });
    if (blobs.length === 0) return [];

    // 2. Ambil konten JSON langsung dari URL Blob
    const response = await fetch(blobs[0].url);
    const knowledgeBase = await response.json();
    
    // Asumsi: knowledgeBase.documents adalah array dari data yang kamu upload
    // Kamu mungkin perlu menyesuaikan strukturnya dengan data yang tersimpan
    const allChunks = [];
    knowledgeBase.documents.forEach(doc => {
      doc.chunks.forEach(chunk => {
        allChunks.push({ text: chunk.text, title: doc.categoryLabel, source: doc.source });
      });
    });

    const queryTokens = tokenize(query);
    const queryVector = {};
    queryTokens.forEach(token => {
      queryVector[token] = (queryVector[token] || 0) + 1;
    });

    const scoredChunks = allChunks.map(chunk => {
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

  } catch (error) {
    console.error("Gagal mengambil context dari Blob:", error);
    return [];
  }
}