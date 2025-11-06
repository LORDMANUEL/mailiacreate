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

prompt_with_default() {
  local message="$1"
  local default="$2"
  local response
  read -r -p "$message [$default]: " response || true
  if [[ -z "$response" ]]; then
    echo "$default"
  else
    echo "$response"
  fi
}

prompt_yes_no() {
  local message="$1"
  local default_answer="${2:-n}"
  local prompt="[y/N]"
  if [[ "$default_answer" =~ ^([Yy]|yes|YES|true|TRUE)$ ]]; then
    prompt="[Y/n]"
    default_answer="y"
  else
    default_answer="n"
  fi
  local response=""
  read -r -p "$message $prompt: " response || true
  if [[ -z "$response" ]]; then
    response="$default_answer"
  fi
  if [[ "$response" =~ ^([Yy]|yes|YES|true|TRUE)$ ]]; then
    return 0
  fi
  return 1
}

set_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"
  local escaped="${value//\\/\\\\}"
  escaped="${escaped//&/\\&}"
  escaped="${escaped//\//\\/}"
  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${escaped}|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >>"$file"
  fi
}

update_file_pattern() {
  local file="$1"
  local pattern="$2"
  local replacement="$3"
  perl -0pi -e "s|$pattern|$replacement|gm" "$file"
}

strip_port() {
  local value="$1"
  if [[ "$value" == *:* ]]; then
    echo "${value%%:*}"
  else
    echo "$value"
  fi
}

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
REPO_URL=${MAILIACREATE_REPO:-https://github.com/mailiacreate/mailiacreate.git}

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

ENV_FILE="compose/.env"
source "$ENV_FILE"

info "Selecciona el tipo de despliegue"
echo "  1) IP interna (laboratorio sin TLS)"
echo "  2) IP pública (sin dominios ni TLS automático)"
echo "  3) Dominios (producción con TLS de Let's Encrypt)"

DEPLOYMENT_CHOICE="${DEPLOYMENT_PROFILE:-}"
while true; do
  if [[ -z "$DEPLOYMENT_CHOICE" ]]; then
    read -r -p "Opción [3]: " DEPLOYMENT_CHOICE || true
  fi
  case "${DEPLOYMENT_CHOICE:-3}" in
    1|"internal"|"internal_ip"|"local")
      DEPLOYMENT_CHOICE="internal"
      LOCAL_MODE_VALUE=true
      PROFILE_VALUE="internal_ip"
      PROMPT_LABEL="interna"
      break
      ;;
    2|"public"|"public_ip"|"ip")
      DEPLOYMENT_CHOICE="public"
      LOCAL_MODE_VALUE=true
      PROFILE_VALUE="public_ip"
      PROMPT_LABEL="pública"
      break
      ;;
    3|"domain"|"dominio"|"")
      DEPLOYMENT_CHOICE="domain"
      LOCAL_MODE_VALUE=false
      PROFILE_VALUE="domain"
      PROMPT_LABEL=""
      break
      ;;
    *)
      warn "Opción inválida. Selecciona 1, 2 o 3."
      DEPLOYMENT_CHOICE=""
      ;;
  esac
done

if [[ "$LOCAL_MODE_VALUE" == true ]]; then
  LOCAL_IP_SUGGESTED=$(hostname -I 2>/dev/null | awk '{print $1}' | tr -d '\n')
  if [[ -z "$LOCAL_IP_SUGGESTED" ]]; then
    LOCAL_IP_SUGGESTED="127.0.0.1"
  fi
  LOCAL_IP_VALUE=$(prompt_with_default "Introduce la IP ${PROMPT_LABEL:-del servidor}" "${LOCAL_IP:-$LOCAL_IP_SUGGESTED}")
  PUBLIC_SCHEME_VALUE="http"
else
  LOCAL_IP_VALUE=""
  PUBLIC_SCHEME_VALUE="https"
fi

