# SECURITY.md - Antigravity Bridge

## Blindagem Soberana e Air-Gap

Esta extensao foi projetada com seguranca em camadas:

### O que NUNCA deve ser commitado (protegido pelo .gitignore)

| Categoria | Exemplos | Risco |
|-----------|----------|-------|
| Tokens/PATs | GitHub PAT, API keys | Acesso total ao repositorio |
| Cerebro Virtual | Sync_Cerebro_Global.ps1, cerebro_audit_log.jsonl | Exposicao da infraestrutura pessoal |
| Config local | config.json, .env | Credenciais em texto plano |
| Brain/Knowledge | brain/, knowledge/, .gemini/ | Dados pessoais e academicos |
| Logs | *.log, *.jsonl | Rastros de atividade |

### Onde as credenciais SAO armazenadas (de forma segura)

- **GitHub PAT:** chrome.storage.sync (criptografado pelo Chrome, viaja com o perfil Google)
- **Configuracao local:** chrome.storage.local (isolado por extensao, nunca exportado)
- **NUNCA em arquivos de texto plano dentro do diretorio da extensao**

### Antes de publicar no GitHub

1. Verificar se .gitignore esta presente e atualizado
2. Executar: `git status` para confirmar que nenhum arquivo sensivel sera commitado
3. Nunca commitar a pasta rain/, knowledge/, .gemini/ ou qualquer .jsonl
4. Nunca hardcodar tokens no codigo-fonte

### Vetor de ataque mitigado

- **Token no codigo:** .gitignore bloqueia .env e config.json
- **Historico Git:** Nunca commitar credenciais, mesmo temporariamente (git filter-branch nao e 100% confiavel)
- **Extensao comprometida:** chrome.storage.sync e isolado por origem e perfil
- **Man-in-the-middle:** GitHub API usa HTTPS/TLS obrigatorio