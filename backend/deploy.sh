#!/usr/bin/env bash
set -euo pipefail

# ====== 配置 ======
PROJECT_ID="agent-hackathon-463002"
REGION="asia-east1"
SERVICE="lexilight"
REGISTRY="gcr.io"   # 或 Artifact Registry，例如 asia-east1-docker.pkg.dev

# 是否同時打 latest 標籤
PUSH_LATEST=true

# ====== 版本標籤（日期時間 + git 短 SHA）======
STAMP="$(date +%Y%m%d-%H%M)"
SHORT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo nosha)"
TAG="${STAMP}-${SHORT_SHA}"

IMAGE_BASE="${REGISTRY}/${PROJECT_ID}/${SERVICE}"
IMAGE_VERSION="${IMAGE_BASE}:${TAG}"
IMAGE_LATEST="${IMAGE_BASE}:latest"

echo ">>> Using image tag: ${IMAGE_VERSION}"

# ====== 準備 buildx ======
if ! docker buildx version >/dev/null 2>&1; then
  echo ">>> Enabling docker buildx..."
  docker buildx create --use --name "${SERVICE}-builder" >/dev/null
fi

# ====== Build & Push（不在本機留下 image）======
echo ">>> Building and pushing image (linux/amd64)..."
if [ "${PUSH_LATEST}" = "true" ]; then
  docker buildx build \
    --platform linux/amd64 \
    -t "${IMAGE_VERSION}" \
    -t "${IMAGE_LATEST}" \
    --push .
else
  docker buildx build \
    --platform linux/amd64 \
    -t "${IMAGE_VERSION}" \
    --push .
fi

echo "✓ Image pushed:"
echo "  ${IMAGE_VERSION}"
if [ "${PUSH_LATEST}" = "true" ]; then
  echo "  ${IMAGE_LATEST}"
fi

echo
echo "Next steps:"
echo "- Go to GCP Console → Cloud Run → Deploy new revision"
echo "- Choose image: ${IMAGE_VERSION}"
