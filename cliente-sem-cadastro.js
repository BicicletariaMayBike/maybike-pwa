/* Cliente da venda: select real com clientes cadastrados + cliente sem cadastro */
(function(){
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function prepararClienteVenda(){
    var campo=document.getElementById('vr_cli');
    if(!campo) return;
    var clientes=(typeof st!=='undefined' && Array.isArray(st.clientes)) ? st.clientes.slice() : [];
    clientes.sort(function(a,b){return String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base',numeric:true})});
    var valorAtual=String(campo.value||'').trim()||'Cliente sem cadastro';
    if(campo.tagName==='SELECT'){
      campo.innerHTML='<option value="Cliente sem cadastro">Cliente sem cadastro</option>'+clientes.map(function(x){var nome=String(x.nome||'').trim();return nome?'<option value="'+esc(nome)+'">'+esc(nome)+(x.whats?' — '+esc(x.whats):'')+'</option>':''}).join('');
      campo.value=clientes.some(function(x){return String(x.nome||'').trim()===valorAtual})?valorAtual:'Cliente sem cadastro';
      return;
    }
    var sel=document.createElement('select');
    Array.prototype.slice.call(campo.attributes||[]).forEach(function(a){if(a.name!=='type'&&a.name!=='list'&&a.name!=='autocomplete'&&a.name!=='value')sel.setAttribute(a.name,a.value)});
    sel.id='vr_cli';
    sel.name=campo.name||'vr_cli';
    sel.innerHTML='<option value="Cliente sem cadastro">Cliente sem cadastro</option>'+clientes.map(function(x){var nome=String(x.nome||'').trim();if(!nome)return'';var extra=x.whats||x.whatsapp||x.cpf||'';return '<option value="'+esc(nome)+'">'+esc(nome)+(extra?' — '+esc(extra):'')+'</option>'}).join('');
    campo.replaceWith(sel);
    sel.value=clientes.some(function(x){return String(x.nome||'').trim()===valorAtual})?valorAtual:'Cliente sem cadastro';
  }
  function instalar(){
    var original=window.openVendaRapida;
    if(typeof original==='function'&&!original.__mbClientePatch){
      var wrapped=function(){var r=original.apply(this,arguments);setTimeout(prepararClienteVenda,30);return r};
      wrapped.__mbClientePatch=true;
      window.openVendaRapida=wrapped;
    }
    var salvar=window.saveVendaRapida;
    if(typeof salvar==='function'&&!salvar.__mbClientePatch){
      var saveWrapped=function(){var c=document.getElementById('vr_cli');if(c&&!String(c.value||'').trim())c.value='Cliente sem cadastro';return salvar.apply(this,arguments)};
      saveWrapped.__mbClientePatch=true;
      window.saveVendaRapida=saveWrapped;
    }
  }
  window.addEventListener('load',instalar);
  setTimeout(instalar,0);
})();