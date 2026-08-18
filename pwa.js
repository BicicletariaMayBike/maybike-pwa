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

function mbPwaEsc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function mbPwaClientes(){return Array.isArray(st&&st.clientes)?st.clientes.slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'})):[]}
window.mbPwaRenderClientes=function(q=''){
  const box=document.getElementById('mb-pwa-cli-lista'); if(!box)return;
  const termo=String(q||'').trim().toLocaleLowerCase('pt-BR');
  const lista=mbPwaClientes().filter(c=>!termo||[c.nome,c.whats,c.whatsapp,c.cpf,c.email].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(termo)));
  box.innerHTML=lista.length?lista.slice(0,100).map(c=>`<button type="button" class="btn" style="display:block;width:100%;text-align:left;margin:0 0 6px 0" onclick="mbPwaSelecionarCliente('${mbPwaEsc(c.id)}')"><b>${mbPwaEsc(c.nome||'Sem nome')}</b><br><small>${mbPwaEsc(c.whats||c.whatsapp||'Sem WhatsApp')}${c.cpf?' • CPF '+mbPwaEsc(c.cpf):''}</small></button>`).join(''):'<div class="notice">Nenhum cliente encontrado.</div>';
};
window.mbPwaAbrirCliente=function(){
  const p=document.getElementById('mb-pwa-cli-painel'); if(!p)return;
  p.style.display='block';
  const s=document.getElementById('mb-pwa-cli-busca'); if(s){s.value='';s.focus()}
  window.mbPwaRenderClientes('');
};
window.mbPwaFecharCliente=function(){const p=document.getElementById('mb-pwa-cli-painel');if(p)p.style.display='none'};
window.mbPwaSelecionarCliente=function(id){
  const c=mbPwaClientes().find(x=>String(x.id)===String(id)); if(!c)return;
  const inp=document.getElementById('vr_cli'); if(inp)inp.value=c.nome||'Cliente sem cadastro';
  const det=document.getElementById('mb-pwa-cli-detalhes');
  if(det){const end=[c.end||c.endereco,c.numero,c.bairro,c.cidade,c.uf].filter(Boolean).join(' • ');det.innerHTML=`<div class="notice" style="margin-top:8px"><b>${mbPwaEsc(c.nome||'Cliente')}</b>${c.whats||c.whatsapp?`<br>📱 ${mbPwaEsc(c.whats||c.whatsapp)}`:''}${c.cpf?`<br>CPF: ${mbPwaEsc(c.cpf)}`:''}${c.email?`<br>✉ ${mbPwaEsc(c.email)}`:''}${end?`<br>📍 ${mbPwaEsc(end)}`:''}</div>`;det.style.display='block'}
  window.__mbVendaClienteId=c.id;
  window.mbPwaFecharCliente();
};

window.addEventListener('load', () => {
  const originalOpenVendaRapida = window.openVendaRapida;
  const originalCollectPecas = window.collectPecas;
  const originalPayRecalc = window.payRecalc;

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
    if (e.target?.closest?.('#maoBox button') || e.target?.closest?.('[onclick*="addMaoCadastrada"]') || e.target?.closest?.('[onclick*="addMaoLine"]')) setTimeout(()=>window.payRecalc(),0);
  });

  window.openVendaRapida = function(){
    try {
      if (typeof pecasHTML !== 'function' || typeof payHTML !== 'function' || typeof maoHTML !== 'function') {
        if (typeof originalOpenVendaRapida === 'function') return originalOpenVendaRapida();
        return alert('PDV indisponível: funções necessárias não carregadas.');
      }
      window.modal(`<div class="mhead"><h3>Nova venda</h3><button class="btn" onclick="closeM()">Fechar</button></div>
        <div class="field"><label>Cliente</label><div style="display:flex;gap:8px"><input id="vr_cli" value="Cliente sem cadastro" placeholder="Cliente sem cadastro" style="flex:1"><button type="button" class="btn goldbtn" onclick="mbPwaAbrirCliente()">🔍 Buscar cliente</button></div><div id="mb-pwa-cli-detalhes" style="display:none"></div><div id="mb-pwa-cli-painel" class="card" style="display:none;margin-top:8px"><div style="display:flex;gap:8px"><input id="mb-pwa-cli-busca" placeholder="Digite nome, WhatsApp, CPF ou e-mail" oninput="mbPwaRenderClientes(this.value)" style="flex:1"><button type="button" class="btn" onclick="mbPwaFecharCliente()">Fechar</button></div><div id="mb-pwa-cli-lista" style="max-height:260px;overflow:auto;margin-top:10px"></div></div></div>
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

  window.saveVendaRapida = async function(){
    try {
      const itens = typeof collectPecas === 'function' ? collectPecas() : [];
      if (!itens.length) return alert('Adicione pelo menos um produto ou serviço.');
      const subtotal = itens.reduce((a,i)=>a + Number(i.qtd||0)*Number(i.preco||0),0);
      let desconto = Math.max(0,Number(document.getElementById('pay_desconto')?.value||0));
      if (desconto > subtotal) desconto = subtotal;
      const total = Math.max(0,subtotal-desconto);
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
      let entrada = total, status = 'Recebida';
      if (['A prazo','Parcial','Crédito Parcelado'].includes(forma)) {
        entrada = Math.max(0,Number(document.getElementById('pay_entrada')?.value||0));
        if (entrada > total) entrada = total;
        status = entrada > 0 ? 'Parcial / a receber' : 'A receber';
      }
      const venda = {id:uid(),cod:typeof v14SaleCode==='function'?v14SaleCode():undefined,num:st.seqVenda++,data:today(),cliente,clienteId:window.__mbVendaClienteId||'',origem:itens.some(i=>i.tipo==='Serviço')?'Venda rápida / serviço':'Venda rápida',total,subtotal,desconto,forma,obs:document.getElementById('pay_obs')?.value||'',status,entrada,itens};
      st.vendas.push(venda);
      if (['A prazo','Parcial','Crédito Parcelado'].includes(forma)) {
        if (entrada > 0) st.caixa.push({id:uid(),data:today(),tipo:'Entrada',desc:(venda.cod||('Venda #'+venda.num))+' - '+cliente,cat:'Venda',forma,valor:entrada});
        const parcelas = Math.max(1,parseInt(document.getElementById('pay_parcelas')?.value||1));
        const venc = document.getElementById('pay_venc')?.value || (typeof addDays==='function' ? addDays(today(),30) : today());
        if (typeof gerarContasReceber === 'function') gerarContasReceber(venda,total,entrada,parcelas,venc);
      } else st.caixa.push({id:uid(),data:today(),tipo:'Entrada',desc:(venda.cod||('Venda #'+venda.num))+' - '+cliente,cat:'Venda',forma,valor:total});
      if (typeof logAudit === 'function') logAudit('Venda rápida',`${venda.cod||venda.num} / ${cliente} / ${forma} / ${money(total)}`);
      closeM(); await save(); go('vendas'); alert('Venda finalizada com sucesso!');
    } catch(e) {
      console.error('Erro ao finalizar venda rápida', e);
      alert('Não foi possível finalizar a venda: ' + (e.message || e));
    }
  };
});
