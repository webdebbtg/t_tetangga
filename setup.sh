#!/bin/bash
# ====================================================
# Tengok Tetangga — Setup & Run Script
# ====================================================

set -e

echo ""
echo "🏘️  Tengok Tetangga — Full Stack Setup"
echo "========================================"

# ── BACKEND SETUP ──────────────────────────────────────
echo ""
echo "📦 [1/5] Installing Backend Dependencies..."
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "  ✅ .env file created from .env.example"
fi
composer install --no-dev --optimize-autoloader 2>/dev/null || composer install
php artisan key:generate --no-interaction 2>/dev/null || true
php artisan jwt:secret --no-interaction 2>/dev/null || true
echo "  ✅ Backend dependencies installed"

# ── DATABASE MIGRATE & SEED ───────────────────────────
echo ""
echo "🗄️  [2/5] Running Migrations & Seeding Database..."
php artisan migrate:fresh --seed --no-interaction 2>/dev/null || \
  php artisan migrate --no-interaction && php artisan db:seed --no-interaction
echo "  ✅ Database migrated and seeded"

# ── STORAGE LINK ─────────────────────────────────────
echo ""
echo "🔗 [3/5] Creating Storage Link..."
php artisan storage:link --no-interaction 2>/dev/null || true
echo "  ✅ Storage link created"

# ── AI SERVICE ────────────────────────────────────────
echo ""
echo "🤖 [4/5] Setting up AI Service..."
cd ai-service
if [ ! -f ".env" ]; then
  echo "OPENAI_API_KEY=" > .env
  echo "GROQ_API_KEY=" >> .env
  echo "LLM_MODEL=gpt-4o-mini" >> .env
fi
pip install -r requirements.txt -q
echo "  ✅ AI service dependencies installed"
cd ..

# ── FRONTEND SETUP ────────────────────────────────────
echo ""
echo "🎨 [5/5] Installing Frontend Dependencies..."
cd frontend
if [ ! -f ".env.local" ]; then
  echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
  echo "NEXT_PUBLIC_APP_NAME=Tengok Tetangga" >> .env.local
fi
npm install --silent
echo "  ✅ Frontend dependencies installed"
cd ..

echo ""
echo "🎉 Setup Complete!"
echo "========================================"
echo ""
echo "🚀 To start all services:"
echo ""
echo "  Terminal 1 — Backend:"
echo "    php artisan serve --port=8000"
echo ""
echo "  Terminal 2 — Queue Worker:"
echo "    php artisan queue:work"
echo ""
echo "  Terminal 3 — AI Service:"
echo "    cd ai-service && uvicorn main:app --reload --port=8001"
echo ""
echo "  Terminal 4 — Frontend:"
echo "    cd frontend && npm run dev"
echo ""
echo "📋 Default Credentials:"
echo "  Admin:  admin@tengoktetangga.id / password123"
echo "  OPD:    dinsos@tengoktetangga.id / password123"
echo "  Guru:   guru@tengoktetangga.id / password123"
echo ""
echo "🐳 OR run with Docker:"
echo "  docker-compose up --build -d"
echo ""
