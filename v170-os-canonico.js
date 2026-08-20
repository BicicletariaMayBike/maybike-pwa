/* May Bike V17.0.3 - OS canônica: peças e mão de obra separadas, sem duplicação */
(function(){'use strict';
function n(v){return Number(v||0)}
function norm(v){return String(v==null?'':v).trim().toLocaleLowerCase('pt-BR')}
function estoqueIds(){return new Set((st.estoque||[]).map(e=>String(e.id)))}
function maoKey(m){return norm(m&& (m.desc||m.nome||m.servico||''))+'|'+n(m&& (m.valor||m.preco||0)).toFixed(2)}
function uniqMao(list){var seen=new Set(),out=[];(list||[]).forEach(function(m){var k=maoKey(m);if(!k||k==='|0.00')return;if(seen.has(k))return;seen.add(k);out.push({desc:String(m.desc||m.nome||m.servico||'').trim(),valor:n(m.valor||m.preco||0)})});return out}
function cleanPecas(list){var ids=estoqueIds(),seen=new Set(),out=[];(list||[]).forEach(function(p){var id=String(p.prodId||p.id||'');if(!id||!ids.has(id))return;var q=n(p.qtd||1);if(q<=0)return;var key=id+'|'+q+'|'+n(p.preco).toFixed(2);if(seen.has(key))return;seen.add(key);var e=(st.estoque||[]).find(x=>String(x.id)===id);out.push({prodId:id,nome:String((p.nome|| (e&&e.desc)||'')).trim(),qtd:q,preco:n(p.preco!=null?p.preco:(e&&e.venda))})});return out}
function sanitizeOS(o){if(!o)return o;o.mao=uniqMao(o.mao);o.pecas=cleanPecas(o.pecas);return o}
(st.os||[]).forEach(sanitizeOS);

/* bloqueia repetir serviço na tela */
window.addMaoCadastrada=function(){var sel=document.getElementById('mao_select');if(!sel||!sel.value)return alert('Selecione uma mão de obra cadastrada.');var m=(st.maoObra||[]).find(x=>String(x.id)===String(sel.value));if(!m)return;var key=norm(m.nome)+'|'+n(m.valor).toFixed(2);var existe=[...document.querySelectorAll('#maoBox .lineitem')].some(function(r){var d=r.querySelector('.m_desc'),v=r.querySelector('.m_valor');return norm(d&&d.value)+'|'+n(v&&v.value).toFixed(2)===key});if(existe)return alert('Esta mão de obra já foi adicionada nesta OS.');if(typeof addMaoLine==='function')addMaoLine(m.nome,m.valor);sel.value=''};

/* substitui salvamento da OS por fluxo único, sem aproveitar patches antigos */
window.saveOS=async function(id){try{
  var old=(st.os||[]).find(x=>String(x.id)===String(id));
  var get=id=>document.getElementById(id);
  var cli=get('o_cli'),funcEl=get('o_func'),data=get('o_data'),bike=get('o_bike'),def=get('o_def'),status=get('o_status'),desc=get('o_desc'),obs=get('o_obs');
  if(!cli||!bike)return alert('Formulário da OS não carregou corretamente.');
  var pecas=cleanPecas(typeof collectPecas==='function'?collectPecas():[]);
  var mao=uniqMao(typeof collectMao==='function'?collectMao():[]);
  var func=(st.funcionarios||[]).find(f=>String(f.id)===String(funcEl&&funcEl.value));
  var obj={
    id:id||uid(),num:old?old.num:st.seqOS++,cod:old&&old.cod,
    data:(data&&data.value)||today(),cliente:cli.value,bike:bike.value,
    defeito:(def&&def.value)||'',funcionarioId:(funcEl&&funcEl.value)||'',funcionario:func?func.nome:'',
    status:(status&&status.value)||'Aberta',desc:n(desc&&desc.value),pecas:pecas,mao:mao,obs:(obs&&obs.value)||'',
    baixouEstoque:old?!!old.baixouEstoque:false,
    garantiaAte:old&&old.garantiaAte,garantiaPecasAte:old&&old.garantiaPecasAte,garantiaMaoObraAte:old&&old.garantiaMaoObraAte
  };
  if(!obj.cliente||!obj.bike)return alert('Informe cliente e bike.');
  if(obj.status==='Pronta para retirada'&&!obj.baixouEstoque){
    for(var p of obj.pecas){var e=(st.estoque||[]).find(x=>String(x.id)===String(p.prodId));if(e){if(n(e.qtd)<n(p.qtd))return alert('Estoque insuficiente para: '+e.desc);e.qtd=n(e.qtd)-n(p.qtd)}}obj.baixouEstoque=true;
  }
  if(old){var ix=st.os.findIndex(x=>String(x.id)===String(id));st.os[ix]=obj}else st.os.push(obj);
  if(typeof logAudit==='function')logAudit(old?'OS atualizada':'OS criada',(obj.cod||('#'+obj.num))+' / peças '+obj.pecas.length+' / mão de obra '+obj.mao.length);
  if(typeof closeM==='function')closeM();
  await save();
}catch(e){console.error('Erro ao salvar OS',e);alert('Erro ao salvar OS: '+(e.message||e))}};

/* limpa dados antigos corrompidos ao abrir a OS */
var openBase=window.openOS;
if(typeof openBase==='function')window.openOS=function(id){var o=(st.os||[]).find(x=>String(x.id)===String(id));if(o)sanitizeOS(o);return openBase.apply(this,arguments)};
})();