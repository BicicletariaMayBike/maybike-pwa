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
        <div class="field"><label>Cliente</label><input id="vr_cli" value="Cliente sem cadastro" placeholder="Cliente sem cadastro"></div>
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

  /* Finalização robusta da venda rápida atual (produtos + serviços). */
  window.saveVendaRapida = async function(){
    try {
      const itens = typeof collectPecas === 'function' ? collectPecas() : [];
      if (!itens.length) return alert('Adicione pelo menos um produto ou serviço.');

      const subtotal = itens.reduce((a,i)=>a + Number(i.qtd||0)*Number(i.preco||0),0);
      let desconto = Math.max(0,Number(document.getElementById('pay_desconto')?.value||0));
      if (desconto > subtotal) desconto = subtotal;
      const total = Math.max(0,subtotal-desconto);

      /* Baixa somente itens que existem no estoque. Serviços ficam fora. */
      for (const item of itens) {
        const produto = st.estoque.find(x=>x.id===item.prodId);
        if (!produto) continue;
        if (Number(produto.qtd||0) < Number(item.qtd||0)) return alert('Estoque insuficiente para '+produto.desc);
      }
      for (const item of itens) {
        const produto = st.estoque.find(x=>x.id===item.prodId);
        if (produto) produto.qtd = Number(produto.qtd||0) - Number(item.qtd||0);
      }

      const forma = document.getElementById('pay_forma')?.value || 'Dinheiro';
      const cliente = (document.getElementById('vr_cli')?.value || '').trim() || 'Cliente sem cadastro';
      let entrada = total;
      let status = 'Recebida';

      if (['A prazo','Parcial','Crédito Parcelado'].includes(forma)) {
        entrada = Math.max(0,Number(document.getElementById('pay_entrada')?.value||0));
        if (entrada > total) entrada = total;
        status = entrada > 0 ? 'Parcial / a receber' : 'A receber';
      }

      const venda = {
        id: uid(),
        cod: typeof v14SaleCode==='function' ? v14SaleCode() : undefined,
        num: st.seqVenda++,
        data: today(),
        cliente,
        origem: itens.some(i=>i.tipo==='Serviço') ? 'Venda rápida / serviço' : 'Venda rápida',
        total,
        subtotal,
        desconto,
        forma,
        obs: document.getElementById('pay_obs')?.value || '',
        status,
        entrada,
        itens
      };

      st.vendas.push(venda);

      if (['A prazo','Parcial','Crédito Parcelado'].includes(forma)) {
        if (entrada > 0) st.caixa.push({id:uid(),data:today(),tipo:'Entrada',desc:(venda.cod||('Venda #'+venda.num))+' - '+cliente,cat:'Venda',valor:entrada});
        const parcelas = Math.max(1,parseInt(document.getElementById('pay_parcelas')?.value||1));
        const venc = document.getElementById('pay_venc')?.value || (typeof addDays==='function' ? addDays(today(),30) : today());
        if (typeof gerarContasReceber === 'function') gerarContasReceber(venda,total,entrada,parcelas,venc);
      } else {
        st.caixa.push({id:uid(),data:today(),tipo:'Entrada',desc:(venda.cod||('Venda #'+venda.num))+' - '+cliente,cat:'Venda',valor:total});
      }

      if (typeof logAudit === 'function') logAudit('Venda rápida',`${venda.cod||venda.num} / ${cliente} / ${forma} / ${money(total)}`);

      closeM();
      await save();
      go('vendas');
      alert('Venda finalizada com sucesso!');
    } catch(e) {
      console.error('Erro ao finalizar venda rápida', e);
      alert('Não foi possível finalizar a venda: ' + (e.message || e));
    }
  };
});
