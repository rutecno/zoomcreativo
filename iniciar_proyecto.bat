@echo off
REM Asegurar que el script se ejecute en la carpeta del proyecto
cd /d "%~dp0"

title Zoom Creativo - Servidor de Desarrollo
color 0E

echo ===================================================
echo             PORTAFOLIO ZOOM CREATIVO
echo     Comunidad de Fotografia Movil (WhatsApp)
echo ===================================================
echo.

REM Comprobar si existe node_modules
if not exist "node_modules\" (
    echo [INFO] No se encontro la carpeta node_modules. Instalando dependencias...
    echo Esto puede tomar un momento...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Hubo un problema al instalar las dependencias.
        echo Asegurate de tener Node.js instalado y conexion a internet.
        pause
        exit /b 1
    )
    echo [INFO] Dependencias instaladas con exito.
    echo.
)

:: Open browser automatically
echo [INFO] Iniciando el servidor y abriendo el navegador en la app...
start http://localhost:5173/zoomcreativo/

:: Start dev server
call npm run dev

pause
