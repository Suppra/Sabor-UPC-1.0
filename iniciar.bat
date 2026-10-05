@echo off
REM Abre una ventana por "equipo", cada una con su propio servidor.
cd /d "%~dp0"
start "contenedor 8080"   cmd /k "cd contenedor && py -m http.server 8080"
start "mfe-catalogo 8081" cmd /k "cd mfe-catalogo && py -m http.server 8081"
start "mfe-carrito 8082"  cmd /k "cd mfe-carrito && py -m http.server 8082"
start "mfe-perfil 8083"   cmd /k "cd mfe-perfil && py -m http.server 8083"
echo Abra http://localhost:8080
