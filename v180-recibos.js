/* May Bike ERP V18.0 - Recibos Manuais */
(function(){'use strict';
const N=v=>Number(String(v==null?'':v).replace(',','.'))||0;
const E=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const V=id=>{const e=document.getElementById(id);return e?e.value:''};
const M=v=>typeof money==='function'?money(v):('R$ '+N(v).toLocaleString('pt-BR',{minimumFractionDigits:2}));
const hoje=()=>typeof today==='function'?today():new Date().toISOString().slice(0,10);
const uid2=()=>typeof uid==='function'?uid():Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function A(k){if(!Array.isArray(st[k]))st[k]=[];return st[k]}
A('recibosManuais');st.seqReciboManual=Math.max(1,Number(st.seqReciboManual||1));
function pad(n){return String(n).padStart(6,'0')}
function cliId(id){return A('clientes').find(c=>String(c.id)===String(id))||null}
function opts(){return A('clientes').slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'})).map(c=>`<option value="${E(c.id)}">${E(c.nome||'Sem nome')}</option>`).join('')}
function extensoInteiro(n){const u=['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','quatorze','quinze','dezesseis','dezess