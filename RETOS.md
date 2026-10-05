# Retos opcionales (sección 10)

Cada reto está en su propio commit, sobre la versión base (etiqueta `base`), para poder ver con
`git diff` exactamente qué cambió en cada uno. Todos se verifican en `npm test` (pruebas 10 a 14).

| # | Reto | Commit | Qué tocó |
|---|---|---|---|
| 1 | Micro frontend Pedidos | `Reto 1` | nuevo `mfe-pedidos/`, registro, un enlace en el menú y el carrito (publica `pedido:confirmado`) |
| 2 | Carrito como Web Component | `Reto 2` | solo `mfe-carrito/` y su entrada del registro. **Catálogo: 0 líneas** |
| 3 | `registro.json` con `fetch()` | `Reto 3` | solo `contenedor/` |
| 4 | `tokens.css` desde un quinto origen | `Reto 4` | nuevo `design-system/` (8085) y el CSS de los micro frontends |
| 5 | Romper el aislamiento | (experimento) | ninguno: se mide en la prueba 14 |

## Reto 1 · Micro frontend Pedidos (puerto 8084)

- `mfe-pedidos/pedidos.js` expone `window.renderPedidos` / `window.unmountPedidos` y escucha
  `pedido:confirmado`. Como debe enterarse aunque no esté en pantalla, el registro lo marca con
  `precargar: true` (el mismo problema que el carrito en la pregunta 3 de reflexión).
- El carrito publica el nuevo evento al confirmar:

  | Evento | Lo publica | Lo escucha | `detail` |
  |---|---|---|---|
  | `pedido:confirmado` | mfe-carrito | mfe-pedidos | `{ id, fecha, items: [{ id, nombre, precio, cantidad }], total }` |

- El contenedor no cambió su lógica: solo una entrada nueva en el registro y el enlace "Pedidos" del menú.
  Catálogo y Perfil no se tocaron.

## Reto 2 · Carrito como Web Component

`mfe-carrito/carrito.js` (v2.0.0) ahora define `<mfe-carrito>` con Shadow DOM y en el registro pasa de
`tipo: "funcion"` a `tipo: "webcomponent"`. Escucha y publica exactamente los mismos eventos, así que
`git diff base -- mfe-catalogo` en el commit del reto 2 está vacío. Detalles:

- El estado (`items`) vive en el módulo y no en el elemento, para que sobreviva cuando el contenedor retira
  la etiqueta de la página (igual que antes vivía en el closure).
- El listener de `carrito:agregar` sigue registrándose al cargar el script, por eso sigue precargado.
- Con Shadow DOM ya no hacen falta los prefijos `car-`.

## Reto 3 · Registro en `registro.json`

`contenedor/registro.js` se reemplazó por `contenedor/registro.json`, que `contenedor.js` lee con
`fetch('registro.json', { cache: 'no-store' })` antes de precargar y navegar. Como el JSON se sirve desde
el mismo origen que el contenedor (8080), no hace falta CORS. Si el registro se moviera a otro puerto,
ese servidor tendría que responder con `Access-Control-Allow-Origin` (por ejemplo `npx http-server --cors`).
Si el archivo no está, el contenedor muestra un error controlado en vez de quedar en blanco.

## Reto 4 · Sistema de diseño compartido (puerto 8085)

`design-system/tokens.css` solo define variables (`--color-primario`, `--color-acento`, `--radio`, …).
Cada micro frontend inserta una vez `<link id="tokens-saborupc" href="http://localhost:8085/tokens.css">`
y usa `var(--color-primario, #0b4f8a)` en su CSS.

- Las variables CSS se **heredan a través del Shadow DOM**, por eso los tokens llegan también a
  `<mfe-perfil>` y `<mfe-carrito>`, aunque las reglas globales no.
- Cada `var()` lleva un valor por defecto: si el servidor de tokens cae, la aplicación se ve igual que antes.
- `http://localhost:8085` muestra las muestras de color. Cambie un valor en `tokens.css`, recargue
  la aplicación y cambia en todos los micro frontends sin redeployar ninguno.

## Reto 5 · ¿Qué se rompe con `button { background: black; }` en `contenedor.css`?

Resultado medido en el navegador (prueba 14):

| Micro frontend | ¿Fondo negro? | ¿Por qué? |
|---|---|---|
| Catálogo (prefijos, DOM normal) | No | `.cat-boton` (una clase) es más específico que `button` (una etiqueta) y declara `background`, así que gana. |
| Catálogo, con `button { font-style: italic; }` | **Sí se filtra** | `.cat-boton` no declara `font-style`, así que la regla global sí aplica. |
| Carrito v1 (prefijos) | No | Mismo caso que Catálogo: `.car-quitar` y `.car-confirmar` declaran `background`. |
| Carrito v2 y Perfil (Shadow DOM) | No, nada | Las reglas del documento no atraviesan el Shadow DOM, sea cual sea su especificidad. |

Conclusión: los prefijos evitan que **los nombres de clase** choquen, pero no protegen contra reglas globales
sobre etiquetas. Solo "ganan" en las propiedades que el equipo declaró, por especificidad, y una regla con
`!important` o sobre una propiedad no declarada se filtra igual. El Shadow DOM sí aísla de verdad: lo único
que entra es lo heredable (como `color`, `font-family` y las variables CSS), que es justamente lo que
aprovecha el reto 4.
