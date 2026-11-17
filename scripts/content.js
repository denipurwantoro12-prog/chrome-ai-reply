const BUTTON_CLASS = 'ai-reply-btn';
const MODAL_ID = 'ai-reply-modal-container';

const TONE_LABELS = [
  "🤍 Empatis / Supportive",
  "👍 Relatable / Setuju",
  "💬 Interaktif (Tanya Lanjutan)",
  "😄 Humor / Witty",
  "⚡ Ringkas / To The Point"
];

function injectAIReplyButton() {
  const toolbars = document.querySelectorAll('div[data-testid="toolBar"]');

  toolbars.forEach((toolbar) => {
    if (toolbar.querySelector(`.${BUTTON_CLASS}`)) return;

    const aiButton = document.createElement('button');
    aiButton.className = BUTTON_CLASS;
    aiButton.innerText = '✨ AI Reply';
    aiButton.type = 'button';
    aiButton.style.cssText = `
      background-color: #1d9bf0;
      color: white;
      border: none;
      border-radius: 9999px;
      padding: 6px 14px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      margin-left: 8px;
      transition: background-color 0.2s;
    `;

    aiButton.onmouseover = () => aiButton.style.backgroundColor = '#1a8cd8';
    aiButton.onmouseout = () => aiButton.style.backgroundColor = '#1d9bf0';

    aiButton.addEventListener('click', async (e) => {
      e.preventDefault();

      const tweetArticle = toolbar.closest('article') || document.querySelector('article');
      const tweetTextEl = tweetArticle ? tweetArticle.querySelector('div[data-testid="tweetText"]') : null;
      const tweetText = tweetTextEl ? tweetTextEl.innerText : "";

      let imageUrl = null;
      if (tweetArticle) {
        const imageEl = tweetArticle.querySelector('div[data-testid="tweetPhoto"] img');
        if (imageEl && imageEl.src) {
          imageUrl = imageEl.src;
        }
      }

      if (!tweetText && !imageUrl) {
        alert("Tidak dapat menemukan teks maupun gambar tweet untuk dibalas.");
        return;
      }

      const originalText = aiButton.innerText;
      aiButton.innerText = '⏳ Memahami Tweet...';
      aiButton.disabled = true;

      chrome.runtime.sendMessage(
        { 
          action: "generate_reply", 
          tweetText: tweetText,
          imageUrl: imageUrl 
        },
        (response) => {
          aiButton.innerText = originalText;
          aiButton.disabled = false;

          if (response && response.replies && response.replies.length > 0) {
            showReplyModal(response.replies, response.userAddresses);
          } else if (response && response.error) {
            alert("Error: " + response.error);
          } else {
            alert("Gagal menghasilkan balasan.");
          }
        }
      );
    });

    toolbar.appendChild(aiButton);
  });
}

function showReplyModal(replies, userAddressesText) {
  const existingModal = document.getElementById(MODAL_ID);
  if (existingModal) existingModal.remove();

  const overlay = document.createElement('div');
  overlay.id = MODAL_ID;
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.65);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  `;

  const modalBox = document.createElement('div');
  modalBox.className = 'ai-reply-modal-box';
  modalBox.style.cssText = `
    background: #15202b;
    color: #f7f9f9;
    padding: 20px;
    border-radius: 16px;
    width: 580px;
    max-width: 92%;
    max-height: 88vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    border: 1px solid #38444d;
  `;

  // Header Modal
  const header = document.createElement('div');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;';

  const title = document.createElement('span');
  title.innerText = '✨ AI Reply & Quick IDs';
  title.style.cssText = 'font-weight: bold; font-size: 16px; color: #1d9bf0;';

  const closeHeaderBtn = document.createElement('button');
  closeHeaderBtn.innerText = '✕';
  closeHeaderBtn.style.cssText = 'background: none; border: none; color: #8899a6; font-size: 18px; cursor: pointer;';
  closeHeaderBtn.addEventListener('click', () => overlay.remove());

  header.appendChild(title);
  header.appendChild(closeHeaderBtn);
  modalBox.appendChild(header);

  // Render Kartu Balasan Teks (5 Opsi)
  replies.forEach((text, index) => {
    const card = document.createElement('div');
    card.style.cssText = `
      background: #192734;
      border: 1px solid #38444d;
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    `;

    const cardHeader = document.createElement('div');
    cardHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

    const cardLabel = document.createElement('span');
    cardLabel.innerText = TONE_LABELS[index] || `Opsi ${index + 1}`;
    cardLabel.style.cssText = 'font-size: 12px; font-weight: bold; color: #1d9bf0;';

    const copyBtn = document.createElement('button');
    copyBtn.innerText = '📋 Salin';
    copyBtn.style.cssText = `
      background-color: #1d9bf0;
      color: white;
      border: none;
      border-radius: 9999px;
      padding: 4px 14px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.2s;
    `;

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.rows = 2;
    textarea.style.cssText = `
      width: 100%;
      box-sizing: border-box;
      background: #15202b;
      color: #ffffff;
      border: 1px solid #38444d;
      border-radius: 6px;
      padding: 8px;
      font-size: 13px;
      line-height: 1.4;
      resize: vertical;
      outline: none;
      font-family: inherit;
    `;

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(textarea.value).then(() => {
        copyBtn.innerText = '✅ Tersalin!';
        copyBtn.style.backgroundColor = '#00ba7c';
        setTimeout(() => overlay.remove(), 400);
      });
    });

    cardHeader.appendChild(cardLabel);
    cardHeader.appendChild(copyBtn);
    card.appendChild(cardHeader);
    card.appendChild(textarea);
    modalBox.appendChild(card);
  });

  // Render Section Quick Copy IDs di bagian bawah
  if (userAddressesText) {
    const quickSection = document.createElement('div');
    quickSection.style.cssText = `
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px dashed #38444d;
    `;

    const quickTitle = document.createElement('div');
    quickTitle.innerText = '🔑 Quick Copy Wallet / ID:';
    quickTitle.style.cssText = 'font-size: 12px; font-weight: bold; color: #8899a6; margin-bottom: 8px;';
    quickSection.appendChild(quickTitle);

    const badgeContainer = document.createElement('div');
    badgeContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px;';

    const lines = userAddressesText.split('\n').filter(l => l.trim().length > 0);
    lines.forEach(line => {
      const parts = line.split(':');
      const label = parts[0] ? parts[0].trim() : "ID";
      const value = parts.slice(1).join(':').trim() || line.trim();

      const badge = document.createElement('button');
      badge.className = 'ai-quick-badge';
      badge.innerText = `📋 ${label}`;
      badge.title = value;
      badge.style.cssText = `
        background: #273340;
        color: #f7f9f9;
        border: 1px solid #38444d;
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 11px;
        cursor: pointer;
        transition: background 0.2s;
      `;

      badge.addEventListener('click', () => {
        navigator.clipboard.writeText(value).then(() => {
          const origText = badge.innerText;
          badge.innerText = '✅ Tersalin!';
          badge.style.background = '#00ba7c';
          setTimeout(() => {
            badge.innerText = origText;
            badge.style.background = '#273340';
          }, 1500);
        });
      });

      badgeContainer.appendChild(badge);
    });

    quickSection.appendChild(badgeContainer);
    modalBox.appendChild(quickSection);
  }

  overlay.appendChild(modalBox);

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.remove();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

const observer = new MutationObserver(() => {
  injectAIReplyButton();
});

observer.observe(document.body, { childList: true, subtree: true });