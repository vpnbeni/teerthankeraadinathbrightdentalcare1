@echo off
REM Production Build Script for Teerthanker Dental Care
REM This script builds both admin and client with production environment variables

echo [INFO] Starting production build process...

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

echo [INFO] Project root: %PROJECT_ROOT%

REM Build Admin Dashboard
echo [INFO] Building admin dashboard...
cd /d "%PROJECT_ROOT%\admin"
call npm run build:prod
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Admin dashboard build failed
    exit /b 1
)
echo [SUCCESS] Admin dashboard built successfully

REM Build Client Portal
echo [INFO] Building client portal...
cd /d "%PROJECT_ROOT%\client"
call npm run build:prod
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Client portal build failed
    exit /b 1
)
echo [SUCCESS] Client portal built successfully

echo [SUCCESS] All applications built successfully for production!
echo [INFO] Build outputs:
echo [INFO]   • Admin: %PROJECT_ROOT%\admin\dist
echo [INFO]   • Client: %PROJECT_ROOT%\client\dist

REM Verify API URLs in built files
echo [INFO] Verifying API URLs in built files...

REM Check admin build
findstr /s "teerthanker-server.vercel.app" "%PROJECT_ROOT%\admin\dist\assets\*.js" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Admin build contains correct API URL
) else (
    echo [WARNING] Admin build may not contain correct API URL
)

REM Check client build
findstr /s "teerthanker-server.vercel.app" "%PROJECT_ROOT%\client\dist\assets\*.js" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Client build contains correct API URL
) else (
    echo [WARNING] Client build may not contain correct API URL
)

echo [INFO] Production build process completed!
echo [INFO] You can now deploy the dist folders to your hosting provider
echo [INFO] 
echo [INFO] To deploy to Hostinger:
echo [INFO] 1. Upload the admin/dist folder contents to your admin subdomain
echo [INFO] 2. Upload the client/dist folder contents to your client subdomain
echo [INFO] 3. Ensure your server is running on https://teerthanker-server.vercel.app
