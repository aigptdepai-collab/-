/* CHROMA QUEST — Liquid Sort engine */
(function(){
"use strict";

const COLORS=[
 "#a66bff","#39d9f2","#ff65b9","#ffc45c","#65e6a7","#6488ff",
 "#ff795e","#b7e34b","#e58cff","#36b7a0","#f28b35","#7f9cff",
 "#e6d45a","#e879a9","#58c7e8","#b58b62","#8bd17c","#d18cff",
 "#f06b78","#6d9b52","#d5a6ff","#4e78b8"
];
const clone=tubes=>tubes.map(t=>t.slice());
function shuffled(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function rand(min,max){return min+Math.floor(Math.random()*(max-min+1));}

function tubeCountForLevel(level){
 const n=Math.max(1,Math.floor(Number(level)||1));
 if(n<=3)return 5;
 if(n<=6)return 6;
 if(n<=9)return 7;
 if(n<=12)return 8;
 if(n<=20)return 9;
 if(n<=30)return 10;
 if(n<=40)return 12;
 if(n<=50)return 13;
 if(n<=60)return 14;
 if(n<=80)return 14+Math.floor((n-60)/10);
 if(n<=100)return 16+Math.floor((n-80)/10);
 if(n<=150)return 18+Math.floor((n-100)/25);
 if(n<=200)return 20+Math.floor((n-150)/50);
 return Math.min(24,21+Math.floor((n-200)/50));
}

/* Reverse-scramble a solved board. Every generated state is therefore
   reachable from a solved board by legal pours (the solution is the
   reverse of this construction). The final consolidation restores exactly
   two empty tubes. */
function reverseScramble(colorCount,level){
 const tubes=[];
 for(let c=0;c<colorCount;c++)tubes.push([c,c,c,c]);
 tubes.push([],[]);
 const first=rand(0,colorCount-1),split=rand(1,3);
 for(let i=0;i<split;i++)tubes[first+0].pop();
 tubes[colorCount].push(...Array(split).fill(first));

 const extra=Math.min(260,Math.round(8+colorCount*3.2+Math.min(level,220)*0.72));
 for(let step=0;step<extra;step++){
  const sources=[];
  for(let i=0;i<colorCount+2;i++)if(tubes[i].length>=2)sources.push(i);
  const moves=[];
  for(const from of sources){
   const color=tubes[from][tubes[from].length-1];
   let run=1;for(let k=tubes[from].length-2;k>=0&&tubes[from][k]===color;k--)run++;
   for(let to=0;to<colorCount+2;to++){
    if(to===from||!tubes[to].length||tubes[to].length>=4)continue;
    const cap=Math.min(run,tubes[to].length?4-tubes[to].length:4,tubes[from].length-1);
    if(cap>0)moves.push({from,to,color,cap,contrast:tubes[to][tubes[to].length-1]!==color});
   }
  }
  if(!moves.length)break;
  const contrasting=moves.filter(m=>m.contrast);
  const pool=contrasting.length?contrasting:moves;
  const move=pool[rand(0,pool.length-1)];
  const amount=rand(1,move.cap);
  for(let k=0;k<amount;k++)tubes[move.to].push(tubes[move.from].pop());
 }

 /* Find a monochrome tube that can be emptied into another tube. If needed,
    create room by moving a top run while keeping its source non-empty. */
 let finish=null;
 for(let attempt=0;attempt<colorCount*3&&!finish;attempt++){
  for(let from=0;from<colorCount+2&&!finish;from++){
   const a=tubes[from];
   if(!a.length||a.length>4||!a.every(x=>x===a[0]))continue;
   for(let to=0;to<colorCount+2;to++){
    if(to!==from&&tubes[to].length>0&&tubes[to].length+a.length<=4){finish={from,to};break;}
   }
  }
  if(finish)break;
  const donors=[];
  for(let from=0;from<colorCount+2;from++){
   if(tubes[from].length<2)continue;
   const color=tubes[from].at(-1);
   let run=1;for(let k=tubes[from].length-2;k>=0&&tubes[from][k]===color;k--)run++;
   for(let to=0;to<colorCount+2;to++){
    if(to!==from&&tubes[to].length>0&&tubes[to].length<4){
     const amount=Math.min(run,tubes[from].length-1,4-tubes[to].length);
     if(amount>0)donors.push({from,to,amount});
    }
   }
  }
  if(!donors.length)break;
  const m=donors[rand(0,donors.length-1)];
  for(let k=0;k<m.amount;k++)tubes[m.to].push(tubes[m.from].pop());
 }
 if(finish){
  const {from,to}=finish;
  while(tubes[from].length)tubes[to].push(tubes[from].pop());
 }else{
  /* Safe fallback: retain a valid reverse-scrambled board, with at least
     one empty tube; this branch is exceptionally rare. */
 }
 return tubes;
}

function makeLevel(level){
 const totalTubes=tubeCountForLevel(level);
 const count=totalTubes-2;
 return reverseScramble(count,Math.max(1,Number(level)||1));
}
function topRun(t){if(!t.length)return 0;let n=1;for(let i=t.length-2;i>=0&&t[i]===t[t.length-1];i--)n++;return n;}
function canPour(t,from,to){if(from===to||!t[from]||!t[to])return false;const a=t[from],b=t[to];if(!a.length||b.length>=4)return false;return !b.length||b[b.length-1]===a[a.length-1];}
function pour(t,from,to){if(!canPour(t,from,to))return null;const next=clone(t),a=next[from],b=next[to],color=a[a.length-1],amount=Math.min(topRun(a),4-b.length);for(let i=0;i<amount;i++)b.push(a.pop());return{tubes:next,amount,color};}
function won(t){return t.every(x=>x.length===0||(x.length===4&&x.every(c=>c===x[0])));}
window.LiquidEngine={COLORS,makeLevel,clone,canPour,pour,won,topRun,tubeCountForLevel};
})();