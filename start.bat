@echo off
title DropX AI - Serveur Local
color 0b

echo ===================================================
echo        LANCEMENT DE LA PLATEFORME DROPX AI
echo ===================================================
echo.
echo Démarrage du serveur Next.js en cours...
echo Une fois démarré, ouvrez http://localhost:3000 dans votre navigateur.
echo Ne fermez pas cette fenetre tant que vous utilisez le site.
echo.

cd /d "%~dp0"
call npm run dev

pause
