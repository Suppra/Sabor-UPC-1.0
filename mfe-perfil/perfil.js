// Micro frontend: PERFIL  (equipo "Cuentas") — implementado como Web Component
// Contrato: define la etiqueta <mfe-perfil>
// Publica:  'usuario:cambio' { nombre }
(function () {
  const VERSION = '1.0.0';

  // Reto 4: tokens del sistema de diseño compartido, servidos desde otro origen.
  // Se insertan una sola vez en la página (el id es común a todos los equipos).
  // Cada var() lleva un valor por defecto: si el servidor de tokens cae, nada se rompe.
  (function asegurarTokens() {
    if (document.getElementById('tokens-saborupc')) return;
    const link = document.createElement('link');
    link.id = 'tokens-saborupc';
    link.rel = 'stylesheet';
    link.href = 'http://localhost:8085/tokens.css';
    document.head.appendChild(link);
  })();
  const datos = { nombre: '', ciudad: 'Valledupar' };  // estado propio

  class MfePerfil extends HTMLElement {
    connectedCallback() {
      // Shadow DOM: estilos y marcado encapsulados. Ni el contenedor ni
      // otros micro frontends pueden afectar (ni ser afectados por) este CSS.
      const sombra = this.shadowRoot || this.attachShadow({ mode: 'open' });
      sombra.innerHTML = `
        <style>
          :host { display: block; }
          h2 { color: var(--color-acento-oscuro, #1b7a3e); margin: 0 0 4px; }
          .version { font-size: 12px; color: var(--color-texto-suave, #888); }
          form { background: #fff; border: 1px solid var(--color-borde, #dde3ea); border-radius: var(--radio-tarjeta, 6px); padding: 20px; margin-top: 16px; max-width: 420px; }
          label { display: block; margin: 12px 0 4px; font-size: 14px; }
          input { width: 100%; padding: 8px; border: 1px solid #bbb; border-radius: var(--radio, 4px); box-sizing: border-box; }
          button { margin-top: 16px; background: var(--color-acento-oscuro, #1b7a3e); color: #fff; border: 0; padding: 8px 16px; border-radius: var(--radio, 4px); cursor: pointer; }
          .ok { color: var(--color-acento-oscuro, #1b7a3e); font-size: 14px; }
        </style>
        <h2>Mi perfil</h2>
        <span class="version">mfe-perfil v${VERSION} · Web Component</span>
        <form>
          <label>Nombre</label>
          <input name="nombre" value="${datos.nombre}" placeholder="Escribe tu nombre" required>
          <label>Ciudad</label>
          <input name="ciudad" value="${datos.ciudad}">
          <button type="submit">Guardar</button>
          <p class="ok"></p>
        </form>`;

      sombra.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        datos.nombre = f.nombre.value.trim();
        datos.ciudad = f.ciudad.value.trim();
        sombra.querySelector('.ok').textContent = 'Datos guardados.';
        window.dispatchEvent(new CustomEvent('usuario:cambio', { detail: { nombre: datos.nombre } }));
      });
    }

    disconnectedCallback() {
      // El navegador llama a este método cuando el contenedor retira el elemento
      console.log('[mfe-perfil] desmontado');
    }
  }

  if (!customElements.get('mfe-perfil')) {
    customElements.define('mfe-perfil', MfePerfil);
  }
})();
