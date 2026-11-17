const DEFAULT_ADDRESSES = `SOL / Solana Address: F4gfqcn44gA75RKH7qnRAyyGUq7X1DsEK4F4HLG76quA
EVM / ETH / BSC / Polygon Address: 0x926B25Dac351E8C25e625BBfc9e1A621cFc26f80
BTC / Bitcoin Address: bc1q8frlzekh04y23ayeevvz2x4rhawhkzzlzk4e73
Stake Username: slametgembreng
Roobet Username: slametgendul
Gamdom Username: slametgembreng (steve)
MetaWin Username: slametgembreng
KuCoin ID: 155395048
WEEX UID: 3609206234
Bitget UID: 4473182584
MEXC UID: 88934168
Binance ID: 103027364
Bybit ID: 169730370
OKX ID: 293686011463127040`;

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['apiKey', 'language', 'model', 'userAddresses'], (result) => {
    if (result.apiKey) document.getElementById('apiKey').value = result.apiKey;
    if (result.language) document.getElementById('language').value = result.language;
    if (result.model) document.getElementById('model').value = result.model;
    
    document.getElementById('userAddresses').value = result.userAddresses || DEFAULT_ADDRESSES;
  });

  document.getElementById('saveBtn').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    const language = document.getElementById('language').value;
    const model = document.getElementById('model').value;
    const userAddresses = document.getElementById('userAddresses').value;

    chrome.storage.local.set({ apiKey, language, model, userAddresses }, () => {
      const status = document.getElementById('status');
      status.textContent = 'Pengaturan berhasil disimpan!';
      setTimeout(() => status.textContent = '', 2000);
    });
  });
});