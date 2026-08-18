/* May Bike V15.7.2 - busca final de cliente, carregada por ultimo */
(function(){'use strict';
function E(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function listaClientes(){return (typeof st!=='undefined'&&Array.isArray(st.clientes)?st.clientes:[]).slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base',numeric:true}))}
function montarBusca(){
  var campo=document.getElementById('vr_cli'); if(!campo)return;
  var field=campo.closest('.field')||campo.parentElement; if(!field)return;
  var valor=String(campo.value||'').trim()||'Cliente sem cadastro';
  var antigo=document.getElementById('mb1572_cli_wrap'); if(antigo)antigo.remove();
  var detalhes=document.getElementById('mb1572_cli_detalhes'); if(detalhes)detalhes.remove();
  var painel=document.getElementById('mb1572_cli_painel'); if(painel)painel.remove();
  var wrap=document.createElement('div');wrap.id='mb1572_cli_wrap';wrap.style.cssText='display:flex;gap:8px;align-items:center';
  var input=document.createElement('input');input.id='vr_cli';input.value=valor;input.placeholder='Cliente sem cadastro';input.style.flex='1';
  var btn=document.createElement('button');btn.type='button';btn.className='btn goldbtn';btn.textContent='🔍 Buscar cliente';btn.style.whiteSpace='nowrap';
  campo.replaceWith(wrap);wrap.appendChild(input);wrap.appendChild(btn);
  var det=document.createElement('div');det.id='mb1572_cli_detalhes';det.style.display='none';field.appendChild(det);
  var panel=document.createElement('div');panel.id='mb1572_cli_painel';panel.className='card';panel.style.cssText='display:none;margin-top:8px;position:relative;z-index:99999';panel.innerHTML='<div style="display:flex;gap:8px"><input id="mb1572_cli_busca" placeholder="Digite nome, WhatsApp, CPF ou e-mail" style="flex:1"><button type="button" class="btn" id="mb1572_cli_fechar">Fechar</button></div><div id="mb1572_cli_lista" style="max-height:300px;overflow:auto;margin-top:10px"></div>';field.appendChild(panel);
  function render(q){var box=document.getElementById('mb1572_cli_lista');if(!box)return;var t=String(q||'').trim().toLocaleLowerCase('pt-BR');var arr=listaClientes().filter(c=>!t||[c.nome,c.whats,c.whatsapp,c.cpf,c.email,c.end,c.endereco,c.cidade].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(t)));box.innerHTML=arr.length?arr.slice(0,100).map(c=>'<button type="button" class="btn" data-cli="'+E(c.id)+'" style="display:block;width:100%;text-align:left;margin-bottom:6px"><b>'+E(c.nome||'Sem nome')+'</b><br><small>'+E(c.whats||c.whatsapp||'Sem WhatsApp')+(c.cpf?' • CPF '+E(c.cpf):'')+'</small></button>').join(''):'<div class="notice">Nenhum cliente encontrado.</div>';box.querySelectorAll('[data-cli]').forEach(b=>b.onclick=function(){var c=listaClientes().find(x=>String(x.id)===String(this.dataset.cli));if(!c)return;input.value=c.nome||'Cliente sem cadastro';window.__mbVendaClienteId=c.id;var end=[c.end||c.endereco,c.numero,c.bairro,c.cidade,c.uf].filter(Boolean).join(' • ');det.innerHTML='<div class="notice" style="margin-top:8px"><b>'+E(c.nome||'Cliente')+'</b>'+(c.whats||c.whatsapp?'<br>📱 '+E(c.whats||c.whatsapp):'')+(c.cpf?'<br>CPF: '+E(c.cpf):'')+(c.email?'<br>✉ '+E(c.email):'')+(end?'<br>📍 '+E(end):'')+'</div>';det.style.display='block';panel.style.display='none'});}
  btn.onclick=function(){panel.style.display='block';var s=document.getElementById('mb1572_cli_busca');if(s){s.value='';s.focus()}render('')};
  document.getElementById('mb1572_cli_fechar').onclick=function(){panel.style.display='none'};
  document.getElementById('mb1572_cli_busca').oninput=function(){render(this.value)};
}
window.addEventListener('load',function(){
  var base=window.openVendaRapida;
  if(typeof base==='function'&&!base.__mb1572){var wrap=function(){var r=base.apply(this,arguments);setTimeout(montarBusca,80);return r};wrap.__mb1572=true;window.openVendaRapida=wrap;}
});
})();