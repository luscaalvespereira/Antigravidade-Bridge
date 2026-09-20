// Antigravity Bridge - sidebar.js v2.0
// Portavel: GitHub API + chrome.storage.sync + fallback localhost:7432

const LOCAL_PORT = 7432;
const GH_API     = 'https://api.github.com';

// ---- Config ----
async function getCfg() {
  return new Promise(r => chrome.storage.sync.get(['gh_token','gh_owner','gh_repo','bridge_url'], r));
}

// ---- Tabs ----
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'cerebro') loadKIs();
    if (tab.dataset.tab === 'capture') loadCapture();
  });
});

// ---- Page title ----
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  if (tabs[0]) document.getElementById('pageTitle').textContent = tabs[0].title || tabs[0].url;
});

// ---- Status check ----
async function checkStatus() {
  const cfg = await getCfg();
  // GitHub
  if (cfg.gh_token && cfg.gh_owner) {
    try {
      const r = await fetch(`${GH_API}/repos/${cfg.gh_owner}/${cfg.gh_repo||'cerebro-bridge'}`, {
        headers: { Authorization:`Bearer ${cfg.gh_token}`, Accept:'application/vnd.github.v3+json' },
        signal: AbortSignal.timeout(3000)
      });
      if (r.ok) {
        document.getElementById('bridgeDot').className = 'status-dot online';
        document.getElementById('bridgeStatus').textContent = `GitHub: ✅ ${cfg.gh_owner}/${cfg.gh_repo||'cerebro-bridge'}`;
        return 'github';
      }
    } catch {}
  }
  // Local fallback
  try {
    await fetch(`http://localhost:${LOCAL_PORT}/health`, { signal: AbortSignal.timeout(1000) });
    document.getElementById('bridgeDot').className = 'status-dot online';
    document.getElementById('bridgeStatus').textContent = 'Local bridge: ✅ porta 7432';
    return 'local';
  } catch {}
  document.getElementById('bridgeDot').className = 'status-dot offline';
  document.getElementById('bridgeStatus').textContent = '⚠️ Configure GitHub nas opções';
  return 'none';
}
checkStatus();
setInterval(checkStatus, 15000);

// ---- Chat ----
const chatArea = document.getElementById('chatArea');
const chatInput = document.getElementById('chatInput');

function addMsg(text, role) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

document.getElementById('sendBtn').addEventListener('click', async () => {
  const text = chatInput.value.trim(); if (!text) return;
  addMsg(text, 'user'); chatInput.value = '';
  const mode = await checkStatus();
  if (mode === 'local') {
    try {
      const r = await fetch(`http://localhost:${LOCAL_PORT}/query`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ prompt:text, timestamp:new Date().toISOString() })
      });
      const d = await r.json();
      addMsg(d.response || JSON.stringify(d), 'assistant'); return;
    } catch {}
  }
  if (mode === 'github') {
    // Salvar no GitHub como "query"
    const cfg = await getCfg();
    const ts  = new Date().toISOString().replace(/[:.]/g,'-');
    const content = JSON.stringify({ prompt:text, timestamp:new Date().toISOString() }, null, 2);
    const b64 = btoa(unescape(encodeURIComponent(content)));
    try {
      await fetch(`${GH_API}/repos/${cfg.gh_owner}/${cfg.gh_repo||'cerebro-bridge'}/contents/queries/${ts}.json`, {
        method:'PUT', headers:{Authorization:`Bearer ${cfg.gh_token}`,Accept:'application/vnd.github.v3+json','Content-Type':'application/json'},
        body: JSON.stringify({ message:`query: ${text.substring(0,50)}`, content:b64 })
      });
      addMsg('Prompt salvo no Cérebro Virtual (GitHub). Resposta será processada pelo Antigravity IDE no seu PC.', 'assistant');
    } catch(e) { addMsg(`Erro ao salvar: ${e.message}`, 'system'); }
    return;
  }
  addMsg('Configure GitHub nas Opções para sincronização cross-device.', 'system');
});

chatInput.addEventListener('keydown', e => { if (e.ctrlKey && e.key==='Enter') document.getElementById('sendBtn').click(); });

// ---- Extrair página ----
document.getElementById('extractPageBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const results = await chrome.scripting.executeScript({
    target:{ tabId:tab.id },
    func: () => ({ title:document.title, url:location.href, text:document.body.innerText.substring(0,5000) })
  });
  const data = results[0].result;
  const cfg  = await getCfg();
  const mode = await checkStatus();
  addMsg(`Extraindo: "${data.title}"...`, 'system');
  if (mode !== 'none') {
    const capture = { type:'extractPage', ...data, timestamp:new Date().toISOString() };
    if (mode === 'github') {
      const ts  = new Date().toISOString().replace(/[:.]/g,'-');
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(capture, null, 2))));
      await fetch(`${GH_API}/repos/${cfg.gh_owner}/${cfg.gh_repo||'cerebro-bridge'}/contents/captures/${ts}.json`, {
        method:'PUT', headers:{Authorization:`Bearer ${cfg.gh_token}`,Accept:'application/vnd.github.v3+json','Content-Type':'application/json'},
        body: JSON.stringify({ message:`capture: ${data.title}`, content:b64 })
      }).catch(() => {});
    } else {
      await fetch(`http://localhost:${LOCAL_PORT}/capture`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(capture) }).catch(()=>{});
    }
    addMsg('Página capturada e enviada ao Cérebro Virtual!', 'assistant');
  } else { addMsg(`Conteúdo:\n${data.text.substring(0,500)}`, 'assistant'); }
});

