'use strict';
const el=id=>document.getElementById(id);
let session=null,expiryTimer;
async function api(path,body){
  const response=await fetch(path,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:body===undefined?{}:{'Content-Type':'application/json','X-HS-Request':'1'},body:body===undefined?undefined:JSON.stringify(body)});
  let data;try{data=await response.json();}catch{throw new Error('The app could not connect. Please try again.');}
  if(!response.ok){const error=new Error(data.detail||'Please try again.');error.status=response.status;throw error;}
  return data;
}
function showLogin(message=''){
  el('billDialog').close();
  el('historyDialog').close();
  el('partnerInvitation').close();
  session=null;clearTimeout(expiryTimer);el('accountHelp').close();el('codeOutput').value='';el('issuerPassword').value='';el('home').hidden=true;el('loading').hidden=true;el('signin').hidden=false;
  el('password').value='';el('password').type='password';el('togglePassword').textContent='Show';el('togglePassword').setAttribute('aria-pressed','false');el('togglePassword').setAttribute('aria-label','Show password');
  el('error').textContent=message;el('error').hidden=!message;
  try{const saved=localStorage.getItem('hs_login_name');if(saved){el('loginName').value=saved;el('remember').checked=true;}}catch{}
  window.scrollTo(0,0);
}
function showHome(account){
  const entering=!session;
  session=account;el('password').value='';el('loading').hidden=true;el('signin').hidden=true;el('home').hidden=false;
  el('greeting').textContent=`Welcome, ${account.display_name}.`;
  el('welcome').textContent=account.role==='partner'?'Ready whenever you are.':'Your viewing account is signed in.';
  el('partnerHome').hidden=account.role!=='partner';el('guestHome').hidden=account.role!=='guest';el('homeError').hidden=true;
  clearTimeout(expiryTimer);
  // Recheck at the first server deadline; timers do not grant or extend access.
  expiryTimer=setTimeout(checkSession,Math.min(Math.max((Math.min(account.expires,account.idle_expires)-account.server_time)*1000,1000),2147483647));
  if(entering)window.scrollTo(0,0);
}
async function checkSession(){
  try{showHome(await api('/api/session'));}
  catch(error){if(error.status===401)showLogin(session?'Your session ended. Please sign in again.':'');else if(session){showLogin('Connection lost. Reconnect to verify your session before continuing.');}else showLogin(error.message);}
}
el('togglePassword').onclick=()=>{const show=el('password').type==='password';el('password').type=show?'text':'password';el('togglePassword').textContent=show?'Hide':'Show';el('togglePassword').setAttribute('aria-label',show?'Hide password':'Show password');el('togglePassword').setAttribute('aria-pressed',String(show));};
el('signinForm').onsubmit=async event=>{
  event.preventDefault();el('submit').disabled=true;el('submit').textContent='Signing in…';el('error').hidden=true;
  try{
    await api('/api/login',{login:el('loginName').value,password:el('password').value,remember:el('remember').checked});
    try{if(el('remember').checked)localStorage.setItem('hs_login_name',el('loginName').value);else localStorage.removeItem('hs_login_name');}catch{}
    await checkSession();
  }catch(error){el('error').textContent=error.message;el('error').hidden=false;el('password').value='';el('password').focus();}
  finally{el('submit').disabled=false;el('submit').textContent='Sign in →';}
};
el('signout').onclick=async()=>{
  el('signout').disabled=true;
  try{await api('/api/logout',{});showLogin('You are signed out.');}
  catch{el('homeError').textContent='Could not sign out from the server. Reconnect and try again.';el('homeError').hidden=false;}
  finally{el('signout').disabled=false;}
};
// Revalidate after backgrounding; do not poll in the background and extend idle sessions.
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&session)checkSession();});
window.addEventListener('pageshow',event=>{if(event.persisted)checkSession();});
checkSession();


el('openRecovery').onclick=()=>{el('recoveryLogin').value=el('loginName').value;el('recoveryMessage').textContent='';el('recoveryDialog').showModal();};
el('closeRecovery').onclick=()=>el('recoveryDialog').close();
el('recoveryDialog').addEventListener('close',()=>{for(const id of ['recoveryCode','newPassword','confirmPassword'])el(id).value='';});
el('requestRecovery').onsubmit=async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{const r=await api('/api/recovery/request',{login:el('recoveryLogin').value});el('recoveryMessage').textContent=r.detail;}catch(e){el('recoveryMessage').textContent=e.message;}finally{button.disabled=false;}};
el('resetForm').onsubmit=async event=>{event.preventDefault();if(!el('recoveryLogin').value){el('recoveryMessage').textContent='Please enter your login name above.';return;}if(el('newPassword').value!==el('confirmPassword').value){el('recoveryMessage').textContent='The passphrases do not match.';return;}const button=event.submitter;button.disabled=true;try{const r=await api('/api/recovery/reset',{login:el('recoveryLogin').value,code:el('recoveryCode').value.trim(),password:el('newPassword').value});el('recoveryDialog').close();showLogin(r.detail);}catch(e){el('recoveryMessage').textContent=e.message;}finally{button.disabled=false;}};
el('openAccountHelp').onclick=async()=>{el('accountHelpMessage').textContent='';el('issuedCode').hidden=true;el('issuerControls').hidden=session?.role!=='partner';el('accountHelp').showModal();if(session?.role==='partner'){try{const requests=await api('/api/recovery/inbox');el('recoveryInbox').replaceChildren();if(!requests.length)el('recoveryInbox').textContent='No pending requests.';for(const r of requests){const button=document.createElement('button');button.className='secondary';button.textContent=`${r.display_name} · ${r.login}`;button.onclick=()=>{el('targetLogin').value=r.login;};el('recoveryInbox').append(button);}}catch(e){el('accountHelpMessage').textContent=e.message;}}};
el('closeAccountHelp').onclick=()=>el('accountHelp').close();
el('accountHelp').addEventListener('close',()=>{el('issuerPassword').value='';el('codeOutput').value='';el('issuedCode').hidden=true;});
el('issueForm').onsubmit=async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;el('issuedCode').hidden=true;el('codeOutput').value='';try{const r=await api('/api/recovery/issue',{login:el('targetLogin').value,password:el('issuerPassword').value});el('codeOutput').value=r.code;el('issuedCode').hidden=false;el('accountHelpMessage').textContent='Code created. Expires in 15 minutes.';}catch(e){el('accountHelpMessage').textContent=e.message;}finally{el('issuerPassword').value='';button.disabled=false;}};
el('logoutAll').onclick=async()=>{el('logoutAll').disabled=true;try{await api('/api/logout-all',{});el('accountHelp').close();showLogin('You are signed out on all devices.');}catch(e){el('accountHelpMessage').textContent=e.message;}finally{el('logoutAll').disabled=false;}};
