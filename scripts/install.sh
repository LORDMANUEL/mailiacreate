#!/usr/bin/env bash
set -euo pipefail

readonly RESET="\033[0m"
readonly GREEN="\033[1;32m"
readonly BLUE="\033[1;34m"
readonly YELLOW="\033[1;33m"
readonly RED="\033[1;31m"

log() {
  local level="$1"; shift
  local colour="$1"; shift
  printf "%b[%s]%b %s\n" "$colour" "$level" "$RESET" "$*"
}

info() { log INFO "$BLUE" "$@"; }
success() { log OK "$GREEN" "$@"; }
warn() { log WARN "$YELLOW" "$@"; }
error() { log ERROR "$RED" "$@"; }

handle_failure() {
  local exit_code=$?
  local line_no=$1
  error "La instalación falló (código $exit_code) en la línea $line_no."
  warn "Revisa el log anterior; se conservaron archivos temporales para reintentos."
  exit "$exit_code"
}
trap 'handle_failure $LINENO' ERR

if [[ $EUID -ne 0 ]]; then
  error "Ejecute el instalador con privilegios de administrador (sudo)."
  exit 1
fi

OS="$(. /etc/os-release && echo "$ID")"
if [[ "$OS" != "debian" && "$OS" != "ubuntu" ]]; then
  error "Sistema operativo no soportado: $OS. Use Debian o Ubuntu."
  exit 1
fi

retry() {
  local attempts=$1; shift
  local delay=$1; shift
  local cmd=("$@")
  local n=1
  while true; do
    if "${cmd[@]}"; then
      return 0
    fi
    if (( n >= attempts )); then
      return 1
    fi
    warn "Intento $n/${attempts} fallido para: ${cmd[*]}. Reintentando en ${delay}s..."
    sleep "$delay"
    ((n++))
  done
}

ensure_pkg() {
  local pkg="$1"
  if ! dpkg -s "$pkg" >/dev/null 2>&1; then
    info "Instalando paquete requerido: $pkg"
    retry 3 5 apt-get install -y "$pkg"
  fi
}

info "Validando conectividad y repositorios"
retry 3 5 apt-get update >/dev/null

if ! command -v curl >/dev/null 2>&1; then
  ensure_pkg curl
fi

if ! command -v gpg >/dev/null 2>&1; then
  ensure_pkg gnupg
fi

if ! command -v docker >/dev/null 2>&1; then
  info "Instalando Docker Engine y dependencias"
  ensure_pkg ca-certificates
  ensure_pkg lsb-release
  install -m 0755 -d /etc/apt/keyrings
  if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
    retry 3 5 curl -fsSL "https://download.docker.com/linux/$OS/gpg" | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  fi
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
  retry 3 5 apt-get update
  retry 3 5 apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
  info "Docker ya está instalado"
fi

if ! systemctl is-active --quiet docker; then
  warn "Docker no se encuentra activo; intentando iniciar servicio"
  systemctl enable --now docker
fi

if ! command -v git >/dev/null 2>&1; then
  info "Instalando Git"
  retry 3 5 apt-get install -y git
else
  info "Git ya está instalado"
fi

docker --version >/dev/null && success "Docker operativo"
git --version >/dev/null && success "Git operativo"

USER_NAME=${SUDO_USER:-$(logname 2>/dev/null || echo root)}
REPO_DIR=${MAILIACREATE_HOME:-/opt/mailiacreate}
PROJECT_DIR="$REPO_DIR/project"
REPO_URL=${MAILIACREATE_REPO:-https://github.com/<tu-organizacion>/mailiacreate.git}

info "Preparando directorios en $REPO_DIR"
mkdir -p "$REPO_DIR" "$REPO_DIR/data" "$REPO_DIR/logs"
chown -R "$USER_NAME:$USER_NAME" "$REPO_DIR"

if [[ ! -d "$PROJECT_DIR/.git" ]]; then
  info "Clonando repositorio en $PROJECT_DIR"
  sudo -u "$USER_NAME" git clone "$REPO_URL" "$PROJECT_DIR"
else
  info "Actualizando repositorio existente"
  sudo -u "$USER_NAME" git -C "$PROJECT_DIR" pull --ff-only
fi

cd "$PROJECT_DIR"

if [[ ! -f compose/.env ]]; then
  info "Creando archivo compose/.env a partir del ejemplo"
  sudo -u "$USER_NAME" cp compose/.env.example compose/.env
else
  warn "Se mantiene configuración existente en compose/.env"
fi

info "Verificando espacio libre (mínimo 5GB recomendados)"
AVAILABLE=$(df -Pm "$REPO_DIR" | awk 'NR==2 {print $4}')
if (( AVAILABLE < 5120 )); then
  warn "Espacio disponible reducido (${AVAILABLE} MB). Considere ampliar antes de producción."
fi

info "Descargando imágenes de contenedores"
if ! docker compose -f compose/docker-compose.prod.yml pull; then
  warn "No se pudieron pre-descargar todas las imágenes. Continuando con el despliegue; Docker las obtendrá al iniciar."
fi

info "Levantando la plataforma"
docker compose -f compose/docker-compose.prod.yml up -d

info "Verificando estado de los servicios"
docker compose -f compose/docker-compose.prod.yml ps

success "Instalación completada. Accede vía https://mail.<tu-dominio>/"
info "Ejecuta ./scripts/hardening-check.sh tras personalizar compose/.env para validar seguridad."
