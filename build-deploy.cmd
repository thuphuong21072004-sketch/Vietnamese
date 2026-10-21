@echo off
rem Build web cu + giao dien dien thoai roi dua vao backend (xem build-deploy.ps1)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-deploy.ps1"
