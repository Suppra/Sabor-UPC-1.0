// Micro frontend: PEDIDOS  (equipo "Postventa")  — reto opcional 1
// Contrato: window.renderPedidos(idContenedor) / window.unmountPedidos(idContenedor)
// Escucha:  'pedido:confirmado' { id, fecha, items, total }
(function () {
  const VERSION = '1.0.0';
  const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const hora = new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' });

  // Estilos propios con prefijo "ped-"
  const CSS = `
    .ped-titulo { color: #0b4f8a; margin: 0 0 4px; }
    .ped-version { font-size: 12px; color: #888; }
    .ped-lista { list-style: none; padding: 0; margin: 16px 0; }
    .ped-pedido { background: #fff; border: 1px solid #dde3ea; border-radius: 6px; padding: 16px; margin-bottom: 12px; }
    .ped-cabecera { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 8px; }
    .ped-fecha { font-size: 13px; color: #666; font-weight: normal; }
    .ped-detalle { margin: 0; padding-left: 18px; font-size: 14px; }
    .ped-vacio { color: #777; }
  `;

  const pedidos = [];        // estado propio: pedidos confirmados en esta sesión
  let idMontado = null;

  function asegurarEstilos() {
    if (document.getElementById('ped-estilos')) return;
    const s = document.createElement('style');
    s.id = 'ped-estilos';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // Escucha desde que se carga el script (por eso el registro lo marca con precargar)
  window.addEventListener('pedido:confirmado', function (e) {
    pedidos.unshift(e.detail);
    if (idMontado) pintar();
  });

  function pintar() {
    const raiz = document.getElementById(idMontado);
    let html = `<h2 class="ped-titulo">Mis pedidos</h2>
                <span class="ped-version">mfe-pedidos v${VERSION}</span>`;
    if (pedidos.length === 0) {
      html += '<p class="ped-vacio">Aún no has confirmado pedidos.</p>';
    } else {
      html += '<ul class="ped-lista">' + pedidos.map((p, i) => `
        <li class="ped-pedido">
          <div class="ped-cabecera">
            <span>Pedido #${pedidos.length - i} <span class="ped-fecha">· ${hora.format(new Date(p.fecha))}</span></span>
            <span>${pesos.format(p.total)}</span>
          </div>
          <ul class="ped-detalle">
            ${p.items.map(it => `<li>${it.cantidad} × ${it.nombre} (${pesos.format(it.precio * it.cantidad)})</li>`).join('')}
          </ul>
        </li>`).join('') + '</ul>';
    }
    raiz.innerHTML = html;
  }

  window.renderPedidos = function (idContenedor) {
    asegurarEstilos();
    idMontado = idContenedor;
    pintar();
  };

  window.unmountPedidos = function (idContenedor) {
    document.getElementById(idContenedor).innerHTML = '';
    idMontado = null;
  };
})();
