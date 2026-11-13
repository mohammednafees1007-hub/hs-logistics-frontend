'use strict';
{
  const dialog=el('historyDialog'), source=el('historySource'), section=el('historySection');
  const results=el('historyItems'), status=el('historyStatus'), more=el('historyMore'), download=el('historyDownload');
  const sourceRows=el('historyRaw'), sourceRowsLabel=el('historyRawLabel');
  let request=0, cursor=null;
  const create=(tag,value)=>{
    const node=document.createElement(tag);
    node.textContent=value;
    return node;
  };
  function clear(){
    request++;cursor=null;results.replaceChildren();source.replaceChildren();section.replaceChildren();
    download.hidden=more.hidden=sourceRowsLabel.hidden=el('historySectionLabel').hidden=true;
    sourceRows.checked=false;download.removeAttribute('href');
  }
  dialog.addEventListener('close',()=>{if(!dialog.open)clear();});
  function error(e){
    if(e.status===401){clear();showLogin('Please sign in to view records.');}
    else status.textContent=e.message;
  }
  function render(row,currency){
    const card=create('article','');card.className='history-row';
    card.append(create('strong',row.payload.title||row.payload.fields?.description||row.category));
    card.append(create('small',`${row.section} · ${row.locator}`));
    const fields=row.payload.fields;
    if(fields && Object.keys(fields).length){
      const list=create('dl','');
      for(const [key,value] of Object.entries(fields)){
        if(value===null||value==='')continue;
        list.append(create('dt',key),create('dd',key.includes('amount')?`${currency} ${value}`:value));
      }
      card.append(list);
    }
    if(row.payload.cells){
      const details=create('details','');
      details.append(create('summary','Original cells'));
      const cells=Object.entries(row.payload.cells).map(([key,value])=>{
        const cached=row.payload['cached formulas']?.[key];
        return `${key}: ${value}${cached===undefined?'':` → ${cached}`}`;
      });
      details.append(create('pre',cells.join('\n')));card.append(details);
    }
    if(row.payload.text)card.append(create('pre',row.payload.text));
    results.append(card);
  }
  async function load(append=false){
    const current=++request,id=source.value,currency=source.selectedOptions[0]?.dataset.currency;
    if(!id)return;
    if(!append){results.replaceChildren();cursor=null;}
    status.textContent='Loading records…';more.hidden=true;
    const params=new URLSearchParams({after:String(cursor||0)});
    if(section.value)params.set('section',section.value);
    params.set('include_source_rows',String(sourceRows.checked));
    try{
      const data=await api(`/api/history/${encodeURIComponent(id)}?${params}`);
      if(current!==request||!dialog.open)return;
      const selected=section.value;
      section.replaceChildren(new Option('All', ''),...data.sections.map(item=>new Option(item,item)));
      section.value=selected;el('historySectionLabel').hidden=data.sections.length<=1;
      download.href=`/api/history/${encodeURIComponent(id)}/original`;download.hidden=false;
      for(const row of data.items)render(row,currency);
      cursor=data.next_after;more.hidden=cursor===null;
      status.textContent=data.items.length?'':'No records in this source.';
    }catch(e){if(current===request&&dialog.open)error(e);}
  }
  source.onchange=()=>{
    section.replaceChildren();sourceRows.checked=false;
    sourceRowsLabel.hidden=source.selectedOptions[0]?.dataset.kind!=='xlsx';
    download.hidden=true;download.removeAttribute('href');load();
  };
  section.onchange=()=>load();
  sourceRows.onchange=()=>load();
  more.onclick=()=>load(true);
  el('openHistory').onclick=async()=>{
    clear();const current=request;status.textContent='Loading sources…';dialog.showModal();
    try{
      const data=await api('/api/history');
      if(current!==request||!dialog.open)return;
      for(const item of data.sources){
        const option=new Option(item.filename,item.id);
        option.dataset.currency=item.currency;option.dataset.kind=item.kind;source.add(option);
      }
      if(data.sources.length)source.onchange();
      else status.textContent='No historical files have been imported.';
    }catch(e){if(current===request&&dialog.open)error(e);}
  };
}
