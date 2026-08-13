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

/* Correção V15.5: helpers de modal restaurados */
if (typeof window.modal !== 'function') {
  window.modal = function(html) {
    const bg = document.getElementById('modalbg');
    const box = document.getElementById('modal');
    if (!bg || !box) throw new Error('Estrutura do modal não encontrada.');
    box.innerHTML = html;
    bg.classList.add('open');
  };
}

if (typeof window.closeM !== 'function') {
  window.closeM = function() {
    const bg = document.getElementById('modalbg');
    if (bg) bg.classList.remove('open');
  };
}

window.addEventListener('click', (event) => {
  const bg = document.getElementById('modalbg');
  if (event.target === bg) window.closeM();
});

window.addEventListener('load', () => {
  const originalOpenVendaRapida = window.openVendaRapida;
  window.openVendaRapida = function(){
    try {
      if (typeof pecasHTML !== 'function' || typeof payHTML !== 'function') {
        if (typeof originalOpenVendaRapida === 'function') return originalOpenVendaRapida();
        return alert('PDV indisponível: funções de produtos/pagamento não carregadas.');
      }
      window.modal(`<div class="mhead"><h3>Nova venda</h3><button class="btn" onclick="closeM()">Fechar</button></div>
        <div class="field"><label>Cliente</label><input id="vr_cli" placeholder="Consumidor"></div>
        <div class="card"><h3>Produtos</h3>${pecasHTML([])}</div>
        ${payHTML(0)}
        <div class="actions"><button class="btn goldbtn" onclick="saveVendaRapida()">Finalizar venda</button></div>`);
      if (typeof payRecalc === 'function') payRecalc();
    } catch(e) {
      console.error('Erro ao abrir Nova Venda', e);
      alert('Não foi possível abrir a Nova Venda: ' + (e.message || e));
    }
  };
});
