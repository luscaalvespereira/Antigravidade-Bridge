# Antigravity Bridge v2.0
**Acesso soberano ao Cérebro Virtual de QUALQUER computador.**

## Arquitetura
```
Qualquer PC → Extensão Chrome → GitHub API (repo privado)
                              → chrome.storage.sync (token viaja com seu perfil Chrome)
Home PC → Sync_Cerebro_Global.ps1 -ModoAntigravityBridge → push KIs → GitHub
```

## Instalação rápida
1. Execute `INSTALAR.bat` ou manualmente: `chrome://extensions/` → Carregar sem compactação → selecione esta pasta
2. Clique no ícone **AG** → ⚙️ Configurações
3. Insira seu GitHub PAT (escopo `repo`) e usuário
4. Clique **Salvar & Verificar**

## No PC principal (sincronização automática)
```powershell
# Setup inicial (uma vez)
& "$env:OneDrive\Sync_Cerebro_Global.ps1" -ModoAntigravityBridge

# Sincronizar TODOS os KIs
& "$env:OneDrive\Sync_Cerebro_Global.ps1" -ModoAntigravityBridge -PushAll

# Bridge server local (opcional, para acesso instantâneo)
pwsh D:\Cerebro_Virtual\bridge_server.ps1
```

## Funcionalidades
- 💬 **Chat** com o Cérebro Virtual (salva queries no GitHub)
- 📋 **Captura** de seleções de texto e páginas inteiras
- 🧠 **Cérebro** — visualiza KIs sincronizados no GitHub
- 💬 **WhatsApp** — abre via anti-duplicate (mesma arquitetura v2.0)
- ⚙️ **Configurações** viajam com `chrome.storage.sync` para todos os Chromes logados

## Arquivos
| Arquivo | Função |
|---------|--------|
| `manifest.json` | Manifesto MV3 |
| `background.js` | Service worker anti-duplicate |
| `sidebar.html/js` | Interface principal (SidePanel API) |
| `popup.html` | Popup de acesso rápido |
| `options.html` | Configuração do GitHub PAT |
| `content.js` | Captura de seleções de texto |
| `github_api.js` | Abstração da GitHub API |

## Módulos PowerShell instalados
- `D:\Cerebro_Virtual\bridge_server.ps1` — servidor HTTP local porta 7432
- `D:\Cerebro_Virtual\modulo_whatsapp_launcher_bridge.ps1` — WhatsApp Launcher v2.0
- `D:\Cerebro_Virtual\modulo_github_cerebro_sync.ps1` — GitHub Cerebro Sync

*Antigravity OS — Lucas Alves Pereira — 20/09/2026*