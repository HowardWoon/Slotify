@echo off
echo ========================================================
echo           STARTING SLOTIFY PARKING SYSTEM
echo ========================================================
echo.
echo Checking for Java installation...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Java is not installed or not in your PATH!
    echo Please install Java 17 or newer from https://adoptium.net/
    echo.
    pause
    exit /b
)

echo Java found! Downloading dependencies and starting server...
echo (This may take a minute on the first run as it downloads Maven and project dependencies)
echo.

.\mvnw.cmd spring-boot:run

pause
