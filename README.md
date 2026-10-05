# SaborUPC con micro frontends

Implementación completa del *Taller práctico: construyendo SaborUPC con micro frontends*
(Arquitectura de Aplicaciones Web · Ingeniería de Sistemas · Universidad Popular del Cesar).

Una tienda de comida típica compuesta por una aplicación contenedora y tres micro frontends
que se desarrollan, ejecutan y despliegan de forma independiente, sin frameworks ni compilación.

| Carpeta | Puerto | Equipo | Integración |
|---|---|---|---|
| `contenedor/` | 8080 | Plataforma | Encabezado, enrutamiento por hash, carga de scripts |
| `mfe-catalogo/` | 8081 | Descubrimiento | `window.renderCatalogo` / `window.unmountCatalogo` |
| `mfe-carrito/` | 8082 | Pedidos | `window.renderCarrito` / `window.unmountCarrito` (precargado) |
| `mfe-perfil/` | 8083 | Cuentas | Web Component `<mfe-perfil>` con Shadow DOM |

## Contrato de eventos (todos viajan por `window`)

| Evento | Lo publica | Lo escucha | `detail` |
|---|---|---|---|
| `carrito:agregar` | mfe-catalogo | mfe-carrito | `{ id, nombre, precio }` |
| `carrito:actualizado` | mfe-carrito | contenedor (contador) | `{ cantidad, total }` |
| `usuario:cambio` | mfe-perfil | contenedor (saludo) | `{ nombre }` |

## Ejecutar

Solo se necesita Python 3 (o Node.js).

- **Linux / macOS:** `bash iniciar.sh` (levanta los cuatro servidores; Ctrl + C los detiene).
- **Windows:** doble clic en `iniciar.bat` (abre una ventana por equipo).
- **Manual:** una terminal por carpeta con `python -m http.server <puerto>` o `npx http-server -p <puerto> -c-1`.

Luego abra <http://localhost:8080>. Cada micro frontend también se puede abrir solo
(modo independiente) en su puerto: 8081, 8082 y 8083.

## Pruebas

`pruebas/pruebas-guiadas.mjs` automatiza las pruebas guiadas del paso 6 y la resiliencia del
paso 9.2 con Playwright (18 verificaciones) y guarda capturas en `capturas/`.

```bash
npm install          # instala Playwright (solo para las pruebas)
npx playwright install chromium
bash iniciar.sh &    # servidores arriba
npm test
```

## Despliegue independiente (paso 9.1)

Cambie en `mfe-catalogo/catalogo.js` la versión a `'1.1.0'`, agregue
`{ id: 9, nombre: 'Mote de queso', precio: 15000, categoria: 'Plato fuerte' }` y cambie el color de
`.cat-boton`. Al recargar <http://localhost:8080> se ve la nueva versión sin tocar ni reiniciar el
contenedor, el carrito ni el perfil.

## Entregables

- Respuestas a las preguntas de reflexión: [`REFLEXION.md`](REFLEXION.md)
- Capturas de la aplicación funcionando: [`capturas/`](capturas/)
