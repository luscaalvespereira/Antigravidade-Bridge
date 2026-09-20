// Antigravity Bridge - github_api.js
// Camada soberana de acesso ao GitHub como backend de conhecimento

const GITHUB_API = 'https://api.github.com';

/**
 * Carrega configuracao do chrome.storage.sync (viaja com o perfil Chrome)
 */
export async function getConfig() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['gh_token', 'gh_repo', 'gh_owner', 'bridge_url'], resolve);
  });
}

export async function saveConfig(cfg) {
  return new Promise(resolve => chrome.storage.sync.set(cfg, resolve));
}

/**
 * Headers autenticados para GitHub API
 */
function headers(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

/**
 * Verifica se o repo existe. Se nao, cria automaticamente.
 */
export async function ensureRepo(token, owner, repo) {
  const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers: headers(token) });
  if (r.status === 404) {
    // Criar repo privado automaticamente
    await fetch(`${GITHUB_API}/user/repos`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({
        name: repo,
        private: true,
        description: 'Antigravity Bridge - Cerebro Virtual Knowledge Sync',
        auto_init: true
      })
    });
    return true;
  }
  return r.ok;
}

/**
 * Lista arquivos no repo (raiz ou subpasta)
 */
export async function listFiles(token, owner, repo, path = '') {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const r = await fetch(url, { headers: headers(token) });
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data) ? data : [data];
}

/**
 * Le conteudo de um arquivo do repo
 */
export async function readFile(token, owner, repo, path) {
  const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    headers: headers(token)
  });
  if (!r.ok) return null;
  const data = await r.json();
  return atob(data.content.replace(/\n/g, ''));
}

/**
 * Grava/atualiza arquivo no repo (cria se nao existe, atualiza se existe)
 */
export async function writeFile(token, owner, repo, path, content, message = 'Antigravity Bridge sync') {
  // Verificar se ja existe (para pegar SHA)
  let sha = null;
  const check = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    headers: headers(token)
  });
  if (check.ok) {
    const existing = await check.json();
    sha = existing.sha;
  }

  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    ...(sha ? { sha } : {})
  };

  const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(body)
  });
  return r.ok;
}

/**
 * Salva uma captura (selecao de texto, pagina extraida) como JSON no repo
 */
export async function saveCapture(token, owner, repo, capture) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `captures/${ts}.json`;
  const content = JSON.stringify(capture, null, 2);
  return writeFile(token, owner, repo, path, content, `capture: ${capture.title || capture.url}`);
}

/**
 * Lista KIs do Cerebro Virtual publicados no repo
 */
export async function listKnowledgeItems(token, owner, repo) {
  try {
    const files = await listFiles(token, owner, repo, 'knowledge');
    return files.filter(f => f.type === 'dir' || f.name.endsWith('.md'));
  } catch { return []; }
}

/**
 * Verifica conectividade e retorna status completo
 */
export async function checkConnection(token, owner, repo) {
  try {
    const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers: headers(token),
      signal: AbortSignal.timeout(5000)
    });
    if (r.ok) {
      const data = await r.json();
      return { ok: true, private: data.private, url: data.html_url, stars: data.stargazers_count };
    }
    return { ok: false, status: r.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}