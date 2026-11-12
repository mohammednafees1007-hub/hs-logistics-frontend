'use strict';
{
  const dialog=el('billDialog'), form=el('billForm'), status=el('billStatus');
  const save=el('saveBill'), close=el('closeBill'), files=el('billFiles');
  el('openBill').onclick=()=>{status.textContent='';dialog.showModal();};
  dialog.addEventListener('close',()=>form.reset());
  dialog.addEventListener('cancel',event=>{if(close.disabled)event.preventDefault();});
  form.onsubmit=async event=>{
    event.preventDefault();
    const picked=[...files.files], mib=1024*1024;
    if(picked.length>8 || picked.some(file=>file.size>10*mib) || picked.reduce((n,file)=>n+file.size,0)>32*mib){
      status.textContent='Choose up to 8 files, 10 MB each and 32 MB in total.';return;
    }
    const body=new FormData(form);
    save.disabled=close.disabled=files.disabled=true;status.textContent='Saving…';
    try {
      const response=await fetch('/api/submissions',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'X-HS-Request':'1'},body});
      const result=await response.json();
      if(response.status===401){showLogin('Your session ended. Please sign in again.');return;}
      if(!response.ok){status.textContent=result.detail||'Could not save the bill.';return;}
      status.textContent=`Saved ${result.file_count} original file(s). Receipt: ${result.submission_id}`;
      form.reset();
    } catch {
      status.textContent='Could not confirm that the bill was saved.';
    } finally {save.disabled=close.disabled=files.disabled=false;}
  };
}
