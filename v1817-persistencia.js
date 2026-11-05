/* May Bike ERP V18.1.7 - armazenamento persistente e fila de salvamento */
(function(){
'use strict';
const DB_NAME='maybike_pdv_persistencia',DB_VERSION=1,STORE_NAME='estado';
const ARR=['clientes','funcionarios','maoObra','estoque','os','vendas','caixa','contas','recorrentes','bikes','agenda','audit','categoriasMargem','creditosCliente','recibosManuais','garantias','movEstoque','fechamentos','montagens'];
let dbPromise=null,saveQueue=Promise.resolve();
const clone=x=>JSON.parse(JSON.stringify(x==null?{}:x));
function openDB(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  if(!('indexedDB' in window))return reject(new Error('IndexedDB não disponível neste navegador'));
  const req=indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(STORE_NAME))d.createObjectStore(STORE_NAME)};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Falha ao abrir armazenamento persistente'));
 });
 return dbPromise;
}
async function readState(){
 const d=await openDB();
 return new Promise((resolve,reject)=>{
  const tx=d.transaction(STORE_NAME,'readonly'),req=tx.objectStore(STORE_NAME).get('principal');
  req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error||new Error('Falha ao ler dados locais'));
 });
}
async function writeState(state){
 const d=await openDB(),data=clone(state);
 return new Promise((resolve,reject)=>{
  const tx=d.transaction(STORE_NAME,'readwrite');
  tx.objectStore(STORE_NAME).put(data,'principal');
  tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error('Falha ao gravar dados locais'));
  tx.onabort=()=>reject(tx.error||new Error('Gravação local cancelada'));
 });
}
function key(x,i){if(x&&x.id!=null)return'id:'+x.id;if(x&&x.cod!=null)return'cod:'+x.cod;if(x&&x.num!=null)return'num:'+x.num;return'raw:'+JSON.stringify(x)+'#'+i}
function mergePersisted(current,persisted){
 const a=clone(current||{}),b=clone(persisted||{}),out={...a,...b};
 ARR.forEach(k=>{
  const map=new Map();
  (Array.isArray(a[k])?a[k]:[]).forEach((x,i)=>map.set(key(x,i),clone(x)));
  (Array.isArray(b[k])?b[k]:[]).forEach((x,i)=>map.set(key(x,i),clone(x)));
  out[k]=[...map.values()];
 });
 out.config={...(a.config||{}),...(b.config||{})};
 out.users=(b.users&&b.users.length)?b.users:(a.users||[]);
 ['seqOS','seqVenda','seqReciboManual'].forEach(k=>out[k]=Math.max(Number(a[k]||1),Number(b[k]||1)));
 return out;
}
function status(t,detail){
 const el=document.getElementById('cloud');
 if(el){el.textContent=t;el.title=detail||t}
}
async function localProtect(){
 try{await writeState(st);return true}
 catch(e){
  console.error('V18.1.7 IndexedDB save failed',e);
  try{localStorage.setItem('maybike_v1817_emergency',JSON.stringify({date:new Date().toISOString(),state:clone(st)}));return true}
  catch(e2){console.error('V18.1.7 emergency save failed',e2);status('⛔ FALHA AO SALVAR',String(e2.message||e2));throw new Error('Não foi possível gravar nem no armazenamento persistente nem na cópia de emergência. Exporte um backup e não feche esta página.')}
 }
}
const oldLoad=window.loadCloud;
if(typeof oldLoad==='function'){
 window.loadCloud=async function(){
  let result;
  try{result=await oldLoad.apply(this,arguments)}catch(e){console.error('load cloud V18.1.7',e)}
  try{
   let persisted=await readState();
   if(!persisted){
    try{const emergency=JSON.parse(localStorage.getItem('maybike_v1817_emergency')||'null');if(emergency&&emergency.state)persisted=emergency.state}catch(e){}
   }
   if(persisted){
    st=mergePersisted(st,persisted);
    await writeState(st);
    try{localStorage.setItem((typeof STORE!=='undefined'&&STORE)||'maybike_v11_pwa_cloud',JSON.stringify(st))}catch(e){console.warn('localStorage cheio; IndexedDB permanece como cópia principal',e)}
    if(typeof render==='function'&&typeof current!=='undefined')render(current);
    status('💾 Dados protegidos','Dados locais persistentes combinados com a nuvem. Confira a sincronização antes de usar outro computador.');
   }else await writeState(st);
  }catch(e){console.error('V18.1.7 load persistent data',e);status('⚠️ Falha ao ler cópia local',e.message||String(e))}
  return st||result;
 };
}
const oldSave=window.save;
window.save= function(){
 const args=arguments;
 saveQueue=saveQueue.then(async()=>{
  await localProtect();
  let cloudResult=false,cloudError=null;
  if(typeof oldSave==='function'){
   try{cloudResult=await oldSave.apply(this,args)}catch(e){cloudError=e;console.error('V18.1.7 cloud save',e)}
  }
  try{await writeState(st)}catch(e){cloudError=cloudError||e;console.error(e)}
  try{localStorage.setItem((typeof STORE!=='undefined'&&STORE)||'maybike_v11_pwa_cloud',JSON.stringify(st))}catch(e){console.warn('localStorage indisponível; IndexedDB preservado',e)}
  if(cloudResult===false||cloudError){
   status('💾 Salvo neste computador','A cópia persistente local foi gravada. A nuvem ainda não confirmou; não use outro computador até sincronizar. '+(cloudError?.message||''));
   return false;
  }
  status('☁️ Salvo e protegido','Gravação local persistente concluída. '+new Date().toLocaleString('pt-BR'));
  return true;
 }).catch(e=>{
  console.error('V18.1.7 save queue',e);
  status('⛔ FALHA AO SALVAR',e.message||String(e));
  alert('ATENÇÃO: o sistema não conseguiu confirmar a gravação.\n\n'+(e.message||e)+'\n\nNão feche esta página. Faça uma exportação de backup.');
  return false;
 });
 return saveQueue;
};
window.v1817Diagnostico=function(){
 const size=(()=>{try{return new Blob([JSON.stringify(st)]).size}catch(e){return 0}})();
 alert('Diagnóstico de armazenamento\n\nIndexedDB: '+(window.indexedDB?'disponível':'indisponível')+'\nLocalStorage: '+(function(){try{localStorage.setItem('__mb_test','1');localStorage.removeItem('__mb_test');return'disponível'}catch(e){return'ERRO: '+e.message}}())+'\nTamanho aproximado dos dados: '+(size/1024).toFixed(1)+' KB\n\nSe o indicador mostrar “Salvo neste computador”, os dados estão protegidos localmente. Para usar outro computador, a nuvem também precisa confirmar.');
};
function inject(){
 const top=document.querySelector('.top .right');
 if(!top||document.getElementById('v1817-diag-btn'))return;
 const b=document.createElement('button');b.id='v1817-diag-btn';b.className='btn';b.textContent='🛡️ Diagnóstico';b.title='Verificar o armazenamento do PDV';b.onclick=window.v1817Diagnostico;top.insertBefore(b,top.firstChild);
}
setTimeout(inject,200);setTimeout(inject,1200);
})();