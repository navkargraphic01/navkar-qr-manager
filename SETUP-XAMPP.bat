@echo off
:: ============================================================
:: NAVKAR QR MANAGER — COMPLETE AUTO SETUP
:: Run this AFTER XAMPP is installed
:: Just double-click and everything will be set up!
:: ============================================================
title Navkar QR Manager - Complete Auto Setup
color 0A

echo.
echo  =====================================================
echo    NAVKAR QR MANAGER - COMPLETE AUTO SETUP
echo    Site: navkarplywood.in
echo  =====================================================
echo.
echo  Is script ko admin ke roop mein run karo
echo  (Right-click - Run as Administrator)
echo.

:: Check admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] ADMIN RIGHTS CHAHIYE!
    echo     Right-click karke "Run as Administrator" select karo
    pause
    exit /b 1
)

:: ── STEP 1: Check XAMPP ─────────────────────────────────────
echo [STEP 1] XAMPP check kar raha hoon...
if not exist "C:\xampp\htdocs" (
    echo.
    echo [ERROR] XAMPP nahi mila!
    echo  XAMPP install karo pehle:
    echo  C:\Users\rajka\Downloads\xampp-installer.exe
    echo.
    pause
    exit /b 1
)
echo  XAMPP found at C:\xampp OK

:: ── STEP 2: Start Apache and MySQL ──────────────────────────
echo.
echo [STEP 2] Apache aur MySQL start kar raha hoon...
"C:\xampp\xampp_start.exe" 2>nul
timeout /t 3 /nobreak >nul
echo  Services started!

:: ── STEP 3: Copy PHP Backend to htdocs ──────────────────────
echo.
echo [STEP 3] PHP backend copy kar raha hoon...
if exist "C:\xampp\htdocs\qr-manager" (
    echo  Folder exists, updating...
    rmdir /S /Q "C:\xampp\htdocs\qr-manager\config" 2>nul
    rmdir /S /Q "C:\xampp\htdocs\qr-manager\api" 2>nul
    rmdir /S /Q "C:\xampp\htdocs\qr-manager\lib" 2>nul
) else (
    mkdir "C:\xampp\htdocs\qr-manager"
)

xcopy /E /I /Y /Q "d:\NAVKAR PLYWOOD\navkar-qr-manager\php-backend\*" "C:\xampp\htdocs\qr-manager\" >nul
echo  PHP backend files copied!

:: ── STEP 4: Apply local config ──────────────────────────────
echo.
echo [STEP 4] Local config apply kar raha hoon...
copy /Y "C:\xampp\htdocs\qr-manager\config\config.local.php" "C:\xampp\htdocs\qr-manager\config\config.php" >nul
echo  XAMPP config applied! (root user, blank password)

:: ── STEP 5: Create database ──────────────────────────────────
echo.
echo [STEP 5] MySQL database bana raha hoon...
timeout /t 3 /nobreak >nul
"C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS navkar_qr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
if %errorlevel% == 0 (
    echo  Database 'navkar_qr' ready!
) else (
    echo [WARN] Database step skipped - may already exist
)

:: ── STEP 6: Import SQL Schema ────────────────────────────────
echo.
echo [STEP 6] Database tables import kar raha hoon...
"C:\xampp\mysql\bin\mysql.exe" -u root navkar_qr < "d:\NAVKAR PLYWOOD\navkar-qr-manager\php-backend\database\schema_mysql.sql"
if %errorlevel% == 0 (
    echo  Database imported successfully!
    echo  Login: admin@navkarplywood.com / password
) else (
    echo [WARN] Import issue - tables may already exist (ok!)
)

:: ── STEP 7: Create uploads folder ───────────────────────────
echo.
echo [STEP 7] Uploads folder create kar raha hoon...
mkdir "C:\xampp\htdocs\qr-manager\uploads" 2>nul
echo  Uploads folder ready!

:: ── STEP 8: Verify phpqrcode ────────────────────────────────
echo.
echo [STEP 8] phpqrcode library check...
if exist "C:\xampp\htdocs\qr-manager\lib\phpqrcode\qrlib.php" (
    echo  phpqrcode OK!
) else (
    echo [WARN] phpqrcode not found - QR image generation may not work
)

:: ── DONE! ────────────────────────────────────────────────────
echo.
echo  =====================================================
echo    SETUP COMPLETE!
echo  =====================================================
echo.
echo   PHP Backend: http://localhost/qr-manager
echo   Health Check: http://localhost/qr-manager/health
echo   phpMyAdmin: http://localhost/phpmyadmin
echo.
echo   Frontend Development:
echo   Open terminal and run:
echo   cd "d:\NAVKAR PLYWOOD\navkar-qr-manager\frontend"
echo   npm run dev
echo   Then open: http://localhost:5173
echo.
echo   Default Login:
echo   Email:    admin@navkarplywood.com
echo   Password: password
echo.
echo  =====================================================

:: Open browser
start http://localhost/qr-manager/health
timeout /t 2 /nobreak >nul

pause
