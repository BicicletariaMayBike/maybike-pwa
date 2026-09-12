/* May Bike ERP V18.0.4 - reconexão simples da nuvem */
(function(){'use strict';
function status(t,tip){var e=document.getElementById('cloud');if(e){e.textContent=t;e.title=tip||t}}
window.v1804ReconectarNuvem=async function(){
  try{
    status('☁️ Reconectando...','Testando Firebase');
    if(typeof firebase==='undefined'||!firebase.firestore)throw new Error('Firebase não carregado nesta página.');
    if(typeof db==='undefined'||!db)throw new Error('Firestore não inicializado.');
    await db.collection('maybike').doc('state_v9').get();
    if(typeof cloudOK!=='undefined')cloudOK=true;
    status('☁️ Nuvem conectada','Firebase conectado em '+new Date().toLocaleString('pt-BR'));
    if(typeof window.v1802SyncNow==='function')await window.v1802SyncNow(false);
    return true;
  }catch(e){
    console.error('reconectar nuvem',e);
    var c=String(e&&e.code||''),m=String(e&&e.message||e);
    if(c.includes('permission-denied'))status('⚠️ Sem permissão na nuvem',m);
    else if(c.includes('unavailable'))status('⚠️ Nuvem sem conexão',m);
    else status('⚠️ Nuvem indisponível',m);
    return false;
  }
};
setTimeout(function(){window.v1804ReconectarNuvem()},1200);
})();