#!/usr/bin/env bash
# Levanta las cuatro piezas, cada una en su propio servidor (Ctrl + C detiene todo).
cd "$(dirname "$0")"
PY=$(command -v python3 || command -v python)
declare -A PUERTOS=([contenedor]=8080 [mfe-catalogo]=8081 [mfe-carrito]=8082 [mfe-perfil]=8083)
PIDS=()
for carpeta in contenedor mfe-catalogo mfe-carrito mfe-perfil; do
  (cd "$carpeta" && exec "$PY" -m http.server "${PUERTOS[$carpeta]}") &
  PIDS+=($!)
  echo "$carpeta → http://localhost:${PUERTOS[$carpeta]}"
done
trap 'kill "${PIDS[@]}" 2>/dev/null' EXIT INT TERM
echo "Abra http://localhost:8080"
wait