// ---- Botões rápidos ----
document.getElementById('openAntigravityBtn').addEventListener('click', () => chrome.runtime.sendMessage({ type:'OPEN_ANTIGRAVITY' }));
document.getElementById('openWABtn').addEventListener('click', () => chrome.runtime.sendMessage({ type:'OPEN_WHATSAPP' }));
document.getElementById('openOptionsBtn')?.addEventListener('click', () => chrome.runtime.openOptionsPage());

// ---- Capture tab ----
async function loadCapture() {
  const data = await chrome.runtime.sendMessage({ type:'GET_CAPTURE' });
  const area = document.getElementById('captureArea');
  if (!data) { area.innerHTML='<div class="msg system">Nenhuma captura. Selecione texto e use o menu de contexto.</div>'; return; }
  area.innerHTML=`<div class="capture-card">
    <div class="label">TIPO: ${data.type||'captura'}</div>
    <div class="label" style="margin-top:6px">CONTEÚDO:</div>
    <div class="text">${(data.selection||data.text||'').substring(0,500)}</div>
    <div class="url">${data.url||''}</div>
    <div class="sync-btn-row">
      <button class="btn" id="syncCaptureBtn" style="font-size:10px;padding:4px 8px">🔄 Sync → Cérebro</button>
      <button class="btn secondary" id="copyCaptureBtn" style="font-size:10px;padding:4px 8px">📋 Copiar</button>
    </div></div>`;
  document.getElementById('copyCaptureBtn')?.addEventListener('click', () => navigator.clipboard.writeText(data.selection||data.text||''));
  document.getElementById('syncCaptureBtn')?.addEventListener('click', async () => {
    const mode = await checkStatus();
    const cfg  = await getCfg();
    if (mode === 'github') {
      const ts  = new Date().toISOString().replace(/[:.]/g,'-');
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(data,null,2))));
      const r = await fetch(`${GH_API}/repos/${cfg.gh_owner}/${cfg.gh_repo||'cerebro-bridge'}/contents/captures/${ts}.json`, {
        method:'PUT', headers:{Authorization:`Bearer ${cfg.gh_token}`,Accept:'application/vnd.github.v3+json','Content-Type':'application/json'},
        body: JSON.stringify({ message:`sync: ${data.title||data.url}`, content:b64 })
      }).catch(e => ({ ok:false }));
      addMsg(r.ok !== false ? '✅ Sincronizado com GitHub!' : '❌ Falha ao sincronizar.', 'system');
    } else if (mode === 'local') {
      await fetch(`http://localhost:${LOCAL_PORT}/sync`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
      addMsg('✅ Sincronizado via bridge local!', 'system');
    } else { addMsg('Configure GitHub nas Opções.', 'system'); }
  });
}

// ---- KIs do Cérebro Virtual (GitHub) ----
async function loadKIs() {
  const list = document.getElementById('kiList');
  const cfg  = await getCfg();
  list.innerHTML = '<div class="msg system">Carregando...</div>';
  if (cfg.gh_token && cfg.gh_owner) {
    try {
      const r = await fetch(`${GH_API}/repos/${cfg.gh_owner}/${cfg.gh_repo||'cerebro-bridge'}/contents/knowledge`, {
        headers: { Authorization:`Bearer ${cfg.gh_token}`, Accept:'application/vnd.github.v3+json' },
        signal: AbortSignal.timeout(6000)
      });
      if (r.ok) {
        const items = await r.json();
        if (!items.length) { list.innerHTML='<div class="msg system">Nenhum KI sincronizado ainda. Execute -PushAll no PowerShell.</div>'; return; }
        list.innerHTML = items.map(i => `
          <div class="ki-item" onclick="window.open('${i.html_url}','_blank')">
            <div class="ki-title">${i.name}</div>
            <div class="ki-meta">GitHub | ${i.type}</div>
          </div>`).join('');
        return;
      }
    } catch {}
  }
  // Fallback local
  try {
    const r = await fetch(`http://localhost:${LOCAL_PORT}/knowledge`, { signal:AbortSignal.timeout(2000) });
    const d = await r.json();
    list.innerHTML = (d.items||[]).map(i => `<div class="ki-item"><div class="ki-title">${i.name}</div><div class="ki-meta">${i.modified}</div></div>`).join('') || '<div class="msg system">Nenhum KI local.</div>';
  } catch {
    list.innerHTML = '<div class="msg system">Configure GitHub nas <a href="#" id="openOpts" style="color:#3b82f6">Opções</a> para acesso cross-device.</div>';
    document.getElementById('openOpts')?.addEventListener('click', () => chrome.runtime.openOptionsPage());
  }
}

document.getElementById('refreshKIBtn').addEventListener('click', loadKIs);
document.getElementById('openOptionsBtn2')?.addEventListener('click', () => chrome.runtime.openOptionsPage());