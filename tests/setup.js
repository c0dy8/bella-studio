// Mocks de globals que script.js necesita al cargarse en Node
global.SUPABASE_URL = '';
global.SUPABASE_KEY = '';
global.window = global.window || global;
global.window.supabase = null;

// DOM mínimo que render() y updateProgress() necesitan
document.body.innerHTML = `
  <div id="main"></div>
  <nav id="progressBar">
    <div class="progress-steps">
      <div class="p-step">
        <div class="p-circle active" id="c1">1</div>
        <span class="p-label active" id="l1">Especialista</span>
      </div>
      <div class="p-line"><div class="p-line-fill" id="ln1"></div></div>
      <div class="p-step">
        <div class="p-circle" id="c2">2</div>
        <span class="p-label" id="l2">Fecha y hora</span>
      </div>
      <div class="p-line"><div class="p-line-fill" id="ln2"></div></div>
      <div class="p-step">
        <div class="p-circle" id="c3">3</div>
        <span class="p-label" id="l3">Confirmar</span>
      </div>
    </div>
  </nav>
`;
