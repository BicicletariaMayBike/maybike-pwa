/* May Bike ERP V17.0 - corrige mão de obra duplicada em OS */
(function(){'use strict';
function A(k){if(!Array.isArray(st[k]))st[k]=[];return st[k]}
function norm(v){return String(v==null?'':v).trim().toLocaleLowerCase('pt-BR')}
function chave(m){return [m&&m.id||m&&m.maoObraId||m&&m.servicoId||'',norm(m&&m.nome||m&&m.desc||m&&m.servico||''),Number(m&&m.valor||m&&m.preco||0).toFixed(2),String(m&&m.funcionarioId||m&&m.funcionario||'')].join('|')}
function dedupeMao(lista){if(!Array.isArray(lista))return[];var seen=new Set(),out=[];lista.forEach(function(m){var k=chave(m);if(!seen.has(k)){seen.add(k);out.push(m)}});return out}
function corrigirOS(){var alterou=false;A('os').forEach(function(o){if(!Array.isArray(o.mao))return;var antes=o.mao.length,novo=dedupeMao(o.mao);if(novo.length!==antes){o.mao=novo;alterou=true}});return alterou}
window.mbDedupeMaoOS=dedupeMao;

/* impede salvar duplicado novamente */
var saveBase=window.save;if(typeof saveBase==='function'&&!saveBase.__mbMaoDedupe){var w=async function(){corrigirOS();return saveBase.apply(this,arguments)};w.__mbMaoDedupe=true;window.save=w}

/* corrige registros já duplicados nesta sessão e atualiza a tela */
function aplicar(){try{if(corrigirOS()){if(typeof save==='function')Promise.resolve(save()).catch(function(e){console.warn(e)})}if(typeof current!=='undefined'&&current==='os'&&typeof render==='function')render('os')}catch(e){console.warn('Fix mão de obra duplicada',e)}}
window.addEventListener('load',function(){setTimeout(aplicar,700)});
setTimeout(aplicar,1200);
})();