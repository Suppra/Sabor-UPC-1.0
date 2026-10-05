// Automatiza las "Pruebas guiadas" (paso 6) y la resiliencia (paso 9.2) del taller.
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
await pagina.waitForFunction(() => typeof window.renderCarrito === 'function');
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
await pagina.waitForSelector('.car-tabla');
ok(await pagina.locator('.car-tabla tr').count() === 4, 'el carrito muestra los tres platos');
ok((await pagina.textContent('.car-total')).includes('56.000'), 'total = $ 56.000');
await pagina.screenshot({ path: CAPTURAS + '2-carrito.png' });
await pagina.locator('.car-quitar').first().click();
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
  typeof window.unmountCarrito === 'function' && !!customElements.get('mfe-perfil')), 'funciones y etiqueta expuestas');
await pagina.evaluate(() => window.dispatchEvent(new CustomEvent('carrito:agregar',
  { detail: { id: 99, nombre: 'Plato desde la consola', precio: 1000 } })));
ok(await pagina.textContent('#app-contador') === '3', 'evento publicado a mano llega al carrito');

console.log('7. Enlace profundo');
const otra = await navegador.newPage();
await otra.goto(BASE + '/#/carrito');
await otra.waitForSelector('.car-titulo');
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

await navegador.close();
console.log(fallos === 0 ? '\nTodas las pruebas pasaron.' : `\n${fallos} prueba(s) fallaron.`);
process.exit(fallos ? 1 : 0);
