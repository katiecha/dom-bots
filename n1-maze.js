/*──────── LOCK-STEP MAZE BOT v2 ────────*/

/* stop earlier loops, if any */
cancelAnimationFrame(window.rafId ?? 0);

/* selectors */
const gridSel   = '.game-board .grid',
      cellSel   = '.game-cell',
      playerSel = '.game-cell.player',
      appleSel  = '.game-cell.apple',
      wallSel   = '.game-cell.wall';

/* key helpers */
const KEY  = {'0,1':'ArrowRight','0,-1':'ArrowLeft','1,0':'ArrowDown','-1,0':'ArrowUp'};
const CODE = {ArrowRight:39,ArrowLeft:37,ArrowUp:38,ArrowDown:40};
const press = k => {
  const e = {key:k,code:k,keyCode:CODE[k],which:CODE[k],bubbles:true};
  ['keydown','keyup'].forEach(t => {
    document.dispatchEvent(new KeyboardEvent(t,e));
    window   .dispatchEvent(new KeyboardEvent(t,e));
  });
};

/* read board → {mat,me,goal}  or  null while DOM is unstable */
function read(){
  const g = document.querySelector(gridSel);
  if(!g) throw 'grid missing';

  const cells = g.querySelectorAll(cellSel);
  if(!cells.length) throw 'no cells';

  const cols = getComputedStyle(g).gridTemplateColumns.split(/\s+/).length;
  const rows = getComputedStyle(g).gridTemplateRows .split(/\s+/).length ||
               Math.ceil(cells.length/cols);

  const mat = Array.from({length:rows}, _=>Array(cols).fill(1));   // 1 = wall, 0 = open
  let me, goal;

  cells.forEach((el,i)=>{
    const r = (i/cols)|0, c = i%cols;
    if(el.matches(wallSel)) return;
    mat[r][c] = 0;
    if(el.matches(playerSel)) me   = [r,c];
    if(el.matches(appleSel )) goal = [r,c];
  });

  if(!me)   throw 'player missing';
  if(!goal) return null;                  // apple not in DOM yet → try next frame
  return {mat,me,goal};
}

/* BFS shortest path (returns [start,…,goal] or just [start] if unreachable) */
const DIR = [[1,0],[-1,0],[0,1],[0,-1]];
function bfs(mat,s,t){
  const q=[s], prev=new Map([[s+'',null]]);
  while(q.length){
    const [r,c]=q.shift();
    if(r===t[0] && c===t[1]) break;
    for(const[dr,dc] of DIR){
      const nr=r+dr, nc=c+dc;
      if(mat[nr]?.[nc]!==0) continue;
      const k=nr+','+nc;
      if(!prev.has(k)) prev.set(k,[r,c]), q.push([nr,nc]);
    }
  }
  const p=[]; for(let cur=t;cur;cur=prev.get(cur+'')) p.push(cur);
  p.reverse();
  return p.length ? p : [s];              // unreachable ⇒ return only start
}

/* path state */
let path=[], idx=0;

/* dead-man timer */
let lastMoveTime = performance.now();

/* helpers */
const raf = () => { window.rafId = requestAnimationFrame(step); };

/* main loop */
function step(ts){
  try{
    const state = read();
    if(state===null) return raf();        // grid not stable yet

    const {mat,me,goal} = state;

    /* reached apple → reset for next level */
    if(me[0]===goal[0] && me[1]===goal[1]){
      path=[]; idx=0; return raf();
    }

    /* need a path, or position desynced */
    if(!path.length || idx>=path.length ||
       path[idx][0]!==me[0] || path[idx][1]!==me[1]){
      path = bfs(mat,me,goal);
      idx  = 0;
    }

    /* unreachable apple → send 4 dummy moves to advance */
    if(path.length<=1){
      ['ArrowUp','ArrowUp','ArrowUp','ArrowUp'].forEach(press);
      lastMoveTime = ts;
      return raf();
    }

    /* fire exactly ONE move when DOM shows we're on expected square */
    if(idx+1 < path.length &&
       path[idx][0]===me[0] && path[idx][1]===me[1]){
      const [r1,c1] = path[idx], [r2,c2] = path[idx+1];
      press(KEY[[r2-r1,c2-c1]]);
      idx++;
      lastMoveTime = ts;
    }

    /* dead-man: reload if no key pressed for 8 s */
    if(ts - lastMoveTime > 8_000){
      location.reload();
      return;                             // stop current loop
    }

  }catch(e){
    // non-fatal: just try again next frame
    // console.debug('maze bot:', e);
  }
  raf();
}

/* kick off */
raf();

/* stop later with:  cancelAnimationFrame(window.rafId);  */
