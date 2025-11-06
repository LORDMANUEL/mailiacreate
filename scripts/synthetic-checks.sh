#!/usr/bin/env bash
set -euo pipefail

# synthetic-checks.sh
# Ejecuta pruebas sintéticas sobre los endpoints principales para validar salud de la suite.

usage() {
  cat <<USAGE
Uso: $0 --host mail.example.com [--skip-tls] [--timeout 10]

Opciones:
  --host FQDN           Host principal para derivar subdominios (mail, chat, meet, cloud, grafana)
  --timeout SEGUNDOS    Timeout de curl en segundos (por defecto 10)
  --skip-tls            Permite certificados auto-firmados (omite verificación TLS)
  --help                Muestra esta ayuda

El script requiere utilidades: curl, jq, openssl, nc.
USAGE
}

HOST=""
TIMEOUT=10
CURL_TLS=(--fail --show-error --silent)

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="$2"
      shift 2
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --skip-tls)
      CURL_TLS+=(--insecure)
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "[synthetic] Opción desconocida: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$HOST" ]]; then
  echo "[synthetic] Debes indicar --host" >&2
  usage
  exit 1
fi

require_binary() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[synthetic] Error: se requiere el binario '$1'" >&2
    exit 2
  fi
}

require_binary curl
require_binary jq
require_binary nc
require_binary openssl

STATUS=0

check_http() {
  local url="$1"
  local name="$2"
  if curl "${CURL_TLS[@]}" --max-time "$TIMEOUT" "$url" >/dev/null; then
    echo "[synthetic] OK  - $name ($url)"
  else
    echo "[synthetic] ERR - $name ($url)" >&2
    STATUS=1
  fi
}

check_matrix_login() {
  local homeserver="https://chat.$HOST"
  if curl "${CURL_TLS[@]}" --max-time "$TIMEOUT" \
    -H 'Content-Type: application/json' \
    -d '{"identifier":{"type":"m.id.user","user":"healthbot"},"password":"dummy","type":"m.login.password"}' \
    "$homeserver/_matrix/client/v3/login" | jq '.errcode' >/dev/null; then
    echo "[synthetic] OK  - Matrix API responde"
  else
    echo "[synthetic] ERR - Matrix API no responde" >&2
    STATUS=1
  fi
}

check_imap() {
  local port=993
  if echo '' | nc -w "$TIMEOUT" "mail.$HOST" "$port" | grep -qi 'ok'; then
    echo "[synthetic] OK  - IMAP banner detectado"
  else
    echo "[synthetic] ERR - IMAP sin respuesta" >&2
    STATUS=1
  fi
}

check_smtp() {
  local port=587
  if echo 'QUIT' | nc -w "$TIMEOUT" "mail.$HOST" "$port" | grep -qi '220'; then
    echo "[synthetic] OK  - SMTP submission responde"
  else
    echo "[synthetic] ERR - SMTP submission sin respuesta" >&2
    STATUS=1
  fi
}

check_tls_cert() {
  local domain="$1"
  local expiry
  expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
  if [[ -z "$expiry" ]]; then
    echo "[synthetic] ERR - No se pudo obtener expiración TLS de $domain" >&2
    STATUS=1
    return
  fi
  local exp_ts
  exp_ts=$(date -d "$expiry" +%s)
  local now_ts
  now_ts=$(date +%s)
  local diff=$(( (exp_ts - now_ts) / 86400 ))
  if (( diff < 15 )); then
    echo "[synthetic] WARN - Certificado de $domain vence en $diff días" >&2
  else
    echo "[synthetic] OK  - Certificado de $domain válido por $diff días"
  fi
}

check_http "https://mail.$HOST" "Webmail"
check_http "https://mail.$HOST/admin" "Panel Admin"
check_http "https://mail.$HOST/it" "Panel IT"
check_http "https://chat.$HOST" "Element"
check_http "https://cloud.$HOST" "Nextcloud"
check_http "https://meet.$HOST" "Jitsi"
check_http "https://grafana.$HOST" "Grafana"

check_matrix_login
check_imap
check_smtp
check_tls_cert "mail.$HOST"
check_tls_cert "chat.$HOST"
check_tls_cert "cloud.$HOST"

exit $STATUS
