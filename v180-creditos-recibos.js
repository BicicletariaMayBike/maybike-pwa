/* May Bike ERP V18.0 - Créditos/Adiantamentos, Recibos Manuais e CRM */
(function(){'use strict';
const N=v=>Number(String(v==null?'':v).replace(',','.'))||0;
const E=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const V=id=>{const e=document.getElementById(id);return e?e.value:''};
const M=v=>typeof money==='function'?money(v):('R$ '+N(v).toLocaleString('pt-BR',{minimumFractionDigits:2}));
const hoje=()=>typeof today==='function'?today():new Date().toISOString().slice(0,10);
const uid2=()=>typeof uid==='function'?uid():Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function A(k){if(!Array.isArray(st[k]))st[k]=[];return st[k]}
function init(){A('creditosCliente');A('recibosManuais');st.seqReciboManual=Math.max(1,Number(st.seqReciboManual||1));}
init();

function clienteById(id){return A('clientes').find(c=>String(c.id)===String(id))||null}
function clienteByNome(nome){return A('clientes').find(c=>String(c.nome||'').trim().toLocaleLowerCase('pt-BR')===String(nome||'').trim().toLocaleLowerCase('pt-BR'))||null}
function usuario(){try{return JSON.parse(sessionStorage.mbUser||'{}').nome||'Sistema'}catch(e){return'Sistema'}}
function saldoCredito(id){return A('creditosCliente').filter(x=>String(x.clienteId)===String(id)&&x.status!=='Cancelado').reduce((a,x)=>a+N(x.valor),0)}
window.v18SaldoCredito=saldoCredito;
function creditoDisponivelPorNome(nome){const c=clienteByNome(nome);return c?saldoCredito(c.id):0}
function movCredito(c,tipo,valor,ref,meta={}){const sinal=tipo==='Crédito lançado'||tipo==='Estorno de uso'?Math.abs(N(valor)):-Math.abs(N(valor));const m={id:uid2(),data:hoje(),dataHora:new Date().toISOString(),clienteId:c.id,cliente:c.nome,tipo,valor:sinal,referencia:ref||'',usuario:usuario(),...meta};A('creditosCliente').push(m);return m}

/* ===== EXTENSO ===== */
function valorExtenso(v){let inteiro=Math.floor(N(v)),cent=Math.round((N(v)-inteiro)*100);const u=['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','quatorze','quinze','dezesseis