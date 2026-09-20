@echo off
echo ============================================================
echo  Antigravity Bridge - Instalador Rapido
echo  Lucas Alves Pereira - Cerebro Virtual v12.1
echo ============================================================
echo.
echo [1] Abrindo Chrome em modo extensoes...
start chrome "chrome://extensions/"
echo.
echo [2] Instrucoes:
echo     1. Ative "Modo do desenvolvedor" (toggle canto superior direito)
echo     2. Clique em "Carregar sem compactacao"
echo     3. Selecione ESTA pasta: %~dp0
echo     4. A extensao "Antigravity Bridge" aparecera na barra do Chrome
echo     5. Clique no icone AG e va em Configuracoes para inserir seu GitHub PAT
echo.
echo [3] Sincronizacao (no PC principal):
echo     pwsh -File "%USERPROFILE%\OneDrive\Sync_Cerebro_Global.ps1" -ModoAntigravityBridge -Setup
echo.
pause