set_env_var "$ENV_FILE" "LOCAL_MODE" "$LOCAL_MODE_VALUE"
set_env_var "$ENV_FILE" "LOCAL_IP" "$LOCAL_IP_VALUE"
set_env_var "$ENV_FILE" "PUBLIC_SCHEME" "$PUBLIC_SCHEME_VALUE"
set_env_var "$ENV_FILE" "DEPLOYMENT_PROFILE" "$PROFILE_VALUE"

source "$ENV_FILE"

info "Configurando nombres de servicio"
if [[ "$LOCAL_MODE" == "true" ]]; then
  MAIL_DOMAIN_VALUE="mailiacreate.local"
  MAIL_FQDN_VALUE="${LOCAL_IP_VALUE}:8080"
  SSO_FQDN_VALUE="${LOCAL_IP_VALUE}:8081"
  CHAT_FQDN_VALUE="${LOCAL_IP_VALUE}:8082"
  MATRIX_FQDN_VALUE="${LOCAL_IP_VALUE}:8083"
  MEET_FQDN_VALUE="${LOCAL_IP_VALUE}:8084"
  CLOUD_FQDN_VALUE="${LOCAL_IP_VALUE}:8085"
  GRAFANA_FQDN_VALUE="${LOCAL_IP_VALUE}:8086"
  ADMIN_EMAIL_VALUE="admin@${MAIL_DOMAIN_VALUE}"
else
  MAIL_DOMAIN_DEFAULT="${MAIL_DOMAIN:-example.com}"
  MAIL_DOMAIN_VALUE=$(prompt_with_default "Dominio principal de correo" "$MAIL_DOMAIN_DEFAULT")
  MAIL_FQDN_VALUE="mail.${MAIL_DOMAIN_VALUE}"
  SSO_FQDN_VALUE="sso.${MAIL_DOMAIN_VALUE}"
  CHAT_FQDN_VALUE="chat.${MAIL_DOMAIN_VALUE}"
  MATRIX_FQDN_VALUE="matrix.${MAIL_DOMAIN_VALUE}"
  MEET_FQDN_VALUE="meet.${MAIL_DOMAIN_VALUE}"
  CLOUD_FQDN_VALUE="cloud.${MAIL_DOMAIN_VALUE}"
  GRAFANA_FQDN_VALUE="grafana.${MAIL_DOMAIN_VALUE}"
  ADMIN_EMAIL_VALUE="admin@${MAIL_DOMAIN_VALUE}"
fi

set_env_var "$ENV_FILE" "MAIL_DOMAIN" "$MAIL_DOMAIN_VALUE"
set_env_var "$ENV_FILE" "MAIL_FQDN" "$MAIL_FQDN_VALUE"
set_env_var "$ENV_FILE" "SSO_FQDN" "$SSO_FQDN_VALUE"
set_env_var "$ENV_FILE" "CHAT_FQDN" "$CHAT_FQDN_VALUE"
set_env_var "$ENV_FILE" "MATRIX_FQDN" "$MATRIX_FQDN_VALUE"
set_env_var "$ENV_FILE" "MEET_FQDN" "$MEET_FQDN_VALUE"
set_env_var "$ENV_FILE" "CLOUD_FQDN" "$CLOUD_FQDN_VALUE"
set_env_var "$ENV_FILE" "GRAFANA_FQDN" "$GRAFANA_FQDN_VALUE"
set_env_var "$ENV_FILE" "ADMIN_EMAIL" "$ADMIN_EMAIL_VALUE"

source "$ENV_FILE"

info "Resumen de configuración"
if [[ "$LOCAL_MODE" == "true" ]]; then
  info "  Tipo: ${PROFILE_VALUE//_/ }"
  info "  IP: $LOCAL_IP"
else
  info "  Tipo: dominios"
  info "  Dominio base: $MAIL_DOMAIN"
fi
info "  Webmail: $MAIL_FQDN"
info "  SSO: $SSO_FQDN"
info "  Chat: $CHAT_FQDN"
info "  Jitsi: $MEET_FQDN"
info "  Nextcloud: $CLOUD_FQDN"
info "  Grafana: $GRAFANA_FQDN"

