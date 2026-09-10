#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo '========================================='
echo 'SAIL Material Management - Render Build'
echo '========================================='

echo '[1/3] Building React Frontend...'
cd frontend
npm install
npm run build
cd ..

echo '[2/3] Copying Built Frontend to Backend Static Directory...'
mkdir -p backend/static
cp -r frontend/dist/* backend/static/

echo '[3/3] Installing Python Dependencies...'
pip install --upgrade pip
pip install -r requirements.txt

echo '========================================='
echo 'Build Successful!'
echo '========================================='
