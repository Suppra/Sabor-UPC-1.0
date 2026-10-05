// Automatiza las "Pruebas guiadas" (paso 6), la resiliencia (paso 9.2) y los retos opcionales (sección 10).
// Los selectores CSS de Playwright atraviesan el Shadow DOM abierto, por eso 'mfe-carrito table' funciona.
// Requisitos: servidores levantados (./iniciar.sh) y Playwright instalado (npm i -D playwright).
// Uso: node pruebas/pruebas-guiadas.mjs
import { chromium } from 'playwright';

const BASE = 'http://localhost:8080';
const CAPTURAS = process.env.CAPTURAS || new URL('../capturas/', import.meta.url).pathname;
let fallos = 0;
function ok(cond, texto) {
  console.log((cond ? '  ✔ ' : '  ✘ ') + texto);
  if (!cond) fallos++;
}

const navegador = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 800 } });
const descargas = [];
pagina.on('request', r => { if (r.url().endsWith('.js') || r.url().includes('.js?')) descargas.push(r.url()); });

console.log('1. Carga dinámica');
await pagina.goto(BASE);
await pagina.waitForSelector('.cat-tarjeta');
await pagina.waitForFunction(() => !!customElements.get('mfe-carrito'));
ok(descargas.some(u => u.includes(':8081/catalogo.js')), 'catalogo.js descargado desde 8081');
ok(descargas.some(u => u.includes(':8082/carrito.js')), 'carrito.js precargado desde 8082');
ok(!descargas.some(u => u.includes('perfil.js')), 'perfil.js aún no descargado');
await pagina.screenshot({ path: CAPTURAS + '1-catalogo.png' });

console.log('2. Comunicación por eventos');
const botones = pagina.locator('.cat-boton');
await botones.nth(0).click(); await botones.nth(1).click(); await botones.nth(3).click();
ok(await pagina.textContent('#app-contador') === '3', 'el contador del encabezado marca 3');

console.log('3. Estado propio del carrito');
await pagina.click('a[data-ruta="/carrito"]');
await pagina.waitForSelector('mfe-carrito table');
ok(await pagina.locator('mfe-carrito tr').count() === 4, 'el carrito muestra los tres platos');
ok((await pagina.textContent('mfe-carrito .total')).includes('56.000'), 'total = $ 56.000');
await pagina.screenshot({ path: CAPTURAS + '2-carrito.png' });
await pagina.locator('mfe-carrito .quitar').first().click();
ok(await pagina.textContent('#app-contador') === '2', 'al quitar uno el contador baja a 2');

console.log('4. Estado que sobrevive al desmontaje');
await pagina.click('a[data-ruta="/catalogo"]');
await pagina.waitForSelector('.cat-buscar');
await pagina.fill('.cat-buscar', 'arepa');
ok(await pagina.locator('.cat-tarjeta').count() === 1, 'el filtro deja solo la arepa');
await pagina.click('a[data-ruta="/perfil"]');
await pagina.waitForSelector('mfe-perfil');
await pagina.click('a[data-ruta="/catalogo"]');
await pagina.waitForSelector('.cat-buscar');
ok(await pagina.inputValue('.cat-buscar') === 'arepa', 'el filtro se conserva al volver');

console.log('5. Web Component y carga bajo demanda');
await pagina.click('a[data-ruta="/perfil"]');
await pagina.waitForSelector('mfe-perfil');
ok(descargas.some(u => u.includes(':8083/perfil.js')), 'perfil.js descargado desde 8083 al entrar');
await pagina.locator('mfe-perfil input[name="nombre"]').fill('Christian');
await pagina.locator('mfe-perfil button').click();
ok(await pagina.textContent('#app-saludo') === 'Hola, Christian', 'el saludo del encabezado cambia');
ok(await pagina.evaluate(() => !!document.querySelector('mfe-perfil').shadowRoot), 'mfe-perfil tiene #shadow-root');
await pagina.screenshot({ path: CAPTURAS + '3-perfil.png' });

