const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, '../data/Surat-Keterangan-Aktif.pdf');
const outputPath = path.join(__dirname, '../data/knowledge.json');

async function extractPdfText() {
  console.log('⌛ Sedang memproses penguraian berkas PDF asli dengan pdf-parse (Text-Stream Mode)...');

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ File PDF tidak ditemukan di rute: ${pdfPath}`);
    process.exit(1);
  }

  try {
    const dataBuffer = fs.readFileSync(pdfPath);

    // Konfigurasi opsi kustom untuk memisahkan teks per halaman
    const options = {
      pagerender: function(pageData) {
        return pageData.getTextContent()
          .then(function(textContent) {
            let lastY, text = '';
            for (let item of textContent.items) {
              if (lastY == item.transform[5] || !lastY){
                text += item.str + ' ';
              } else {
                text += '\n' + item.str + ' ';
              }
              lastY = item.transform[5];
            }
            // Berikan pembatas halaman yang unik agar mudah di-split nanti
            return `===SPLIT_PAGE_HERE===` + text;
          });
      }
    };

    const data = await pdf(dataBuffer, options);
    
    // Pecah teks berdasarkan pembatas halaman yang kita buat di atas
    const rawPages = data.text.split('===SPLIT_PAGE_HERE===');
    let chunks = [];
    let pageNum = 0;

    for (let pageText of rawPages) {
      const cleanedText = pageText.replace(/\s+/g, ' ').trim();
      
      // Lewati teks kosong atau jika itu bagian pecahan pertama sebelum split
      if (cleanedText.length > 15) {
        pageNum++;
        const words = cleanedText.split(' ');
        const titleSnippet = words.slice(0, 4).join(' ') + '...';

        chunks.push({
          title: `Panduan TOSS: ${titleSnippet}`,
          source: `Buku Panduan TOSS Halaman ${pageNum}`,
          text: cleanedText
        });
      }
    }

    // Tulis pangkalan data JSON
    fs.writeFileSync(outputPath, JSON.stringify(chunks, null, 2), 'utf-8');
    console.log(`\n✅ Sukses! Pangkalan data JSON berhasil dibuat secara otomatis tanpa Python.`);
    console.log(`📊 Berhasil mengekstrak: ${chunks.length} halaman/chunks dari PDF ke knowledge.json.`);

  } catch (error) {
    console.error('❌ Terjadi kesalahan saat mengekstrak PDF:', error);
  }
}

// Jalankan fungsi utama
extractPdfText();