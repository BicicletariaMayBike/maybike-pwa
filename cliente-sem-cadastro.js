/* Cliente da venda: cliente sem cadastro + lista dos clientes cadastrados */
(function(){
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function prepararClienteVenda(){
    var c=document.getElementById('vr_cli');
    if(!c) return;
    var clientes=Array.isArray(window.st&&st.clientes)?st.clientes:[];
    clientes=clientes.slice().sort(function(a,b){return String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'})});
    var old=document.getElementById('vr_cli_lista');
    if(old) old.remove();
    var dl=document.createElement('datalist');
    dl.id='vr_cli_lista';
    dl.innerHTML='<option value="Cliente sem cadastro"></option>'+clientes.map(function(x){return '<option value="'+esc(x.nome||'')+'">'+esc((x.whats||x.whatsapp||x.cpf||''))+'</option>'}).join('');
    document.body.appendChild(dl);
    c.setAttribute('list','vr_cli_lista');
    c.setAttribute('autocomplete','off');
    c.placeholder='Digite ou selecione um cliente cadastrado';
    if(!String(c.value||'').trim()) c.value='Cliente sem cadastro';
    c.addEventListener('focus',function(){if(c.value==='Cliente sem cadastro')c.select()},{once:false});
  }
  window.addEventListener('load',function(){
    var original=window.openVendaRapida;
    if(typeof original==='function'){
      window.openVendaRapida=function(){
        var r=original.apply(this,arguments);
        setTimeout(prepararClienteVenda,20);
        return r;
      };
    }
    var salvar=window.saveVendaRapida;
    if(typeof salvar==='function'){
      window.saveVendaRapida=function(){
        var c=document.getElementById('vr_cli');
        if(c&&!String(c.value||'').trim()) c.value='Cliente sem cadastro';
        return salvar.apply(this,arguments);
      };
    }
  });
})();