#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "[installer] Please run as root (sudo)." >&2
  exit 1
fi

OS="$(. /etc/os-release && echo "$ID")"
if [[ "$OS" != "debian" && "$OS" != "ubuntu" ]]; then
  echo "[installer] Supported only on Debian/Ubuntu." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "[installer] Installing Docker Engine..."
  apt-get update
  apt-get install -y ca-certificates curl gnupg lsb-release
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/$OS/gpg" | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

if ! command -v git >/dev/null 2>&1; then
  apt-get update
  apt-get install -y git
fi

docker --version

git --version

USER_NAME=${SUDO_USER:-$(logname 2>/dev/null || echo root)}
REPO_DIR=${MAILIACREATE_HOME:-/opt/mailiacreate}
PROJECT_DIR="$REPO_DIR/project"
REPO_URL=${MAILIACREATE_REPO:-https://github.com/<tu-organizacion>/mailiacreate.git}

mkdir -p "$REPO_DIR" "$REPO_DIR/data" "$REPO_DIR/logs"
chown -R "$USER_NAME:$USER_NAME" "$REPO_DIR"

if [[ ! -d "$PROJECT_DIR/.git" ]]; then
  echo "[installer] Cloning project into $PROJECT_DIR"
  sudo -u "$USER_NAME" git clone "$REPO_URL" "$PROJECT_DIR"
else
  echo "[installer] Updating repository in $PROJECT_DIR"
  sudo -u "$USER_NAME" git -C "$PROJECT_DIR" pull --ff-only
fi

cd "$PROJECT_DIR"

if [[ ! -f compose/.env ]]; then
  echo "[installer] Copying default environment file"
  sudo -u "$USER_NAME" cp compose/.env.example compose/.env
fi

echo "[installer] Pulling container images"
docker compose -f compose/docker-compose.prod.yml pull || true

echo "[installer] Starting stack"
docker compose -f compose/docker-compose.prod.yml up -d

echo "[installer] Done. Access your suite at https://mail.example.com"