console.log('6. Contrato en window');
ok(await pagina.evaluate(() => typeof window.renderCatalogo === 'function' &&
  !!customElements.get('mfe-carrito') && !!customElements.get('mfe-perfil')), 'funciones y etiqueta expuestas');
await pagina.evaluate(() => window.dispatchEvent(new CustomEvent('carrito:agregar',
  { detail: { id: 99, nombre: 'Plato desde la consola', precio: 1000 } })));
ok(await pagina.textContent('#app-contador') === '3', 'evento publicado a mano llega al carrito');

console.log('7. Enlace profundo');
const otra = await navegador.newPage();
await otra.goto(BASE + '/#/carrito');
await otra.waitForSelector('mfe-carrito h2');
ok(true, '#/carrito se monta directamente');
await otra.close();

console.log('8. Aislamiento de estilos (modo independiente de Perfil)');
const perfil = await navegador.newPage();
await perfil.goto('http://localhost:8083');
await perfil.waitForSelector('mfe-perfil');
const colores = await perfil.evaluate(() => [
  getComputedStyle(document.querySelector('body > h2')).color,
  getComputedStyle(document.querySelector('mfe-perfil').shadowRoot.querySelector('h2')).color]);
ok(colores[0] === 'rgb(255, 0, 0)' && colores[1] === 'rgb(27, 122, 62)', 'h2 externo rojo, h2 interno verde');
await perfil.screenshot({ path: CAPTURAS + '4-perfil-aislado.png' });
await perfil.close();

console.log('9. Resiliencia (simulada bloqueando el puerto 8083)');
const caida = await navegador.newPage();
await caida.route('http://localhost:8083/**', r => r.abort());
await caida.goto(BASE + '/#/perfil');
await caida.waitForSelector('.app-error');
ok((await caida.textContent('.app-error')).includes('Perfil'), 'aparece "El micro frontend Perfil no está disponible"');
await caida.screenshot({ path: CAPTURAS + '5-perfil-caido.png' });
await caida.click('a[data-ruta="/catalogo"]');
await caida.waitForSelector('.cat-tarjeta');
ok(true, 'el catálogo sigue funcionando');
await caida.close();

console.log('10. Reto 1: micro frontend Pedidos');
const p1 = await navegador.newPage();
await p1.goto(BASE);
await p1.waitForSelector('.cat-tarjeta');
await p1.waitForFunction(() => !!customElements.get('mfe-carrito') && typeof window.renderPedidos === 'function');
await p1.locator('.cat-boton').nth(0).click();
await p1.locator('.cat-boton').nth(4).click();
await p1.click('a[data-ruta="/carrito"]');
await p1.locator('mfe-carrito .confirmar').click();
ok((await p1.textContent('mfe-carrito .exito')).includes('32.500'), 'el carrito confirma el pedido por $ 32.500');
ok(await p1.textContent('#app-contador') === '0', 'el contador vuelve a 0');
await p1.click('a[data-ruta="/pedidos"]');
await p1.waitForSelector('.ped-pedido');
const pedido = await p1.textContent('.ped-pedido');
ok(pedido.includes('Chivo guisado') && pedido.includes('Carimañola') && pedido.includes('32.500'), 'Pedidos (8084) lista el pedido confirmado');
await p1.screenshot({ path: CAPTURAS + '6-pedidos.png' });

console.log('11. Reto 2: Carrito como Web Component');
await p1.click('a[data-ruta="/carrito"]');
await p1.waitForSelector('mfe-carrito h2');
ok(await p1.evaluate(() => !!document.querySelector('#app-root > mfe-carrito').shadowRoot), '<mfe-carrito> se monta con #shadow-root');
ok(await p1.evaluate(() => typeof window.renderCarrito === 'undefined'), 'ya no expone funciones en window');
ok((await p1.textContent('mfe-carrito .version')).includes('v2.0.0'), 'muestra mfe-carrito v2.0.0');

console.log('12. Reto 3: registro.json');
ok(await p1.evaluate(() => !!window.REGISTRO_MFE['/pedidos'] && !document.querySelector('script[src*="registro.js"]')),
  'el registro llegó por fetch() desde registro.json');
