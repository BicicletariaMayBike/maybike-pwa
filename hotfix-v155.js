/* May Bike V15.5 - Hotfix de estabilidade
   Corrige funcoes auxiliares removidas em atualizacoes anteriores.
   Mantem o mesmo objeto st e o mesmo documento Firestore para preservar dados. */
(function(){
  'use strict';

  function ensureArray(key){
    if(!Array.isArray(st[key])) st[key]=[];
    return st[key];
  }

  // CRUD base usado por Clientes, Funcionarios, Mao de Obra, Estoque e OS.
  window.upsert = function(key,obj){
    const arr=ensureArray(key);
    const i=arr.findIndex(x=>x && x.id===obj.id);
    if(i>=0) arr[i]={...arr[i],...obj};
    else arr.push(obj);
    return obj;
  };

  window.del = function(key,id){
    const arr=ensureArray(key);
    const item=arr.find(x=>x && x.id===id);
    if(!item) return;
    if(!confirm('Deseja realmente excluir este registro?')) return;
    st[key]=arr.filter(x=>x && x.id!==id);
    if(typeof logAudit==='function'){
      try{ logAudit('Registro excluido', key+' / '+id); }catch(e){}
    }
    save();
  };

  // Lancamento central de caixa, usado pelas vendas V15.5.
  window.addCaixa = function(tipo,valor,desc,cat,forma){
    ensureArray('caixa').push({
      id:uid(), data:today(), tipo:tipo||'Entrada', valor:n(valor),
      desc:desc||'', cat:cat||'Geral', forma:forma||''
    });
  };

  window.caixa = function(){
    const box=$('p-caixa');
    if(!box) return;
    const movimentos=ensureArray('caixa').slice().sort((a,b)=>((b.data||'')+(b.id||'')).localeCompare((a.data||'')+(a.id||'')));
    const ent=movimentos.filter(x=>x.tipo==='Entrada').reduce((a,x)=>a+n(x.valor),0);
    const sai=movimentos.filter(x=>x.tipo==='Saída'||x.tipo==='Saida').reduce((a,x)=>a+n(x.valor),0);
    const hoje=today();
    const hojeMov=movimentos.filter(x=>x.data===hoje);
    const entHoje=hojeMov.filter(x=>x.tipo==='Entrada').reduce((a,x)=>a+n(x.valor),0);
    const saiHoje=hojeMov.filter(x=>x.tipo==='Saída'||x.tipo==='Saida').reduce((a,x)=>a+n(x.valor),0);
    const rows=movimentos.map(x=>`<tr><td>${br(x.data)}</td><td><span class="badge ${x.tipo==='Entrada'?'b3':'b5'}">${x.tipo||'—'}</span></td><td>${x.desc||'—'}</td><td>${x.cat||'—'}</td><td>${x.forma||'—'}</td><td class="${x.tipo==='Entrada'?'green':'red'}"><b>${money(x.valor)}</b></td></tr>`).join('');
    box.innerHTML=`
      <div class="grid4">
        <div class="metric"><div class="label">Entradas hoje</div><div class="value green">${money(entHoje)}</div></div>
        <div class="metric"><div class="label">Saídas hoje</div><div class="value red">${money(saiHoje)}</div></div>
        <div class="metric"><div class="label">Saldo hoje</div><div class="value ${entHoje-saiHoje>=0?'green':'red'}">${money(entHoje-saiHoje)}</div></div>
        <div class="metric"><div class="label">Saldo acumulado</div><div class="value ${ent-sai>=0?'green':'red'}">${money(ent-sai)}</div></div>
      </div>
      <div class="card">
        <div class="head"><h3>Movimentações do Caixa</h3><span class="pill">${movimentos.length} lançamento(s)</span></div>
        <table class="table"><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Forma</th><th>Valor</th></tr></thead><tbody>${rows||'<tr><td colspan="6" class="empty">Nenhuma movimentação no caixa.</td></tr>'}</tbody></table>
      </div>`;
  };

  // Protege sequencias exigidas pela V15.5 antes de qualquer venda.
  function ensureSequences(){
    st.seqVenda=Math.max(1,n(st.seqVenda)||1);
    st.seqDocumento=Math.max(1,n(st.seqDocumento)||1);
    st.vendas=Array.isArray(st.vendas)?st.vendas:[];
    st.caixa=Array.isArray(st.caixa)?st.caixa:[];
    st.contas=Array.isArray(st.contas)?st.contas:[];
    st.estoque=Array.isArray(st.estoque)?st.estoque:[];
  }

  const oldOpenVenda=window.openVendaRapida;
  if(typeof oldOpenVenda==='function'){
    window.openVendaRapida=function(){ ensureSequences(); return oldOpenVenda.apply(this,arguments); };
  }

  // Exibe confirmacao e oferece recibo/documento apos uma venda realmente criada.
  const oldSaveVenda=window.saveVendaRapida;
  if(typeof oldSaveVenda==='function'){
    window.saveVendaRapida=function(){
      ensureSequences();
      const before=(st.vendas||[]).length;
      const result=oldSaveVenda.apply(this,arguments);
      const after=(st.vendas||[]).length;
      if(after>before){
        const v=st.vendas[after-1];
        setTimeout(()=>{
          try{
            if(confirm('Venda finalizada com sucesso. Deseja gerar o recibo agora?')){
              if(typeof window.printRec==='function') window.printRec(v.id);
              else if(typeof window.printDocumentoVenda==='function') window.printDocumentoVenda(v.id);
            }
          }catch(e){console.warn('recibo:',e)}
        },450);
      }
      return result;
    };
  }

  // Reaplica o render da tela atual apos o hotfix carregar.
  try{ ensureSequences(); if(typeof current!=='undefined' && current && typeof render==='function') render(current); }catch(e){console.warn('May Bike hotfix:',e)}
})();
