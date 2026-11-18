/* CHROMA QUEST — Liquid Sort engine */
(function(){
"use strict";
const COLORS=["#a66bff","#39d9f2","#ff65b9","#ffc45c","#65e6a7","#6488ff"];
const clone=tubes=>tubes.map(t=>t.slice());
function shuffled(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function makeLevel(level){const count=Math.min(3+Math.floor((level-1)/3),6),units=[];for(let c=0;c<count;c++)for(let n=0;n<4;n++)units.push(c);const mixed=shuffled(units),tubes=[];for(let i=0;i<count;i++)tubes.push(mixed.slice(i*4,(i+1)*4));tubes.push([],[]);if(tubes.slice(0,count).every(t=>t.every(c=>c===t[0])))return makeLevel(level);return tubes;}
function topRun(t){if(!t.length)return 0;let n=1;for(let i=t.length-2;i>=0&&t[i]===t[t.length-1];i--)n++;return n;}
function canPour(t,from,to){if(from===to||!t[from]||!t[to])return false;const a=t[from],b=t[to];if(!a.length||b.length>=4)return false;return !b.length||b[b.length-1]===a[a.length-1];}
function pour(t,from,to){if(!canPour(t,from,to))return null;const next=clone(t),a=next[from],b=next[to],color=a[a.length-1],amount=Math.min(topRun(a),4-b.length);for(let i=0;i<amount;i++)b.push(a.pop());return{tubes:next,amount,color};}
function won(t){return t.every(x=>x.length===0||(x.length===4&&x.every(c=>c===x[0])));}
window.LiquidEngine={COLORS,makeLevel,clone,canPour,pour,won,topRun};
})();