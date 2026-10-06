/* May Bike ERP V18.1.6 - recuperação segura de bicicletas antigas */
(function(){
'use strict';
const E=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const clone=x=>JSON.parse(JSON.stringify(x));
const norm=v=>String(v==null?'':v).trim().toLocaleLowerCase('pt-BR');
const bikeKey=b=>{
  if(!b)return'';
  if(b.quadro&&norm(b.quadro))return'quadro:'+norm(b.quadro);
  if(b.id!=null&&b.id!=='')return'id:'+String(b.id);
  if(b.vendaId)return'venda:'+String(b.vendaId);
  return'cmp:'+norm([b.marca,b.modelo,b.cliente,b.dataCadastro,b.cor].filter(Boolean).join('|'));
};
const bikeName=b=>[b.marca,b.modelo].filter(Boolean).join(' ')||b.nome||b.produto||'Bicicleta';
function looksState(x){
  return x&&typeof x==='object'&&!Array.isArray(x)&&(
    Array.isArray(x.bikes)||Array.isArray(x.vendas)||Array.isArray(x.estoque)||Array.isArray(x.os)
  );
}
function addBike(out,b,source,label){
  if(!b||typeof b!=='object')return;
  const x=clone(b);
  if(!x.quadro&&x.bicicleta&&x.bicicleta.quadro)Object.assign(x,x.bicicleta);
  if(!x.marca&&!x.modelo&&!x.quadro)return;
  out.push({bike:x,source,label:label||source});
}
function addState(out,state,source,label){
  if(!looksState(state))return;
  (Array.isArray(state.bikes)?state.bikes:[]).forEach(b=>addBike(out,b,source,label||'Cadastro de bicicletas'));
  (Array.isArray(state.vendas)?state.vendas:[]).forEach(v=>{
    if(v&&v.bicicleta)addBike(out,{
      ...v.bicicleta,
      cliente:v.cliente||v.bicicleta.cliente||'',
      clienteId:v.clienteId||v.bicicleta.clienteId||'',
      vendaId:v.id||v.vendaId||'',
      dataCadastro:v.data||v.bicicleta.dataCadastro||'',
      origem:'Venda antiga'
    },source,'Venda antiga '+(v.cod||('#'+(v.num||''))));
  });
}
function walk(out,obj,source,label,depth){
  if(depth>5||obj==null)return;
  if(looksState(obj))addState(out,obj,source,label);
  if(Array.isArray(obj)){
    obj.forEach((x,i)=>{
      if(!x||typeof x!=='object')return;
      if(x.state&&looksState(x.state))addState(out,x.state,source,(x.label||label||source)+' • backup '+(i+1));
      else walk(out,x,source,label,depth+1);
    });
    return;
  }
  if(typeof obj==='object'){
    for(const k of Object.keys(obj)){
      if(k==='state'&&looksState(obj[k]))addState(out,obj[k],source,obj.label||label||source);
      else walk(out,obj[k],source,label,depth+1);
    }
  }
}
function scan(){
  const found=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k)continue;
    let raw='',obj;
    try{raw=localStorage.getItem(k)||'';obj=JSON.parse(raw)}catch(e){continue}
    if(!raw||raw.length<2)continue;
    try{walk(found,obj,'localStorage: '+k,k,0)}catch(e){console.warn('bike recovery',k,e)}
  }
  const current=new Set((Array.isArray(st.bikes)?st.bikes:[]).map(bikeKey));
  const map=new Map();
  found.forEach(r=>{
    const k=bikeKey(r.bike);
    if(!k||current.has(k))return;
    const prev=map.get(k);
    if(!prev)map.set(k,r);
    else{
      const a=String(r.bike.dataCadastro||r.bike.data||''),b=String(prev.bike.dataCadastro||prev.bike.data||'');
      if(a>b)map.set(k,r);
    }
  });
  return [...map.values()].sort((a,b)=>String(b.bike.dataCadastro||b.bike.data||'').localeCompare(String(a.bike.dataCadastro||a.bike.data||'')));
}
window.__v1816BikeCandidates=[];
function bikeRows(q){
  q=norm(q);
  return window.__v1816BikeCandidates.filter(r=>{
    const b=r.bike;
    const s=[b.cod,b.id,b.marca,b.modelo,b.quadro,b.cor,b.aro,b.tamanho,b.ano,b.cliente,b.clienteId,b.vendaId,r.source,r.label].join(' ');
    return !q||norm(s).includes(q);
  }).map((r)=>{
    const b=r.bike,idx=window.__v1816BikeCandidates.indexOf(r);
    return '<tr><td><input class="v1816_bike_chk" type="checkbox" value="'+idx+'"></td>'+
      '<td><b>'+E(bikeName(b))+'</b></td>'+
      '<td>'+E(b.quadro||'—')+'</td>'+
      '<td>'+E(b.cliente||'—')+'</td>'+
      '<td>'+E(b.cor||'—')+'</td>'+
      '<td>'+E(b.aro||'—')+'</td>'+
      '<td><small>'+E(r.label||r.source)+'</small></td></tr>';
  }).join('');
}
window.v1816FiltrarBikes=function(){
  const tb=document.getElementById('v1816_bike_rows');
  if(tb)tb.innerHTML=bikeRows(document.getElementById('v1816_bike_q')?.value||'')||
    '<tr><td colspan="7" class="empty">Nenhuma bicicleta antiga encontrada com esse filtro.</td></tr>';
};
window.v1816AbrirRecuperacaoBikes=function(){
  window.__v1816BikeCandidates=scan();
  const count=window.__v1816BikeCandidates.length;
  modal(
    '<div class="mhead"><div><h3>🚲 Recuperar bicicletas antigas</h3>'+
    '<div style="color:var(--mut);margin-top:4px">Pesquisa somente cópias e backups que ainda existem neste computador. Nada será alterado até você confirmar.</div></div>'+
    '<button class="btn" onclick="closeM()">Fechar</button></div>'+
    '<div class="notice"><b>'+count+'</b> bicicleta(s) ausente(s) do cadastro atual foram encontradas. O sistema também procura bicicletas que estavam vinculadas a vendas antigas.</div>'+
    '<div class="field"><label>Pesquisar bicicleta, quadro, cliente ou venda</label><input id="v1816_bike_q" placeholder="Ex.: quadro, Oggi, Caloi, cliente..." oninput="v1816FiltrarBikes()"></div>'+
    '<div style="max-height:430px;overflow:auto"><table class="table"><thead><tr><th></th><th>Bicicleta</th><th>Quadro</th><th>Cliente</th><th>Cor</th><th>Aro</th><th>Origem</th></tr></thead>'+
    '<tbody id="v1816_bike_rows">'+(bikeRows('')||'<tr><td colspan="7" class="empty">Nenhuma bicicleta antiga recuperável encontrada neste navegador.</td></tr>')+'</tbody></table></div>'+
    '<div class="actions"><button class="btn" onclick="document.getElementById(\'v1816_bike_q\').value=\'\';v1816FiltrarBikes()">Mostrar todas</button>'+
    '<button class="btn goldbtn" onclick="v1816RecuperarBikesSelecionadas()">Recuperar selecionadas</button></div>'
  );
};
window.v1816RecuperarBikesSelecionadas=async function(){
  const ids=[...document.querySelectorAll('.v1816_bike_chk:checked')].map(x=>Number(x.value)).filter(Number.isFinite);
  if(!ids.length)return alert('Selecione pelo menos uma bicicleta.');
  const cand=ids.map(i=>window.__v1816BikeCandidates[i]).filter(Boolean);
  if(!cand.length)return;
  const nomes=cand.map(r=>bikeName(r.bike)+' — quadro '+(r.bike.quadro||'não informado')).join('\n');
  if(!confirm('Recuperar '+cand.length+' bicicleta(s)?\n\n'+nomes+'\n\nAs bicicletas atuais serão preservadas.'))return;
  try{
    const snap={data:new Date().toISOString(),label:'antes da recuperação de bicicletas V18.1.6',state:clone(st)};
    let arr=[];try{arr=JSON.parse(localStorage.getItem('maybike_v1816_recovery_backups')||'[]')}catch(e){}
    arr.unshift(snap);localStorage.setItem('maybike_v1816_recovery_backups',JSON.stringify(arr.slice(0,5)));
  }catch(e){console.warn(e)}
  if(!Array.isArray(st.bikes))st.bikes=[];
  const keys=new Set(st.bikes.map(bikeKey));
  let added=0;
  cand.forEach(r=>{
    const b=clone(r.bike),k=bikeKey(b);
    if(!k||keys.has(k))return;
    if(!b.id)b.id=(typeof uid==='function'?uid():Date.now().toString(36)+Math.random().toString(36).slice(2,7));
    st.bikes.push(b);keys.add(k);added++;
  });
  if(typeof logAudit==='function')logAudit('Recuperação de bicicletas antigas',added+' bicicleta(s) recuperada(s) pela V18.1.6');
  closeM();
  await Promise.resolve(save());
  if(typeof go==='function')go('bicicletas');
  alert(added+' bicicleta(s) recuperada(s) com sucesso.\n\nNenhuma bicicleta atual foi apagada.');
};
function inject(){
  if(document.getElementById('v1816-bike-recovery-btn'))return;
  const top=document.querySelector('.top .right');
  if(!top)return;
  const b=document.createElement('button');
  b.id='v1816-bike-recovery-btn';b.className='btn';b.textContent='🚲 Recuperar bikes';
  b.title='Procurar bicicletas antigas nos backups deste computador';
  b.onclick=window.v1816AbrirRecuperacaoBikes;
  const rec=document.getElementById('v1803-recovery-btn');
  if(rec)rec.insertAdjacentElement('afterend',b);else top.insertBefore(b,top.firstChild);
}
const render0=window.render;
if(typeof render0==='function')window.render=function(p){const r=render0.apply(this,arguments);setTimeout(inject,0);return r};
setTimeout(inject,100);setTimeout(inject,1000);
})();