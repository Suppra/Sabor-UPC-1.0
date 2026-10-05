# SaborUPC con micro frontends

Implementación completa del *Taller práctico: construyendo SaborUPC con micro frontends*
(Arquitectura de Aplicaciones Web · Ingeniería de Sistemas · Universidad Popular del Cesar).

Una tienda de comida típica compuesta por una aplicación contenedora y tres micro frontends
que se desarrollan, ejecutan y despliegan de forma independiente, sin frameworks ni compilación.

| Carpeta | Puerto | Equipo | Integración |
|---|---|---|---|
| `contenedor/` | 8080 | Plataforma | Encabezado, enrutamiento por hash, carga de scripts |
| `mfe-catalogo/` | 8081 | Descubrimiento | `window.renderCatalogo` / `window.unmountCatalogo` |
| `mfe-carrito/` | 8082 | Pedidos | Web Component `<mfe-carrito>` (precargado; v1 usaba funciones, ver reto 2) |
| `mfe-perfil/` | 8083 | Cuentas | Web Component `<mfe-perfil>` con Shadow DOM |
| `mfe-pedidos/` | 8084 | Postventa | `window.renderPedidos` / `window.unmountPedidos` (precargado, reto 1) |
| `design-system/` | 8085 | Diseño | `tokens.css` con variables CSS compartidas (reto 4) |

El contenedor lee qué micro frontends existen desde `contenedor/registro.json` (reto 3).

## Contrato de eventos (todos viajan por `window`)

| Evento | Lo publica | Lo escucha | `detail` |
|---|---|---|---|
| `carrito:agregar` | mfe-catalogo | mfe-carrito | `{ id, nombre, precio }` |
| `carrito:actualizado` | mfe-carrito | contenedor (contador) | `{ cantidad, total }` |
| `usuario:cambio` | mfe-perfil | contenedor (saludo) | `{ nombre }` |
| `pedido:confirmado` | mfe-carrito | mfe-pedidos | `{ id, fecha, items, total }` |

## Ejecutar

Solo se necesita Python 3 (o Node.js).

- **Linux / macOS:** `bash iniciar.sh` (levanta los seis servidores; Ctrl + C los detiene).
- **Windows:** doble clic en `iniciar.bat` (abre una ventana por equipo).
- **Manual:** una terminal por carpeta con `python -m http.server <puerto>` o `npx http-server -p <puerto> -c-1`.

Luego abra <http://localhost:8080>. Cada micro frontend también se puede abrir solo
(modo independiente) en su puerto: 8081 a 8084. En 8085 se ven los tokens de diseño.

## Pruebas

`pruebas/pruebas-guiadas.mjs` automatiza las pruebas guiadas del paso 6 y la resiliencia del
paso 9.2 y los cinco retos opcionales con Playwright (33 verificaciones) y guarda capturas en `capturas/`.

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

## Retos opcionales

Los cinco retos de la sección 10 están resueltos, cada uno en su propio commit. La explicación y el
resultado del experimento del reto 5 están en [`RETOS.md`](RETOS.md). La versión base del taller,
sin retos, es el primer commit (`git checkout 42334db`).

## Entregables

- Respuestas a las preguntas de reflexión: [`REFLEXION.md`](REFLEXION.md)
- Capturas de la aplicación funcionando: [`capturas/`](capturas/)