MAIL_HOST_ONLY=$(strip_port "$MAIL_FQDN")
MATRIX_HOST_ONLY=$(strip_port "$MATRIX_FQDN")
MATRIX_SERVER_NAME="$MATRIX_HOST_ONLY"
if [[ "$LOCAL_MODE" == "true" ]]; then
  MATRIX_SERVER_NAME="matrix.$MAIL_DOMAIN"
fi

info "Actualizando configuración de Stalwart y Matrix"
update_file_pattern "config/stalwart/config.toml" 'hostname = "[^"]+"' "hostname = \"$MAIL_HOST_ONLY\""
update_file_pattern "config/stalwart/config.toml" 'domain = "[^"]+"' "domain = \"$MAIL_DOMAIN\""
update_file_pattern "config/synapse/homeserver.yaml" '^server_name: .*$' "server_name: $MATRIX_SERVER_NAME"
update_file_pattern "config/synapse/homeserver.yaml" '^public_baseurl: .*$' "public_baseurl: ${PUBLIC_SCHEME}://$CHAT_FQDN/"
update_file_pattern "config/synapse/homeserver.yaml" '    - https?://[^ ]*' "    - ${PUBLIC_SCHEME}://$CHAT_FQDN"
update_file_pattern "config/synapse/homeserver.yaml" 'issuer: https?://[^ ]*/realms/[^ ]*' "issuer: ${PUBLIC_SCHEME}://$SSO_FQDN/realms/$KEYCLOAK_REALM"
if [[ -n "${MATRIX_REGISTRATION_SHARED_SECRET:-}" ]]; then
  update_file_pattern "config/synapse/homeserver.yaml" 'registration_shared_secret: "[^"]+"' "registration_shared_secret: \"$MATRIX_REGISTRATION_SHARED_SECRET\""
fi

info "Verificando espacio libre (mínimo 5GB recomendados)"
AVAILABLE=$(df -Pm "$REPO_DIR" | awk 'NR==2 {print $4}')
if (( AVAILABLE < 5120 )); then
  warn "Espacio disponible reducido (${AVAILABLE} MB). Considere ampliar antes de producción."
fi

COMPOSE_ARGS=("-f" "compose/docker-compose.prod.yml")
if [[ "$LOCAL_MODE" == "true" ]]; then
  COMPOSE_ARGS+=("-f" "compose/docker-compose.local.yml")
fi

info "Descargando imágenes de contenedores"
if ! docker compose "${COMPOSE_ARGS[@]}" pull; then
  warn "No se pudieron pre-descargar todas las imágenes. Continuando con el despliegue; Docker las obtendrá al iniciar."
fi

chown -R "$USER_NAME:$USER_NAME" "$PROJECT_DIR"

info "Levantando la plataforma"
docker compose "${COMPOSE_ARGS[@]}" up -d

info "Verificando estado de los servicios"
docker compose "${COMPOSE_ARGS[@]}" ps

if [[ "$LOCAL_MODE" == "true" ]]; then
  success "Instalación completada en modo IP (${PROFILE_VALUE//_/ }). Accede vía http://${MAIL_FQDN}/"
  info "Servicios clave: Webmail ${MAIL_FQDN}, SSO ${SSO_FQDN}, Chat ${CHAT_FQDN}, Nextcloud ${CLOUD_FQDN}, Grafana ${GRAFANA_FQDN}."
else
  success "Instalación completada. Accede vía https://${MAIL_FQDN}/"
  info "Servicios clave: Webmail ${MAIL_FQDN}, SSO ${SSO_FQDN}, Chat ${CHAT_FQDN}, Nextcloud ${CLOUD_FQDN}, Grafana ${GRAFANA_FQDN}."
fi
info "Ejecuta ./scripts/hardening-check.sh tras personalizar compose/.env para validar seguridad."
