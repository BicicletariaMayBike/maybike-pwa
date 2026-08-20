/* May Bike ERP V17.0.4 - faturamento de OS profissional */
(function(){'use strict';
function N(v){return Number(String(v==null?'':v).replace(',','.'))||0}
function E(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function V(id){var e=document.getElementById(id);return e?e.value:''}
function M(v){return typeof money==='function'?money(v):('R$ '+N(v).toFixed(2).replace('.',','))}
function addDays2(date,days){if(typeof addDays==='function')return addDays(date,days);var d=new Date((date||new Date().toISOString().slice(0,10))+'T12:00:00');d.setDate(d.getDate()+Number(days||0));return d.toISOString().slice(0,10)}
function uid2(){return typeof uid==='function'?uid():Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function hoje(){return typeof today==='function'?today():new Date().toISOString().slice(0,10)}
function totalOS(o){if(typeof calcOS==='function')return N(calcOS(o).total);var p=(o.pecas||[]).reduce((a,i)=>a+N(i.qtd)*N(i.preco),0),m=(o.mao||[]).reduce((a,i)=>a+N(i.valor),0);return p+m-N(o.desc)}
function val(id){return Math.max(0,N(V(id)))}

window.v1704Recalc=function(){
  var sub=val('osf_subtotal'),desc=val('osf_desc'); if(desc>sub){desc=sub;var de=document.getElementById('osf_desc');if(de)de.value=desc.toFixed(2)}
  var total=Math.max(0,sub-desc),din=val('osf_din'),pix=val('osf_pix'),deb=val('osf_deb'),cred=val('osf_cred'),pago=din+pix+deb+cred;
  var aviso=document.getElementById('osf_aviso');
  if(pago>total+0.009){if(aviso){aviso.style.display='block';aviso.innerHTML='⚠️ O total informado como recebido ('+M(pago)+') é maior que o total da OS ('+M(total)+').'};}else if(aviso)aviso.style.display='none';
  var prazo=Math.max(0,total-pago);
  var t=document.getElementById('osf_total'),pr=document.getElementById('osf_prazo'),pg=document.getElementById('osf_pago');
  if(t)t.value=total.toFixed(2);if(pr)pr.value=prazo.toFixed(2);if(pg)pg.textContent=M(pago);
  var box=document.getElementById('osf_prazo_box');if(box)box.style.display=prazo>0.009?'block':'none';
};

window.openPay=function(id){
  var o=(st.os||[]).find(x=>String(x.id)===String(id));if(!o)return alert('OS não encontrada.');
  var subtotal=totalOS(o);
  var html=`<div class="mhead"><h3>Receber / Faturar ${E(o.cod||('OS #'+o.num))}</h3><button class="btn" onclick="closeM()">Fechar</button></div>
  <div class="notice"><b>Cliente:</b> ${E(o.cliente||'—')}<br><b>Funcionário:</b> ${E(o.funcionario||'—')}<br><b>Valor da OS:</b> <b>${M(subtotal)}</b></div>
  <div class="card"><h3>1. Valor e desconto</h3><div class="form3">
    <div class="field"><label>Subtotal</label><input id="osf_subtotal" type="number" step="0.01" value="${subtotal.toFixed(2)}" readonly></div>
    <div class="field"><label>Desconto (R$)</label><input id="osf_desc" type="number" min="0" step="0.01" value="0.00" oninput="v1704Recalc()"></div>
    <div class="field"><label>Total após desconto</label><input id="osf_total" type="number" step="0.01" value="${subtotal.toFixed(2)}" readonly></div>
  </div></div>
  <div class="card"><h3>2. Quanto o cliente está pagando agora?</h3><div class="form4">
    <div class="field"><label>💵 Dinheiro</label><input id="osf_din" type="number" min="0" step="0.01" value="0" oninput="v1704Recalc()"></div>
    <div class="field"><label>PIX</label><input id="osf_pix" type="number" min="0" step="0.01" value="0" oninput="v1704Recalc()"></div>
    <div class="field"><label>Débito</label><input id="osf_deb" type="number" min="0" step="0.01" value="0" oninput="v1704Recalc()"></div>
    <div class="field"><label>Crédito</label><input id="osf_cred" type="number" min="0" step="0.01" value="0" oninput="v1704Recalc()"></div>
  </div><div class="notice" style="margin-top:10px">Recebido agora: <b id="osf_pago">R$ 0,00</b>. Você pode dividir o recebimento entre várias formas.</div></div>
  <div class="card"><h3>3. Saldo a prazo</h3><div class="form3">
    <div class="field"><label>Saldo que ficará a prazo</label><input id="osf_prazo" type="number" step="0.01" value="${subtotal.toFixed(2)}" readonly></div>
    <div id="osf_prazo_box" style="display:block;grid-column:span 2"><div class="form2"><div class="field"><label>Nº de parcelas</label><input id="osf_parcelas" type="number" min="1" max="36" value="1"></div><div class="field"><label>1º vencimento</label><input id="osf_venc" type="date" value="${addDays2(hoje(),30)}"></div></div></div>
  </div><div class="notice">Exemplo: OS de R$ 600, desconto de R$ 50, pagamento de R$ 200 em dinheiro → o sistema deixa R$ 350 automaticamente em Contas a Receber.</div></div>
  <div class="field"><label>Observação do pagamento</label><input id="osf_obs" placeholder="Ex.: entrada em dinheiro e restante a prazo"></div>
  <div id="osf_aviso" class="notice" style="display:none;border-color:#d84b4b;color:#ffb0b0"></div>
  <div class="actions"><button class="btn goldbtn" onclick="v1704ConfirmarRecebimento('${E(id)}')">Confirmar recebimento</button></div>`;
  modal(html);window.v1704Recalc();
};

window.v1704ConfirmarRecebimento=async function(id){
  var o=(st.os||[]).find(x=>String(x.id)===String(id));if(!o)return alert('OS não encontrada.');
  var subtotal=val('osf_subtotal'),desconto=val('osf_desc'),total=Math.max(0,subtotal-desconto);
  var pagamentos=[['Dinheiro',val('osf_din')],['PIX',val('osf_pix')],['Débito',val('osf_deb')],['Crédito',val('osf_cred')]].filter(x=>x[1]>0.009);
  var recebido=pagamentos.reduce((a,x)=>a+x[1],0);if(recebido>total+0.009)return alert('O valor recebido agora é maior que o total após desconto. Corrija os valores.');
  var saldo=Math.max(0,total-recebido),parcelas=Math.max(1,parseInt(V('osf_parcelas')||'1',10)),venc=V('osf_venc')||addDays2(hoje(),30),obs=V('osf_obs').trim();
  if(saldo>0.009&&!venc)return alert('Informe o primeiro vencimento do saldo a prazo.');
  if(!confirm('Confirmar faturamento?\n\nSubtotal: '+M(subtotal)+'\nDesconto: '+M(desconto)+'\nTotal: '+M(total)+'\nRecebido agora: '+M(recebido)+'\nA prazo: '+M(saldo)))return;
  st.vendas=Array.isArray(st.vendas)?st.vendas:[];st.caixa=Array.isArray(st.caixa)?st.caixa:[];st.contas=Array.isArray(st.contas)?st.contas:[];
  var venda={id:uid2(),num:st.seqVenda++,data:hoje(),cliente:o.cliente,origem:o.cod||('OS #'+o.num),osId:o.id,funcionario:o.funcionario||'',funcionarioId:o.funcionarioId||'',forma:saldo>0.009?(recebido>0.009?'Misto + A prazo':'A prazo'):(pagamentos.length>1?'Misto':(pagamentos[0]?.[0]||'Quitado')),subtotal:subtotal,desconto:desconto,total:total,entrada:recebido,saldoPrazo:saldo,status:saldo>0.009?(recebido>0.009?'Parcial / a receber':'A receber'):'Recebida',obs:obs,pagamentos:pagamentos.map(x=>({forma:x[0],valor:x[1]})),itens:(o.pecas||[]).map(p=>({prodId:p.prodId,nome:p.nome,qtd:p.qtd,preco:p.preco})),mao:(o.mao||[]).map(m=>({...m}))};
  if(typeof v14SaleCode==='function')venda.cod=v14SaleCode();
  st.vendas.push(venda);
  pagamentos.forEach(function(p){st.caixa.push({id:uid2(),data:hoje(),tipo:'Entrada',desc:(venda.cod||('Venda #'+venda.num))+' - '+(o.cliente||'')+' - '+p[0],cat:'Venda/OS',valor:p[1],forma:p[0],vendaId:venda.id,osId:o.id})});
  if(saldo>0.009){var base=saldo/parcelas,acum=0;for(var i=0;i<parcelas;i++){var valor=i===parcelas-1?Math.round((saldo-acum)*100)/100:Math.round(base*100)/100;acum+=valor;var c={id:uid2(),tipo:'A Receber',cliente:o.cliente,desc:(venda.cod||('Venda #'+venda.num))+' - '+o.cliente+' - Parcela '+(i+1)+'/'+parcelas,venc:addDays2(venc,30*i),valor:valor,valorOriginal:valor,status:'Aberto',vendaId:venda.id,osId:o.id,parcela:i+1,totalParcelas:parcelas};if(typeof v14ContaCode==='function')c.cod=v14ContaCode();st.contas.push(c)}}
  o.status='Faturada';o.faturadaEm=new Date().toISOString();o.vendaId=venda.id;o.descontoFaturamento=desconto;o.totalFaturado=total;o.recebidoFaturamento=recebido;o.saldoPrazoFaturamento=saldo;o.pagamentos=pagamentos.map(x=>({forma:x[0],valor:x[1]}));
  if(typeof logAudit==='function')logAudit('OS faturada',(o.cod||o.num)+' / total '+M(total)+' / desconto '+M(desconto)+' / recebido '+M(recebido)+' / prazo '+M(saldo));
  closeM();await Promise.resolve(save());if(typeof go==='function')go('vendas');alert('OS faturada com sucesso.\nRecebido agora: '+M(recebido)+'\nSaldo a prazo: '+M(saldo));
};

/* compatibilidade: qualquer chamada antiga de receberOS usa o novo fluxo */
window.receberOS=function(id){return window.v1704ConfirmarRecebimento(id)};
})();