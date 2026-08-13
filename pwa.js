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
  const originalCollectPecas = window.collectPecas;
  const originalPayRecalc = window.payRecalc;

  /* Faz a venda rápida aceitar também serviços, sem baixar estoque de serviço. */
  if (typeof originalCollectPecas === 'function') {
    window.collectPecas = function(){
      const produtos = originalCollectPecas();
      const box = document.getElementById('maoBox');
      if (!box) return produtos;
      const servicos = [...box.querySelectorAll('.lineitem')].map((r,i)=>({
        prodId:'servico_'+i,
        nome:r.querySelector('.m_desc')?.value || 'Serviço',
        qtd:1,
        preco:Number(r.querySelector('.m_valor')?.value || 0),
        tipo:'Serviço'
      })).filter(x=>x.nome && x.preco>=0);
      return produtos.concat(servicos);
    };
  }

  /* Soma produtos + mão de obra no subtotal do PDV. */
  window.payRecalc = function(){
    if (typeof originalPayRecalc === 'function') originalPayRecalc();
    const sub = document.getElementById('pay_subtotal');
    const total = document.getElementById('pay_total');
    if (!sub || !total) return;
    const produtosBox = document.getElementById('pecasBox');
    const maoBox = document.getElementById('maoBox');
    let produtos = 0, servicos = 0;
    if (produtosBox) produtos = [...produtosBox.querySelectorAll('.lineitem')].reduce((a,r)=>a + Number(r.querySelector('.p_qtd')?.value||0)*Number(r.querySelector('.p_preco')?.value||0),0);
    if (maoBox) servicos = [...maoBox.querySelectorAll('.lineitem')].reduce((a,r)=>a + Number(r.querySelector('.m_valor')?.value||0),0);
    const base = produtos + servicos;
    sub.value = base.toFixed(2);
    sub.dataset.base = base.toFixed(2);
    let desconto = Math.max(0,Number(document.getElementById('pay_desconto')?.value||0));
    if (desconto>base) desconto=base;
    total.value = Math.max(0,base-desconto).toFixed(2);
  };

  document.addEventListener('input', (e)=>{
    if (e.target?.classList?.contains('m_valor')) window.payRecalc();
  });
  document.addEventListener('click', (e)=>{
    if (e.target?.closest?.('#maoBox button') || e.target?.closest?.('[onclick*="addMaoCadastrada"]') || e.target?.closest?.('[onclick*="addMaoLine"]')) {
      setTimeout(()=>window.payRecalc(),0);
    }
  });

  window.openVendaRapida = function(){
    try {
      if (typeof pecasHTML !== 'function' || typeof payHTML !== 'function' || typeof maoHTML !== 'function') {
        if (typeof originalOpenVendaRapida === 'function') return originalOpenVendaRapida();
        return alert('PDV indisponível: funções necessárias não carregadas.');
      }
      window.modal(`<div class="mhead"><h3>Nova venda</h3><button class="btn" onclick="closeM()">Fechar</button></div>
        <div class="field"><label>Cliente</label><input id="vr_cli" placeholder="Consumidor"></div>
        <div class="card"><h3>Produtos</h3>${pecasHTML([])}</div>
        <div class="card"><h3>🔧 Serviços / Mão de obra</h3>${maoHTML([])}<div class="notice" style="margin-top:10px">Selecione um serviço já cadastrado ou adicione um serviço manual. O valor será somado à venda.</div></div>
        ${payHTML(0)}
        <div class="actions"><button class="btn goldbtn" onclick="saveVendaRapida()">Finalizar venda</button></div>`);
      window.payRecalc();
    } catch(e) {
      console.error('Erro ao abrir Nova Venda', e);
      alert('Não foi possível abrir a Nova Venda: ' + (e.message || e));
    }
  };
});
