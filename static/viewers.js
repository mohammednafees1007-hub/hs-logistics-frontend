'use strict';
{
  el('issuerControls').append(el('viewerControls').content.cloneNode(true));
  const details=el('viewerManagement'), form=el('suspendViewer'), status=el('viewerStatus');
  const select=form.elements.guest, button=form.querySelector('button');
  async function loadViewers(){
    button.disabled=true;select.replaceChildren(new Option('Choose a viewer',''));
    try {
      const {guests}=await api('/api/guests');
      if(!details.open)return;
      for(const guest of guests)select.add(new Option(`${guest.display_name} (${guest.login})`,guest.id));
      button.disabled=!guests.length;
      if(!guests.length && !status.textContent)status.textContent='No active viewers.';
    } catch(error) {
      if(details.open)status.textContent=error.message;
    }
  }
  details.addEventListener('toggle',()=>{if(details.open)loadViewers();else form.reset();});
  el('accountHelp').addEventListener('close',()=>{details.open=false;form.reset();status.textContent='';});
  form.onsubmit=async event=>{
    event.preventDefault();
    button.disabled=true;status.textContent='';
    try {
      await api('/api/guests/'+encodeURIComponent(select.value)+'/suspend',{password:form.elements.password.value});
      if(details.open){
        status.textContent='Viewer suspended. Their sessions have ended.';
        await loadViewers();
      }
    } catch(error) {
      if(details.open){status.textContent=error.message;button.disabled=false;}
    } finally {form.elements.password.value='';}
  };
}
