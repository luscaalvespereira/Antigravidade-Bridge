// Antigravity Bridge - background.js v2.0
// Portavel: GitHub API + chrome.storage.sync + fallback localhost:7432

const LOCAL_PORT = 7432;

// Side panel ao clicar
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

// Habilitar side panel em todas as paginas
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });

  // Context menus
  chrome.contextMenus.create({
    id: 'sendToAntigravity',
    title: '🧠 Enviar para Antigravity Bridge',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'extractPage',
    title: '📄 Capturar página → Cérebro Virtual',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'openSidePanel',
    title: '📌 Abrir Antigravity Bridge',
    contexts: ['page', 'action']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'openSidePanel') {
    await chrome.sidePanel.open({ windowId: tab.windowId });
    return;
  }

  const payload = {
    type: info.menuItemId,
    selection: info.selectionText || '',
    url: tab.url,
    title: tab.title,
    timestamp: new Date().toISOString()
  };

  await chrome.storage.session.set({ lastCapture: payload });
  await chrome.sidePanel.open({ windowId: tab.windowId });
  // Notificar sidebar
  chrome.runtime.sendMessage({ type: 'NEW_CAPTURE', data: payload }).catch(() => {});
});

// Hub de mensagens
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === 'GET_CAPTURE') {
    chrome.storage.session.get('lastCapture')
      .then(d => sendResponse(d.lastCapture || null));
    return true;
  }

  if (msg.type === 'CHECK_LOCAL_BRIDGE') {
    fetch(`http://localhost:${LOCAL_PORT}/health`, { signal: AbortSignal.timeout(1500) })
      .then(r => r.json()).then(d => sendResponse({ ok: true, data: d }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (msg.type === 'OPEN_ANTIGRAVITY') {
    // Abre o Antigravity IDE — tenta a URL do bridge_url config primeiro
    chrome.storage.sync.get('bridge_url').then(({ bridge_url }) => {
      const url = bridge_url || 'https://aistudio.google.com/';
      chrome.windows.create({ url, type: 'popup', width: 1400, height: 900, focused: true });
    });
    sendResponse({ ok: true });
  }

  if (msg.type === 'OPEN_WHATSAPP') {
    // Anti-duplicate pattern (mesma arquitetura do WhatsApp_Launcher v2.0)
    const WA_URL = 'https://web.whatsapp.com/';
    chrome.storage.session.get('wa_window_id').then(async ({ wa_window_id }) => {
      if (wa_window_id) {
        try {
          await chrome.windows.update(wa_window_id, { focused: true });
          sendResponse({ ok: true, reused: true });
          return;
        } catch { await chrome.storage.session.remove('wa_window_id'); }
      }
      const win = await chrome.windows.create({ url: WA_URL, type: 'popup', width: 1200, height: 800, focused: true });
      await chrome.storage.session.set({ wa_window_id: win.id });
      sendResponse({ ok: true, reused: false });
    });
    return true;
  }
});

// Cleanup WhatsApp window ID (reutiliza logica do WhatsApp Launcher v2.0)
chrome.windows.onRemoved.addListener(async (removedId) => {
  const { wa_window_id } = await chrome.storage.session.get('wa_window_id');
  if (wa_window_id === removedId) {
    await chrome.storage.session.remove('wa_window_id');
  }
});