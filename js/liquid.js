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

/* Reverse-scramble a solved board. On challenge stages the final
   empty slot is the special reservoir; never create a second empty tube.
   Each reverse move is the exact inverse of a legal forward pour. */
function reverseScramble(colorCount,level,emptyCount){
 const tubes=[];
 for(let color=0;color<colorCount;color++)tubes.push([color,color,color,color]);
 for(let i=0;i<emptyCount;i++)tubes.push([]);
 const extra=Math.min(900,Math.round(42+colorCount*11+Math.min(level,300)*2.7+Math.sqrt(level)*9));
 let made=0,lastKey="";
 for(let step=0;step<extra;step++){
  const moves=[];
  for(let from=0;from<colorCount;from++){
   const a=tubes[from];
   if(a.length<2)continue;
   const color=a[a.length-1];
   let run=1;
   for(let k=a.length-2;k>=0&&a[k]===color;k--)run++;
   for(let to=0;to<tubes.length;to++){
    if(to===from||!tubes[to].length||tubes[to].length>=4||tubes[to][tubes[to].length-1]===color)continue;
    const amount=Math.min(run,a.length-1,4-tubes[to].length);
    if(amount>0){
     const key=from+":"+to+":"+color;
     if(key!==lastKey)moves.push({from,to,color,amount,key});
    }
   }
  }
  if(!moves.length)break;
  const m=moves[rand(0,moves.length-1)];
  const amount=rand(1,m.amount);
  for(let k=0;k<amount;k++)tubes[m.to].push(tubes[m.from].pop());
  lastKey=m.key;
  made++;
 }
 /* Reverse moves preserve a guaranteed solution path, even when the board
    is less scrambled than the target difficulty. */
 /* Keep the one and only empty slot at the end for reservoir rendering. */
 const emptyIndex=tubes.findIndex(t=>t.length===0);
 if(emptyIndex>=0&&emptyIndex!==tubes.length-1){
  [tubes[emptyIndex],tubes[tubes.length-1]]=[tubes[tubes.length-1],tubes[emptyIndex]];
 }
 return tubes;
}

function hasReservoir(level){
 const n=Math.max(1,Math.floor(Number(level)||1));
 return n>30;
}
function makeLevel(level){
 const n=Math.max(1,Math.floor(Number(level)||1));
 const challenge=n>30;
 const count=Math.min(COLORS.length,tubeCountForLevel(n)-(challenge?1:2));
 /* Levels 1–5: two ordinary buffers; 6–30: one; 31+: one special reservoir. */
 const emptyCount=n<=5?2:1;
 return reverseScramble(count,n,emptyCount);
}
function topRun(t){if(!t.length)return 0;let n=1;for(let i=t.length-2;i>=0&&t[i]===t[t.length-1];i--)n++;return n;}
function canPour(t,from,to){if(from===to||!t[from]||!t[to])return false;const a=t[from],b=t[to];if(!a.length||b.length>=4)return false;return !b.length||b[b.length-1]===a[a.length-1];}
function pour(t,from,to){if(!canPour(t,from,to))return null;const next=clone(t),a=next[from],b=next[to],color=a[a.length-1],amount=Math.min(topRun(a),4-b.length);for(let i=0;i<amount;i++)b.push(a.pop());return{tubes:next,amount,color};}
function won(t){return t.every(x=>x.length===0||(x.length===4&&x.every(c=>c===x[0])));}
window.LiquidEngine={COLORS,makeLevel,clone,canPour,pour,won,topRun,tubeCountForLevel,hasReservoir};
})();