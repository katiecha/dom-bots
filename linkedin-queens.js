(() => {
    if (window.queensPreview) window.queensPreview.remove();
    const grid=document.querySelector('#queens-grid'); if(!grid){console.warn('board not found');return;}
    const CELLS=[...grid.querySelectorAll('.queens-cell-with-border')],
          ROWS=+getComputedStyle(grid).getPropertyValue('--rows')||9,
          COLS=+getComputedStyle(grid).getPropertyValue('--cols')||9;
    if(CELLS.length!==ROWS*COLS){console.warn('board size mismatch');return;}
  
    const buckets={},rowUsed=Array(ROWS).fill(false),colUsed=Array(COLS).fill(false),queens=[];
    CELLS.forEach((cell,i)=>{const id=+(cell.className.match(/cell-color-(\d+)/)??[,-1])[1],
      r=(i/COLS)|0,c=i%COLS;(buckets[id]??=[]).push([r,c]);});
    const palette=Object.values(buckets).sort((a,b)=>a.length-b.length);
    const touches=(r,c)=>queens.some(([qr,qc])=>Math.abs(qr-r)<=1&&Math.abs(qc-c)<=1);
    function solve(l=0){
      if(l===palette.length)return true;
      for(const[p,q]of palette[l]){
        if(rowUsed[p]||colUsed[q]||touches(p,q))continue;
        rowUsed[p]=colUsed[q]=true;queens.push([p,q]);
        if(solve(l+1))return true;
        queens.pop();rowUsed[p]=colUsed[q]=false;}
      return false;}
    if(!solve()){console.warn('unsolvable board');return;}
  
    console.table(queens.map(([r,c])=>({Row:r+1,Col:c+1})));
  
    const preview=document.createElement('div');
    preview.id='queens-answers';window.queensPreview=preview;
    Object.assign(preview.style,{position:'fixed',top:'20px',left:'20px',zIndex:1e6,
      border:'2px solid #444',borderRadius:'6px',boxShadow:'0 4px 12px #0004',
      background:'#fff',fontSize:'0',cursor:'move',userSelect:'none'});
    let dx,dy;
    preview.onpointerdown=e=>{
      dx=e.clientX-preview.offsetLeft;dy=e.clientY-preview.offsetTop;
      const mv=ev=>{preview.style.left=ev.clientX-dx+'px';preview.style.top=ev.clientY-dy+'px';};
      window.addEventListener('pointermove',mv);
      window.addEventListener('pointerup',()=>window.removeEventListener('pointermove',mv),{once:true});};
    const close=Object.assign(document.createElement('div'),{textContent:'❌'});
    Object.assign(close.style,{position:'absolute',right:'4px',top:'2px',fontSize:'16px',cursor:'pointer'});
    close.onclick=()=>preview.remove();
    preview.appendChild(close);
  
    const mini=document.createElement('div');
    Object.assign(mini.style,{display:'grid',
      gridTemplateColumns:`repeat(${COLS},24px)`,
      gridTemplateRows:`repeat(${ROWS},24px)`});
    preview.appendChild(mini);
  
    const qset=new Set(queens.map(([r,c])=>r+','+c));
    CELLS.forEach((cell,i)=>{
      const sq=document.createElement('div'),
            bg=getComputedStyle(cell).backgroundColor,
            r=(i/COLS)|0,c=i%COLS;
      Object.assign(sq.style,{width:'24px',height:'24px',background:bg,
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:'18px',lineHeight:'1'});
      if(qset.has(r+','+c))sq.textContent='♛';
      mini.appendChild(sq);});
  
    document.body.appendChild(preview);
  })();