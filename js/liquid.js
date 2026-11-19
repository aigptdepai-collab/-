/* CHROMA QUEST — Liquid Sort engine */
(function(){
"use strict";

/* 22 distinct, high-contrast colors; two empty tubes are always preserved. */
const COLORS=[
 "#a66bff","#39d9f2","#ff65b9","#ffc45c","#65e6a7","#6488ff",
 "#ff795e","#b7e34b","#e58cff","#36b7a0","#f28b35","#7f9cff",
 "#e6d45a","#e879a9","#58c7e8","#b58b62","#8bd17c","#d18cff",
 "#f06b78","#6d9b52","#d5a6ff","#4e78b8"
];
const clone=tubes=>tubes.map(t=>t.slice());
function shuffled(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

/* A gradual curve: 10 tubes by stage 30, 12 by 40, then a steady climb.
   The 24-tube ceiling is intentional so the mobile board remains playable. */
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
function makeLevel(level){
 const totalTubes=tubeCountForLevel(level);
 const count=totalTubes-2;
 const units=[];
 for(let c=0;c<count;c++)for(let n=0;n<4;n++)units.push(c);
 let tubes;
 /* Avoid starting with already-solved color tubes, without changing the
    number of pieces or the two guaranteed empty tubes. */
 do{
  const mixed=shuffled(units);
  tubes=[];
  for(let i=0;i<count;i++)tubes.push(mixed.slice(i*4,(i+1)*4));
 }while(tubes.some(t=>t.every(c=>c===t[0])));
 tubes.push([],[]);
 return tubes;
}
function topRun(t){if(!t.length)return 0;let n=1;for(let i=t.length-2;i>=0&&t[i]===t[t.length-1];i--)n++;return n;}
function canPour(t,from,to){if(from===to||!t[from]||!t[to])return false;const a=t[from],b=t[to];if(!a.length||b.length>=4)return false;return !b.length||b[b.length-1]===a[a.length-1];}
function pour(t,from,to){if(!canPour(t,from,to))return null;const next=clone(t),a=next[from],b=next[to],color=a[a.length-1],amount=Math.min(topRun(a),4-b.length);for(let i=0;i<amount;i++)b.push(a.pop());return{tubes:next,amount,color};}
function won(t){return t.every(x=>x.length===0||(x.length===4&&x.every(c=>c===x[0])));}
window.LiquidEngine={COLORS,makeLevel,clone,canPour,pour,won,topRun,tubeCountForLevel};
})();