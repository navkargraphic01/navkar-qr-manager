@echo off
:: ============================================================
:: NAVKAR QR MANAGER — DATABASE SETUP SCRIPT
:: Run after XAMPP setup script
:: ============================================================
title Navkar QR Manager - Database Import

echo.
echo  ██████████████████████████████████████████
echo   NAVKAR QR MANAGER — DATABASE IMPORT
echo  ██████████████████████████████████████████
echo.

:: Check MySQL
if not exist "C:\xampp\mysql\bin\mysql.exe" (
    echo [ERROR] XAMPP MySQL nahi mila!
    echo Pehle SETUP-XAMPP.bat run karo
    pause
    exit /b 1
)

echo [1/3] MySQL found!
echo.
echo [2/3] Database bana raha hoon...

:: Create database
"C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS navkar_qr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
if %errorlevel% == 0 (
    echo  Database 'navkar_qr' ready!
) else (
    echo [WARNING] Database already exists ya error aaya - continue kar raha hoon...
)

echo.
echo [3/3] SQL file import kar raha hoon...

:: Import SQL
"C:\xampp\mysql\bin\mysql.exe" -u root navkar_qr < "d:\NAVKAR PLYWOOD\navkar-qr-manager\php-backend\database\schema_mysql.sql"

if %errorlevel% == 0 (
    echo.
    echo ============================================
    echo   DATABASE IMPORT SUCCESSFUL!
    echo ============================================
    echo.
    echo   Login credentials:
    echo   Email:    admin@navkarplywood.com
    echo   Password: password
    echo.
    echo   Browser mein test karo:
    echo   http://localhost/phpmyadmin
    echo   Database: navkar_qr
    echo ============================================
) else (
    echo.
    echo [ERROR] Import fail hua!
    echo Manually phpMyAdmin se import karo:
    echo 1. http://localhost/phpmyadmin
    echo 2. navkar_qr database select karo
    echo 3. Import tab - schema_mysql.sql file select karo
)

pause
