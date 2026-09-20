// Antigravity Bridge - content.js v1.0
// Injeta listener de selecao de texto para captura rapida

let lastSelection = '';
document.addEventListener('mouseup', () => {
  const sel = window.getSelection()?.toString().trim();
  if (sel && sel !== lastSelection && sel.length > 3) {
    lastSelection = sel;
    chrome.runtime.sendMessage({
      type: 'TEXT_SELECTED',
      text: sel,
      url: location.href,
      title: document.title
    }).catch(() => {});
  }
});