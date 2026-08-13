let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(console.warn);
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  if (installBtn) installBtn.style.display = 'inline-flex';
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.style.display = 'none';
  });
}

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  if (installBtn) installBtn.style.display = 'none';
});

window.addEventListener('load', () => {
  const originalOpenVendaRapida = window.openVendaRapida;
  window.openVendaRapida = function(){
    try {
      if (typeof modal !== 'function' || typeof pecasHTML !== 'function' || typeof payHTML !== 'function') {
        return originalOpenVendaRapida ? originalOpenVendaRapida() : alert('PDV indisponível.');
      }
      modal(`<div class="mhead"><h3>Nova venda</h3><button class="btn" onclick="closeM()">Fechar</button></div>
        <div class="field"><label>Cliente</label><input id="vr_cli" placeholder="Consumidor"></div>
        <div class="card"><h3>Produtos</h3>${pecasHTML([])}</div>
        ${payHTML(0)}
        <div class="actions"><button class="btn goldbtn" onclick="saveVendaRapida()">Finalizar venda</button></div>`);
    } catch(e) {
      console.error('Erro ao abrir Nova Venda', e);
      alert('Não foi possível abrir a Nova Venda: ' + (e.message || e));
    }
  };
});
