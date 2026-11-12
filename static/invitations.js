'use strict';
{
  const issueDialog=el('partnerInvitation'), acceptDialog=el('acceptInvitation');
  let guestMode=false;
  const guestCode=()=>el('joinPartner').elements.code.value.trim().startsWith('g.');
  function syncJoinName(){
    el('joinName').hidden=guestCode();
    el('joinPartner').elements.name.disabled=guestCode();
  }
  function addButton(anchor, label, action) {
    const button=document.createElement('button');
    button.type='button';button.className='quiet';button.textContent=label;
    button.onclick=action;anchor.after(button);
  }
  function openIssue(guest){
    guestMode=guest;
    el('inviteTitle').textContent=guest?'Invite a named viewer':'Invite your business partner';
    el('inviteViewerName').hidden=!guest;
    el('createInvite').elements.name.disabled=!guest;
    el('accountHelp').close();issueDialog.showModal();
  }
  addButton(el('issueForm'),'Invite your business partner',()=>openIssue(false));
  addButton(el('issueForm'),'Invite a named viewer',()=>openIssue(true));
  addButton(el('openRecovery'),'Have an invitation?',()=>{syncJoinName();acceptDialog.showModal();});
  el('joinPartner').elements.code.addEventListener('input',syncJoinName);
  issueDialog.addEventListener('close',()=>{
    el('createInvite').reset();el('partnerInviteCode').value='';
    el('inviteCodeResult').hidden=true;el('inviteStatus').textContent='';
  });
  acceptDialog.addEventListener('close',()=>{
    el('joinPartner').reset();el('joinStatus').textContent='';
  });
  el('createInvite').onsubmit=async event=>{
    event.preventDefault();
    const form=event.currentTarget, button=event.submitter;
    button.disabled=true;
    el('partnerInviteCode').value='';el('inviteCodeResult').hidden=true;el('inviteStatus').textContent='';
    try {
      const path=guestMode?'/api/guest-invitations':'/api/partner-invitations';
      const result=await api(path,Object.fromEntries(new FormData(form)));
      if(issueDialog.open && session?.role==='partner'){
        el('partnerInviteCode').value=result.code;el('inviteCodeResult').hidden=false;
        el('inviteStatus').textContent='Code ready. Share it privately with the person you invited.';
      }
    } catch(error) {
      if(issueDialog.open)el('inviteStatus').textContent=error.message;
    } finally {form.reset();button.disabled=false;}
  };
  el('joinPartner').onsubmit=async event=>{
    event.preventDefault();
    const form=event.currentTarget, button=event.submitter;
    syncJoinName();
    const fields=Object.fromEntries(new FormData(form));
    const path=guestCode()?'/api/guest-invitations/accept':'/api/partner-invitations/accept';
    button.disabled=true;el('joinStatus').textContent='';
    try {
      await api(path,fields);
      acceptDialog.close();showLogin('Your account is ready. Please sign in.');
      el('loginName').value=fields.login;
    } catch(error) {
      if(acceptDialog.open)el('joinStatus').textContent=error.message;
    } finally {form.elements.password.value='';button.disabled=false;}
  };
}
