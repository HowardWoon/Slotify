#!/bin/bash

echo "========================================================"
echo "          STARTING SLOTIFY PARKING SYSTEM"
echo "========================================================"
echo ""

# Check for Java
if ! command -v java &> /dev/null; then
    echo "[ERROR] Java is not installed or not in your PATH!"
    echo "Please install Java 17 or newer from https://adoptium.net/"
    echo ""
    exit 1
fi

echo "Java found! Downloading dependencies and starting server..."
echo "(This may take a minute on the first run as it downloads Maven and project dependencies)"
echo ""

# Ensure mvnw is executable
chmod +x mvnw

./mvnw spring-boot:run
