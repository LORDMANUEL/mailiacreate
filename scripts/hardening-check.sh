#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
CI_MODE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ci)
      CI_MODE=1
      shift
      ;;
    --help|-h)
      cat <<USAGE
Uso: $0 [--ci]
  --ci    Usa compose/.env.example si compose/.env no está disponible.
USAGE
      exit 0
      ;;
    *)
      echo "[hardening] Opción desconocida: $1" >&2
      exit 1
      ;;
  esac
done

ENV_FILE="${PROJECT_ROOT}/compose/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  if [[ $CI_MODE -eq 1 ]]; then
    ENV_FILE="${PROJECT_ROOT}/compose/.env.example"
  else
    echo "[hardening] Archivo compose/.env no encontrado. Copia compose/.env.example y personalízalo." >&2
    exit 1
  fi
fi

CADDY_FILE="${PROJECT_ROOT}/config/caddy/Caddyfile"

check_value() {
  local key=$1
  local disallowed=$2
  local value
  value=$(grep -E "^${key}=" "$ENV_FILE" | tail -n1 | cut -d'=' -f2-)
  if [[ -z "$value" ]]; then
    echo "[hardening] Variable ${key} no configurada en ${ENV_FILE#$PROJECT_ROOT/}" >&2
    return 1
  fi
  if [[ "$value" == "$disallowed" ]]; then
    echo "[hardening] Variable ${key} conserva el valor inseguro '${disallowed}'." >&2
    return 1
  fi
  return 0
}

FAILED=0

for pair in \
  "KEYCLOAK_ADMIN_PASSWORD:change_me" \
  "NEXTCLOUD_ADMIN_PASSWORD:change_me" \
  "MINIO_ROOT_PASSWORD:change_me" \
  "SEND_ROUTER_WEBHOOK_TOKEN:replace_me" \
  "RESTIC_PASSWORD:strong_restic_password"; do
  IFS=':' read -r var disallowed <<<"$pair"
  if ! check_value "$var" "$disallowed"; then
    FAILED=1
  fi
  unset IFS
done

if ! grep -q "header-security" "$CADDY_FILE"; then
  echo "[hardening] Falta el bloque header-security en config/caddy/Caddyfile." >&2
  FAILED=1
fi

if [[ $FAILED -eq 1 ]]; then
  echo "[hardening] Revisa las advertencias anteriores antes de desplegar." >&2
  exit 2
fi

echo "[hardening] Configuración validada. Puedes continuar con el despliegue."
