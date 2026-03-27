#!/bin/bash
# ============================================================
# PianoRep — One-time GCP Setup Script
# Run this ONCE to configure your GCP project.
# Usage: GCP_PROJECT_ID=your-project-id ./setup-gcp.sh
# ============================================================
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID env var}"
REGION="${GCP_REGION:-us-central1}"
REPO="pianorep"

info() { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()   { echo -e "\033[1;32m[OK]\033[0m    $*"; }
ask()  { read -rp "$(echo -e "\033[1;33m[INPUT]\033[0m $* ")" REPLY; echo "$REPLY"; }

# ── Set active project ────────────────────────────────────────────────────────
info "Setting active project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# ── Enable required APIs ──────────────────────────────────────────────────────
info "Enabling GCP APIs (this may take a minute)..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  firebase.googleapis.com \
  --project="$PROJECT_ID"
ok "APIs enabled."

# ── Create Artifact Registry repository ──────────────────────────────────────
info "Creating Artifact Registry repository '$REPO'..."
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="PianoRep container images" \
  --project="$PROJECT_ID" 2>/dev/null || ok "Repository '$REPO' already exists."

# ── Create GCS bucket for incipit images ─────────────────────────────────────
BUCKET="${PROJECT_ID}-pianorep-images"
info "Creating GCS bucket gs://$BUCKET ..."
gcloud storage buckets create "gs://$BUCKET" \
  --location="$REGION" \
  --uniform-bucket-level-access \
  --project="$PROJECT_ID" 2>/dev/null || ok "Bucket already exists."

# ── Create secrets in Secret Manager ─────────────────────────────────────────
info "Creating secrets in Secret Manager..."

create_secret() {
  local name="$1"
  local prompt="$2"
  if gcloud secrets describe "$name" --project="$PROJECT_ID" >/dev/null 2>&1; then
    ok "Secret '$name' already exists — skipping."
    return
  fi
  local value
  value=$(ask "$prompt:")
  echo -n "$value" | gcloud secrets create "$name" \
    --data-file=- \
    --project="$PROJECT_ID"
  ok "Secret '$name' created."
}

create_secret "pianorep-db-username"        "MySQL username (e.g. pianorep)"
create_secret "pianorep-db-password"        "MySQL password"
create_secret "pianorep-jwt-secret"         "JWT secret (256-bit random string)"
create_secret "pianorep-google-client-id"   "Google OAuth Client ID"
create_secret "pianorep-stripe-secret-key"  "Stripe secret key (sk_live_... or sk_test_...)"
create_secret "pianorep-stripe-webhook-secret" "Stripe webhook signing secret (whsec_...)"
create_secret "pianorep-stripe-price-id"    "Stripe Price ID (price_...)"
create_secret "pianorep-firebase-token"     "Firebase CI token (run: firebase login:ci)"

# ── Grant Cloud Run access to secrets ────────────────────────────────────────
info "Granting Cloud Run service account access to secrets..."
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
CR_SA="service-${PROJECT_NUMBER}@serverless-robot-prod.iam.gserviceaccount.com"
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

for secret in \
  pianorep-db-username pianorep-db-password pianorep-jwt-secret \
  pianorep-google-client-id pianorep-stripe-secret-key \
  pianorep-stripe-webhook-secret pianorep-stripe-price-id; do
  gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:$CR_SA" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" --quiet 2>/dev/null
done

# Cloud Build needs firebase token secret
gcloud secrets add-iam-policy-binding "pianorep-firebase-token" \
  --member="serviceAccount:$CB_SA" \
  --role="roles/secretmanager.secretAccessor" \
  --project="$PROJECT_ID" --quiet 2>/dev/null

ok "IAM bindings set."

# ── Cloud Build permissions ───────────────────────────────────────────────────
info "Granting Cloud Build permission to deploy Cloud Run..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$CB_SA" \
  --role="roles/run.admin" --quiet 2>/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$CB_SA" \
  --role="roles/iam.serviceAccountUser" --quiet 2>/dev/null
ok "Cloud Build permissions set."

# ── Cloud SQL reminder ────────────────────────────────────────────────────────
echo ""
echo "──────────────────────────────────────────────────────────────"
echo " NEXT STEPS (manual, one-time):"
echo ""
echo " 1. Create Cloud SQL MySQL 8.0 instance:"
echo "    gcloud sql instances create pianorep-db \\"
echo "      --database-version=MYSQL_8_0 \\"
echo "      --tier=db-f1-micro \\"
echo "      --region=$REGION \\"
echo "      --root-password=<your-root-password>"
echo ""
echo " 2. Create the database and user:"
echo "    gcloud sql databases create pianorep --instance=pianorep-db"
echo "    gcloud sql users create pianorep --instance=pianorep-db --password=<db-password>"
echo ""
echo " 3. Import your SQL dump:"
echo "    gcloud sql import sql pianorep-db gs://$BUCKET/out.sql \\"
echo "      --database=pianorep"
echo "    (first: gsutil cp out.sql gs://$BUCKET/)"
echo ""
echo " 4. Upload incipit images:"
echo "    ./deploy.sh images"
echo ""
echo " 5. Initialize Firebase Hosting:"
echo "    cd frontend && firebase init hosting"
echo "    (choose existing project, set public dir to 'dist', SPA: yes)"
echo ""
echo " 6. Deploy everything:"
echo "    GCP_PROJECT_ID=$PROJECT_ID ./deploy.sh all"
echo "──────────────────────────────────────────────────────────────"
ok "GCP setup complete!"