const sinRegistro = await navegador.newPage();
await sinRegistro.route('**/registro.json', r => r.fulfill({ status: 404, body: '' }));
await sinRegistro.goto(BASE);
await sinRegistro.waitForSelector('.app-error');
ok(true, 'si registro.json falta, el contenedor muestra un error controlado');
await sinRegistro.close();

console.log('13. Reto 4: tokens.css desde el origen 8085');
await p1.click('a[data-ruta="/catalogo"]');
await p1.waitForSelector('.cat-titulo');
ok(await p1.evaluate(() => document.getElementById('tokens-saborupc').href) === 'http://localhost:8085/tokens.css', 'tokens.css se carga una sola vez desde 8085');
// Cambiamos un token como lo haría el equipo de Diseño y observamos a los tres micro frontends
await p1.addStyleTag({ content: ':root { --color-primario: rgb(200, 0, 120); --color-acento-oscuro: rgb(200, 0, 120); }' });
const enCatalogo = await p1.evaluate(() => getComputedStyle(document.querySelector('.cat-titulo')).color);
await p1.click('a[data-ruta="/carrito"]');
await p1.waitForSelector('mfe-carrito h2');
const enCarrito = await p1.locator('mfe-carrito h2').evaluate(e => getComputedStyle(e).color);
await p1.click('a[data-ruta="/perfil"]');
await p1.waitForSelector('mfe-perfil h2');
const enPerfil = await p1.locator('mfe-perfil h2').evaluate(e => getComputedStyle(e).color);
ok([enCatalogo, enCarrito, enPerfil].every(c => c === 'rgb(200, 0, 120)'), 'un cambio de token llega a Catálogo, Carrito y Perfil (incluso dentro del Shadow DOM)');
await p1.close();
const sinTokens = await navegador.newPage();
await sinTokens.route('http://localhost:8085/**', r => r.abort());
await sinTokens.goto(BASE);
await sinTokens.waitForSelector('.cat-titulo');
ok(await sinTokens.evaluate(() => getComputedStyle(document.querySelector('.cat-titulo')).color) === 'rgb(11, 79, 138)', 'si el servidor de tokens cae, se usan los valores por defecto');
await sinTokens.close();

console.log('14. Reto 5: button { background: black; } en contenedor.css');
const p5 = await navegador.newPage();
await p5.goto(BASE);
await p5.waitForSelector('.cat-tarjeta');
await p5.addStyleTag({ content: 'button { background: black; }' });
const fondo = sel => p5.locator(sel).first().evaluate(e => getComputedStyle(e).backgroundColor);
const r5 = { catalogo: await fondo('.cat-boton') };
await p5.addStyleTag({ content: 'button { font-style: italic; }' });
r5.catalogoItalica = await p5.locator('.cat-boton').first().evaluate(e => getComputedStyle(e).fontStyle);
await p5.locator('.cat-boton').first().click();
await p5.click('a[data-ruta="/carrito"]');
await p5.waitForSelector('mfe-carrito .confirmar');
r5.carrito = await fondo('mfe-carrito .confirmar');
r5.carritoItalica = await p5.locator('mfe-carrito .confirmar').evaluate(e => getComputedStyle(e).fontStyle);
await p5.click('a[data-ruta="/perfil"]');
await p5.waitForSelector('mfe-perfil button');
r5.perfil = await fondo('mfe-perfil button');
console.log('     ' + JSON.stringify(r5));
ok(r5.catalogo === 'rgb(62, 159, 58)', 'Catálogo: .cat-boton conserva su fondo (más específico que button)');
ok(r5.catalogoItalica === 'italic', 'Catálogo: una propiedad que .cat-boton no declara SÍ se filtra');
ok(r5.carrito === 'rgb(11, 79, 138)' && r5.carritoItalica === 'normal', 'Carrito (Shadow DOM): no le llega nada');
ok(r5.perfil === 'rgb(27, 122, 62)', 'Perfil (Shadow DOM): no le llega nada');
await p5.close();

await navegador.close();
console.log(fallos === 0 ? '\nTodas las pruebas pasaron.' : `\n${fallos} prueba(s) fallaron.`);
process.exit(fallos ? 1 : 0);
