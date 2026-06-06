#!/bin/bash
set -e

# Celestial Tic-Tac-Toe macOS App Build Script

APP_NAME="Celestial Tic-Tac-Toe"
APP_DIR="${APP_NAME}.app"
CONTENTS_DIR="${APP_DIR}/Contents"
MAC_OS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"
ICON_SOURCE="/Users/zanetazi/.gemini/antigravity/brain/e0a4ecb6-22a4-4512-bca9-bda1f5524f24/app_icon_1780738219623.png"

echo "=== Building ${APP_NAME}.app ==="

# 1. Clean existing app directory
if [ -d "${APP_DIR}" ]; then
    echo "Cleaning old build directory..."
    rm -rf "${APP_DIR}"
fi

# 2. Re-create structure
echo "Creating application bundle directory structure..."
mkdir -p "${MAC_OS_DIR}"
mkdir -p "${RESOURCES_DIR}"

# 3. Create macOS App Icon (.icns) from generated PNG
if [ -f "${ICON_SOURCE}" ]; then
    echo "Creating AppIcon.icns from generated PNG..."
    ICONSET_DIR="AppIcon.iconset"
    mkdir -p "${ICONSET_DIR}"
    
    # Generate icons of multiple sizes using 'sips' with forced format
    sips -s format png -z 16 16     "${ICON_SOURCE}" --out "${ICONSET_DIR}/icon_16x16.png" > /dev/null 2>&1
    sips -s format png -z 32 32     "${ICON_SOURCE}" --out "${ICONSET_DIR}/icon_16x16@2x.png" > /dev/null 2>&1
    sips -s format png -z 32 32     "${ICON_SOURCE}" --out "${ICONSET_DIR}/icon_32x32.png" > /dev/null 2>&1
    sips -s format png -z 64 64     "${ICON_SOURCE}" --out "${ICONSET_DIR}/icon_32x32@2x.png" > /dev/null 2>&1
    sips -s format png -z 128 128   "${ICON_SOURCE}" --out "${ICONSET_DIR}/icon_128x128.png" > /dev/null 2>&1
    sips -s format png -z 256 256   "${ICON_SOURCE}" --out "${ICONSET_DIR}/icon_128x128@2x.png" > /dev/null 2>&1
    sips -s format png -z 256 256   "${ICON_SOURCE}" --out "${ICONSET_DIR}/icon_256x256.png" > /dev/null 2>&1
    sips -s format png -z 512 512   "${ICON_SOURCE}" --out "${ICONSET_DIR}/icon_256x256@2x.png" > /dev/null 2>&1
    sips -s format png -z 512 512   "${ICON_SOURCE}" --out "${ICONSET_DIR}/icon_512x512.png" > /dev/null 2>&1
    sips -s format png -z 1024 1024 "${ICON_SOURCE}" --out "${ICONSET_DIR}/icon_512x512@2x.png" > /dev/null 2>&1
    
    # Compile iconset into .icns
    iconutil -c icns "${ICONSET_DIR}"
    mv AppIcon.icns "${RESOURCES_DIR}/AppIcon.icns"
    rm -rf "${ICONSET_DIR}"
    echo "AppIcon.icns built successfully."
else
    echo "Warning: Source app icon not found. Skipping icon build."
fi

# 4. Write Info.plist
echo "Generating Info.plist..."
cat <<EOF > "${CONTENTS_DIR}/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>com.celestial.tictactoe</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon.icns</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

# 5. Compile Swift application binary
echo "Compiling Swift app wrapper..."
swiftc -O -o "${MAC_OS_DIR}/${APP_NAME}" main.swift -sdk $(xcrun --show-sdk-path)

# 6. Copy web asset resources into the App Bundle
echo "Copying web client files into Resources..."
cp index.html "${RESOURCES_DIR}/index.html"
cp index.css "${RESOURCES_DIR}/index.css"
cp index.js "${RESOURCES_DIR}/index.js"

echo "=== Build Complete: ${APP_NAME}.app is ready! ==="
