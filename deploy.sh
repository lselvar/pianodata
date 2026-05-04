#!/bin/bash
# ============================================================
# PianoRep — Local Deploy Script
# Builds and deploys directly from your machine to GCP.
# Run once: chmod +x deploy.sh
# Usage: ./deploy.sh [backend|frontend|all]
# ============================================================
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID env var}"
REGION="${GCP_REGION:-us-central1}"
REPO="pianorep"
BACKEND_SERVICE="pianorep-backend"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/backend"

# ── Helpers ───────────────────────────────────────────────────────────────────
info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[OK]\033[0m    $*"; }
die()   { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; exit 1; }

check_deps() {
  command -v docker  >/dev/null || die "Docker not running. Open Docker Desktop."
  command -v gcloud  >/dev/null || die "gcloud not found. Install Google Cloud SDK."
  gcloud auth print-access-token >/dev/null 2>&1 || die "Not authenticated. Run: gcloud auth login"
}

# ── Deploy Backend ────────────────────────────────────────────────────────────
deploy_backend() {
  info "Authenticating Docker with Artifact Registry..."
  gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

  info "Building backend Docker image (linux/amd64 for Cloud Run)..."
  docker buildx build --platform linux/amd64 -t "$IMAGE:latest" --push ./backend

  DB_URL="${SPRING_DATASOURCE_URL:-jdbc:mysql://34.136.163.162:3306/pianorep?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true}"

  info "Deploying to Cloud Run..."
  BACKEND_URL=$(gcloud run deploy "$BACKEND_SERVICE" \
    --image="$IMAGE:latest" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=3 \
    --set-env-vars="INCIPIT_IMAGES_PATH=/app/images-bucket/incipits,FRONTEND_URL=${FRONTEND_URL:-https://pianorep.web.app},SPRING_DATASOURCE_URL=${DB_URL}" \
    --set-secrets="DB_USERNAME=pianorep-db-username:latest,DB_PASSWORD=pianorep-db-password:latest,JWT_SECRET=pianorep-jwt-secret:latest,GOOGLE_CLIENT_ID=pianorep-google-client-id:latest,STRIPE_SECRET_KEY=pianorep-stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=pianorep-stripe-webhook-secret:latest,STRIPE_PRICE_ID=pianorep-stripe-price-id:latest" \
    --add-volume="name=images-vol,type=cloud-storage,bucket=pianorep-pianorep-images" \
    --add-volume-mount="volume=images-vol,mount-path=/app/images-bucket" \
    --format="value(status.url)" \
    --project="$PROJECT_ID" 2>&1 | grep -oE 'https://[^ ]+' | head -1 || true)

  # Get URL separately if not captured above
  BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" \
    --region="$REGION" --project="$PROJECT_ID" \
    --format="value(status.url)")

  ok "Backend deployed: $BACKEND_URL"
  echo "$BACKEND_URL" > .backend_url
}

# ── Deploy Frontend ───────────────────────────────────────────────────────────
deploy_frontend() {
  command -v firebase >/dev/null || die "firebase CLI not found. Run: npm i -g firebase-tools"

  BACKEND_URL=""
  if [ -f .backend_url ]; then
    BACKEND_URL=$(cat .backend_url)
    info "Using backend URL: $BACKEND_URL"
  else
    info "No .backend_url found — building frontend without API base URL (uses relative paths)"
  fi

  info "Building frontend..."
  (
    cd frontend
    VITE_API_BASE_URL="$BACKEND_URL" npm run build
  )

  info "Deploying frontend to Firebase Hosting..."
  (cd frontend && firebase deploy --only hosting)

  ok "Frontend deployed."
}

# ── Upload Incipit Images to GCS ──────────────────────────────────────────────
upload_images() {
  BUCKET="${GCP_PROJECT_ID}-pianorep-images"
  info "Uploading incipit images to gs://$BUCKET ..."
  gsutil -m rsync -r ./images "gs://$BUCKET/incipits/"
  ok "Images uploaded to gs://$BUCKET/incipits/"
}

# ── Main ──────────────────────────────────────────────────────────────────────
check_deps

COMMAND="${1:-all}"
case "$COMMAND" in
  backend)  deploy_backend ;;
  frontend) deploy_frontend ;;
  images)   upload_images ;;
  all)
    deploy_backend
    deploy_frontend
    ;;
  *)
    echo "Usage: $0 [backend|frontend|images|all]"
    exit 1
    ;;
esac

ok "Done!"
