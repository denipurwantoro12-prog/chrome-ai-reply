async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return {
      inline_data: {
        mime_type: blob.type || 'image/jpeg',
        data: btoa(binary)
      }
    };
  } catch (err) {
    return null;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generate_reply") {
    
    chrome.storage.local.get(['apiKey', 'language', 'model', 'userAddresses'], async (data) => {
      if (!data.apiKey) {
        sendResponse({ error: "API Key belum diisi! Klik ikon ekstensi di toolbar Chrome." });
        return;
      }

      const primaryModel = data.model || 'models/gemini-2.5-flash';
      const candidateModels = [
        primaryModel,
        'models/gemini-2.0-flash',
        'models/gemini-3.5-flash-lite'
      ].map(m => m.startsWith('models/') ? m : `models/${m}`);

      const modelQueue = [...new Set(candidateModels)];
      const langSetting = data.language || 'Auto';
      const userAddresses = data.userAddresses || "";

      const promptText = `Tugas Utama: Analisis konteks dan bahasa dari tweet sumber, lalu buatkan 5 PILIHAN BALASAN Twitter/X yang alami, empatik, dan relevan.

DAFTAR MASTER ADDRESS & UID PENGGUNA:
${userAddresses}

PENGATURAN BAHASA: ${langSetting}

ATURAN WAJIB BAHASA BALASAN (AUTO LANGUAGE MATCHING):
1. JIKA PENGATURAN BAHASA ADALAH 'Auto':
   - IDENTIFIKASI BAHASA UTAMA TWEET SUMBER (contoh: Inggris, Jepang, Korea, Spanyol, Prancis, Jerman, Arab, Indonesia, Portugis, dll.).
   - SEMUA (5) PILIHAN BALASAN WAJIB DITULIS DALAM BAHASA YANG 100% SAMA DENGAN BAHASA TWEET SUMBER TERSEBUT.
   - Gunakan gaya bahasa, slang, singkatan, dan idiom khas Twitter/X dari negara/bahasa tersebut agar terlihat seperti ditulis oleh warga lokal (native speaker).
     * Contoh Jepang: Gunakan gaya bahasa santai/Twitter Jepang (seperti "わかる", "それな", "www").
     * Contoh Korea: Gunakan gaya bahasa Twitter Korea (banmal/반말 santai).
     * Contoh Inggris: Gunakan Twitter English slang (seperti "tbh", "ngl", "fr", "i feel you", lowercase vibe).
     * Contoh Indonesia: Gunakan bahasa gaul Twitter Indo (seperti "relate bgt", "huggg", "valid", "pliss").
2. JIKA PENGATURAN BAHASA DISET SPESIFIK (misal: 'Indonesian', 'English', 'Japanese', dll):
   - Gunakan bahasa yang dipilih tersebut untuk semua opsi balasan.

Teks Tweet yang dibalas: "${request.tweetText || '(Lihat gambar untuk konteks)'}"

ATURAN KHUSUS WALLET & UID:
1. JIKA TWEET MEMINTA/MENGARAHKAN UNTUK MENYERTAKAN ADDRESS ATAU ID (contoh: "drop SOL", "drop Binance ID", "comment Stake", "EVM/ETH", "MEXC UID", dll):
   - CARI baris yang cocok pada DAFTAR MASTER di atas.
   - SALIN VALUE TERSEBUT SECARA EXACT / VERBATIM (100% SAMA PERSIS TANPA MENGUBAH 1 KARAKTER PUN).
2. JIKA TWEET TIDAK MEMINTA WALLET ATAU ID, JANGAN MENCANTUMKAN ADDRESS/ID APAPUN DALAM BALASAN.

ATURAN 5 VARIASI TONE BALASAN:
- Opsi 1: Empatis / Supportive (dalam bahasa yang sesuai)
- Opsi 2: Relatable / Setuju (dalam bahasa yang sesuai)
- Opsi 3: Interaktif / Tanya Lanjutan (dalam bahasa yang sesuai)
- Opsi 4: Humor / Witty (dalam bahasa yang sesuai)
- Opsi 5: Ringkas / Direct (dalam bahasa yang sesuai)

FORMAT OUTPUT (SANGAT WAJIB JSON ARRAY VALID BERISI 5 STRING):
["Balasan 1", "Balasan 2", "Balasan 3", "Balasan 4", "Balasan 5"]`;

      const parts = [{ text: promptText }];

      if (request.imageUrl) {
        const imagePart = await fetchImageAsBase64(request.imageUrl);
        if (imagePart) parts.push(imagePart);
      }

      let lastError = "";

      for (const model of modelQueue) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${data.apiKey}`, 
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: parts }] })
            }
          );

          const result = await response.json();

          if (response.ok) {
            let rawReply = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawReply) {
              rawReply = rawReply.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
              
              try {
                const parsedReplies = JSON.parse(rawReply);
                if (Array.isArray(parsedReplies) && parsedReplies.length > 0) {
                  sendResponse({ replies: parsedReplies.slice(0, 5), userAddresses: userAddresses });
                  return;
                }
              } catch (e) {
                const lines = rawReply.split('\n')
                  .map(l => l.replace(/^[\d\.\-\*"]+\s*/, '').replace(/^["']|["']$/g, '').trim())
                  .filter(l => l.length > 0);
                if (lines.length > 0) {
                  sendResponse({ replies: lines.slice(0, 5), userAddresses: userAddresses });
                  return;
                }
              }
            }
          }

          lastError = result.error?.message || `HTTP Status ${response.status}`;
        } catch (err) {
          lastError = err.message;
        }
      }

      sendResponse({ error: `Semua model gagal/sibuk: ${lastError}` });
    });

    return true;
  }
});