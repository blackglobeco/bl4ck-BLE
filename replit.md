# BLE Scanner

## Overview
A web application that works in Google Chrome browser to scan and connect to Bluetooth Low Energy (BLE) devices using the Web Bluetooth API.

## Project Type
Static web application with:
- Frontend: HTML, CSS, JavaScript
- Server: Python HTTP server (for development)

## Project Architecture
- `index.html` - Main application page
- `app.js` - Web Bluetooth API integration and BLE connection logic
- `styles.css` - Application styling
- `manifest.json` - Web app manifest
- `server.py` - Python HTTP server serving static files on port 5000

## Key Features
- Connect to BLE devices directly from Chrome browser
- Scan and display available BLE services and characteristics
- No mobile device required - works entirely in the browser

## Development Setup
- The application runs on port 5000 using a Python HTTP server
- No build process required - pure static files
- Uses Web Bluetooth API (Chrome browser required)

## Recent Changes
- **2024-11-18**: Initial Replit setup
  - Created Python HTTP server with cache-control headers
  - Configured workflow to serve on port 5000
  - Added .gitignore for Python environment
  - Ready for deployment

## Usage Notes
- This application requires Chrome browser with Web Bluetooth support
- Users must grant Bluetooth permissions when connecting to devices
- BLE service UUIDs can be entered in standard or 0x format
