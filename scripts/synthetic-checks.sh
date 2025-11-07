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
  --json                Devuelve resultado en formato JSON (para automatización)
  --help                Muestra esta ayuda

El script requiere utilidades: curl, jq, openssl, nc.
USAGE
}

HOST=""
TIMEOUT=10
CURL_TLS=(--fail --show-error --silent)
OUTPUT_FORMAT="text"
RESULTS=()

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
    --json)
      OUTPUT_FORMAT="json"
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

record_result() {
  local status="$1"
  local name="$2"
  local target="$3"
  local message="$4"
  local duration_ms="$5"
  local entry
  entry=$(jq -n --arg status "$status" --arg name "$name" --arg target "$target" --arg message "$message" --arg duration "$duration_ms" \
    '{status:$status,name:$name,target:$target,message:$message,durationMs:($duration|tonumber)}')
  RESULTS+=("$entry")
  if [[ "$OUTPUT_FORMAT" == "text" ]]; then
    if [[ "$status" == "ok" ]]; then
      echo "[synthetic] OK  - $message (${duration_ms}ms)"
    elif [[ "$status" == "warn" ]]; then
      echo "[synthetic] WARN - $message (${duration_ms}ms)"
    else
      echo "[synthetic] ERR - $message (${duration_ms}ms)" >&2
    fi
  fi
}

check_http() {
  local url="$1"
  local name="$2"
  local start end duration
  start=$(date +%s%3N)
  if curl "${CURL_TLS[@]}" --max-time "$TIMEOUT" "$url" >/dev/null; then
    end=$(date +%s%3N)
    duration=$(( end - start ))
    record_result "ok" "$name" "$url" "$name ($url)" "$duration"
  else
    end=$(date +%s%3N)
    duration=$(( end - start ))
    record_result "error" "$name" "$url" "$name ($url)" "$duration"
    STATUS=1
  fi
}

check_matrix_login() {
  local homeserver="https://chat.$HOST"
  local start end duration
  start=$(date +%s%3N)
  if curl "${CURL_TLS[@]}" --max-time "$TIMEOUT" \
    -H 'Content-Type: application/json' \
    -d '{"identifier":{"type":"m.id.user","user":"healthbot"},"password":"dummy","type":"m.login.password"}' \
    "$homeserver/_matrix/client/v3/login" | jq '.errcode' >/dev/null; then
    end=$(date +%s%3N)
    duration=$(( end - start ))
    record_result "ok" "matrix" "$homeserver" "Matrix API responde" "$duration"
  else
    end=$(date +%s%3N)
    duration=$(( end - start ))
    record_result "error" "matrix" "$homeserver" "Matrix API no responde" "$duration"
    STATUS=1
  fi
}

check_imap() {
  local port=993
  local target="mail.$HOST:$port"
  local start end duration
  start=$(date +%s%3N)
  if echo '' | nc -w "$TIMEOUT" "mail.$HOST" "$port" | grep -qi 'ok'; then
    end=$(date +%s%3N)
    duration=$(( end - start ))
    record_result "ok" "imap" "$target" "IMAP banner detectado" "$duration"
  else
    end=$(date +%s%3N)
    duration=$(( end - start ))
    record_result "error" "imap" "$target" "IMAP sin respuesta" "$duration"
    STATUS=1
  fi
}

check_smtp() {
  local port=587
  local target="mail.$HOST:$port"
  local start end duration
  start=$(date +%s%3N)
  if echo 'QUIT' | nc -w "$TIMEOUT" "mail.$HOST" "$port" | grep -qi '220'; then
    end=$(date +%s%3N)
    duration=$(( end - start ))
    record_result "ok" "smtp" "$target" "SMTP submission responde" "$duration"
  else
    end=$(date +%s%3N)
    duration=$(( end - start ))
    record_result "error" "smtp" "$target" "SMTP submission sin respuesta" "$duration"
    STATUS=1
  fi
}

check_tls_cert() {
  local domain="$1"
  local expiry
  local start end duration
  start=$(date +%s%3N)
  expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
  if [[ -z "$expiry" ]]; then
    end=$(date +%s%3N)
    duration=$(( end - start ))
    record_result "error" "tls" "$domain" "No se pudo obtener expiración TLS de $domain" "$duration"
    STATUS=1
    return
  fi
  local exp_ts
  exp_ts=$(date -d "$expiry" +%s)
  local now_ts
  now_ts=$(date +%s)
  local diff=$(( (exp_ts - now_ts) / 86400 ))
  if (( diff < 15 )); then
    end=$(date +%s%3N)
    duration=$(( end - start ))
    record_result "warn" "tls" "$domain" "Certificado de $domain vence en $diff días" "$duration"
  else
    end=$(date +%s%3N)
    duration=$(( end - start ))
    record_result "ok" "tls" "$domain" "Certificado de $domain válido por $diff días" "$duration"
  fi
}

check_mail_roundtrip() {
  local start end duration
  start=$(date +%s%3N)
  if echo 'QUIT' | nc -w "$TIMEOUT" "mail.$HOST" 587 >/dev/null && echo '' | nc -w "$TIMEOUT" "mail.$HOST" 993 >/dev/null; then
    end=$(date +%s%3N)
    duration=$(( end - start ))
    record_result "ok" "mail_roundtrip" "mail.$HOST" "SMTP+IMAP handshake consecutivo" "$duration"
  else
    end=$(date +%s%3N)
    duration=$(( end - start ))
    record_result "warn" "mail_roundtrip" "mail.$HOST" "No se pudo validar roundtrip completo" "$duration"
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
check_mail_roundtrip

if [[ "$OUTPUT_FORMAT" == "json" ]]; then
  overall_status="ok"
  if (( STATUS != 0 )); then
    overall_status="error"
  fi
  printf '%s\n' "${RESULTS[@]}" | jq --arg status "$overall_status" -s '{status:$status,results:.}'
else
  exit $STATUS
fi

exit $STATUS
