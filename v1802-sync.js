/* May Bike ERP V18.0.2 - sincronização segura multi-computador */
(function(){'use strict';
const SYNC_DOC='state_v9';
const ARR_KEYS=['clientes','funcionarios','maoObra','estoque','os','vendas','caixa','contas','recorrentes','bikes','agenda','audit','categoriasMargem','creditosCliente','recibosManuais','garantias','movEstoque','fechamentos'];
const STORE_KEY=(typeof STORE!=='undefined'&&STORE)||'maybike_v11_pwa_cloud';
const BACKUP_KEY='maybike_v1802_sync_backups';
function clone(x){return JSON.parse(JSON.stringify(x==null?{}:x))}
function nowISO(){return new Date().toISOString()}
function deviceId(){let id=localStorage.getItem('maybike_device_id');if(!id){id='dev-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);localStorage.setItem('maybike_device_id',id)}return id}
function recKey(x,i){if(x&&x.id!=null)return 'id:'+String(x.id);if(x&&x.cod!=null)return 'cod:'+String(x.cod);return 'raw:'+JSON.stringify(x)+'#'+i}
function mergeArr(local,remote,remoteWins){const out=[],map=new Map();(Array.isArray(local)?local:[]).forEach((x,i)=>map.set(recKey(x,i),clone(x)));(Array.isArray(remote)?remote:[]).forEach((x,i)=>{const k=recKey(x,i);if(!map.has(k)||remoteWins)map.set(k,clone(x))});map.forEach(v=>out.push(v));return out}
function mergedState(local,remote,remoteWins){local=clone(local||{});remote=clone(remote||{});let out={...local,...remote};ARR_KEYS.forEach(k=>{out[k]=mergeArr(local[k],remote[k],remoteWins)});out.config={...(local.config||{}),...(remote.config||{})};out.users=(remote.users&&remote.users.length)?remote.users:(local.users||[]);out.seqOS=Math.max(Number(local.seqOS||1),Number(remote.seqOS||1));out.seqVenda=Math.max(Number(local.seqVenda||1),Number(remote.seqVenda||1));out.seqReciboManual=Math.max(Number(local.seqReciboManual||1),Number(remote.seqReciboManual||1));return out}
function backup(label,obj){try{let a=JSON.parse(localStorage.getItem(BACKUP_KEY)||'[]');a.unshift({data:nowISO(),label,state:clone(obj)});a=a.slice(0,8);localStorage.setItem(BACKUP_KEY,JSON.stringify(a))}catch(e){console.warn('backup sync',e)}}
function setStatus(txt,title){const el=document.getElementById('cloud');if(el){el.textContent=txt;if(title)el.title=title}const info=document.getElementById('v1802-sync-info');if(info)info.textContent=title||txt}
function persistLocal(){try{localStorage.setItem(STORE_KEY,JSON.stringify(st))}catch(e){console.error(e)}}
function ensureButton(){if(document.getElementById('v1802-sync-btn'))return;const cloud=document.getElementById('cloud');if(!cloud)return;const b=document.createElement('button');b.id='v1802-sync-btn';b.className='btn';b.textContent='🔄 Sincronizar';b.title='Buscar dados da nuvem e enviar registros locais que ainda não estão sincronizados';b.onclick=()=>window.v1802SyncNow(true);cloud.insertAdjacentElement('afterend',b);const i=document.createElement('span');i.id='v1802-sync-info';i.className='pill';i.style.display='none';b.insertAdjacentElement('afterend',i)}
const CHUNK_META='state_v10_meta',CHUNK_PREFIX='state_v10_chunk_',CHUNK_SIZE=700000;
async function getRemote(){
 if(typeof cloudOK==='undefined'||!cloudOK||typeof db==='undefined'||!db)throw new Error('Firebase indisponível');
 const col=db.collection('maybike'),metaSnap=await col.doc(CHUNK_META).get();
 if(metaSnap.exists){
  const meta=metaSnap.data()||{},count=Number(meta.chunks||0);
  if(!Number.isInteger(count)||count<1||count>500)throw new Error('Metadados da sincronização dividida inválidos.');
  const snaps=await Promise.all(Array.from({length:count},(_,i)=>col.doc(CHUNK_PREFIX+i).get()));
  let json='';
  snaps.forEach((s,i)=>{if(!s.exists)throw new Error('Parte '+(i+1)+' dos dados não encontrada na nuvem.');json+=(s.data()||{}).part||''});
  try{return JSON.parse(json)}catch(e){throw new Error('Não foi possível reconstruir os dados da nuvem: '+e.message)}
 }
 const legacy=await col.doc(SYNC_DOC).get();
 return legacy.exists?legacy.data():null;
}
async function putRemote(data){
 if(typeof db==='undefined'||!db)throw new Error('Firestore não inicializado');
 const json=JSON.stringify(clone(data)),parts=[];
 for(let i=0;i<json.length;){
  let end=Math.min(i+CHUNK_SIZE,json.length);
  if(end<json.length){const code=json.charCodeAt(end-1);if(code>=0xD800&&code<=0xDBFF)end--;}
  parts.push(json.slice(i,end));i=end;
 }
 if(!parts.length)parts.push('{}');
 if(parts.length>499)throw new Error('Banco muito grande para sincronização em uma única operação ('+parts.length+' partes).');
 const col=db.collection('maybike'),batch=db.batch();
 parts.forEach((part,i)=>batch.set(col.doc(CHUNK_PREFIX+i),{part,index:i,updatedAt:nowISO()}));
 batch.set(col.doc(CHUNK_META),{version:10,chunks:parts.length,chars:json.length,updatedAt:nowISO()});
 await batch.commit();
}
async function doLoad(){ensureButton();let local={};try{const raw=localStorage.getItem(STORE_KEY);if(raw)local=JSON.parse(raw)}catch(e){}
if(typeof loadLocal==='function')try{loadLocal();local=clone(st)}catch(e){}
backup('antes de carregar nuvem',local);
if(typeof cloudOK==='undefined'||!cloudOK){st=mergedState(st,local,false);persistLocal();if(typeof migrateV13==='function')migrateV13();setStatus('💾 Somente local','Firebase indisponível. Dados preservados neste computador.');return st}
try{setStatus('☁️ Sincronizando...','Buscando dados mais recentes');const remote=await getRemote();if(!remote){st=clone(local);st.__sync={rev:1,lastSync:nowISO(),device:deviceId()};persistLocal();await putRemote(st);setStatus('☁️ Nuvem conectada','Primeira sincronização concluída em '+new Date().toLocaleString('pt-BR'));return st}
const remoteRev=Number(remote.__sync?.rev||0),localRev=Number(local.__sync?.rev||0);st=mergedState(local,remote,true);const localOnly=ARR_KEYS.some(k=>{const r=new Set((remote[k]||[]).map((x,i)=>recKey(x,i)));return (local[k]||[]).some((x,i)=>!r.has(recKey(x,i)))});let rev=remoteRev;if(localOnly){rev=remoteRev+1;st.__sync={rev,lastSync:nowISO(),device:deviceId(),mergedLocal:true};await putRemote(st)}else st.__sync={...(remote.__sync||{}),rev:remoteRev,lastSync:nowISO(),device:deviceId()};persistLocal();if(typeof migrateV13==='function')migrateV13();setStatus('☁️ Sincronizado','Última sincronização: '+new Date().toLocaleString('pt-BR')+' • revisão '+rev);return st}catch(e){console.error('sync load',e);st=mergedState(st,local,false);persistLocal();if(typeof migrateV13==='function')migrateV13();setStatus('⚠️ Nuvem indisponível','Usando cópia local. Nada foi apagado. '+(e.message||e));return st}}
async function doSave(){ensureButton();backup('antes de salvar',st);persistLocal();if(typeof cloudOK==='undefined'||!cloudOK){setStatus('💾 Salvo local','Sem conexão com a nuvem. Será sincronizado quando possível.');if(typeof render==='function'&&typeof current!=='undefined')render(current);return false}
try{setStatus('☁️ Salvando...','Protegendo contra sobrescrita por outro computador');const remote=(await getRemote())||{},remoteRev=Number(remote.__sync?.rev||0),localRev=Number(st.__sync?.rev||0);const remoteNewer=remoteRev>localRev;let merged=mergedState(st,remote,remoteNewer);merged.__sync={rev:Math.max(remoteRev,localRev)+1,lastSync:nowISO(),device:deviceId(),conflictMerged:remoteNewer};st=merged;persistLocal();await putRemote(st);setStatus('☁️ Sincronizado','Salvo na nuvem: '+new Date().toLocaleString('pt-BR')+' • revisão '+st.__sync.rev+(remoteNewer?' • alterações de outro computador preservadas':''));if(typeof render==='function'&&typeof current!=='undefined')render(current);return true}catch(e){console.error('sync save',e);persistLocal();setStatus('⚠️ Pendente de sincronizar','Dados salvos neste computador, mas a nuvem falhou. '+(e.message||e));if(typeof render==='function'&&typeof current!=='undefined')render(current);return false}}
window.v1802SyncNow=async function(showAlert){ensureButton();backup('antes de sincronizar manualmente',st);try{const local=clone(st),remote=(await getRemote())||{},remoteRev=Number(remote.__sync?.rev||0),localRev=Number(local.__sync?.rev||0);st=mergedState(local,remote,true);st.__sync={rev:Math.max(remoteRev,localRev)+1,lastSync:nowISO(),device:deviceId(),manual:true};persistLocal();await putRemote(st);if(typeof migrateV13==='function')migrateV13();if(typeof render==='function'&&typeof current!=='undefined')render(current);setStatus('☁️ Sincronizado','Sincronização manual concluída: '+new Date().toLocaleString('pt-BR')+' • revisão '+st.__sync.rev);if(showAlert)alert('Sincronização concluída.\n\nOs registros deste computador e da nuvem foram combinados sem apagar históricos.')}catch(e){console.error(e);setStatus('⚠️ Falha ao sincronizar','Nada foi apagado. '+(e.message||e));if(showAlert){const bytes=(()=>{try{return new Blob([JSON.stringify(st)]).size}catch(_){return 0}})();const code=e&&e.code?String(e.code):'sem código';const msg=e&&e.message?String(e.message):String(e);alert('Não foi possível sincronizar com a nuvem. Os dados locais foram preservados neste computador.\n\nDetalhe do Firebase: '+code+' — '+msg+'\n\nTamanho aproximado dos dados: '+(bytes/1024).toFixed(1)+' KB.\n\nEnvie uma foto desta mensagem para identificar a correção necessária.')}}};
window.loadCloud=doLoad;
window.save=doSave;
setTimeout(ensureButton,0);setTimeout(ensureButton,800);
})();