/* CHROMA QUEST — playable game controller */
(function(){
"use strict";
const $=s=>document.querySelector(s),state=window.ChromaState;
const home=$("#home-screen"),game=$("#game-screen"),liquidBoard=$("#liquid-board"),blockWrap=$("#block-board-wrap"),blockBoard=$("#block-board"),tray=$("#piece-tray"),modal=$("#modal-backdrop");
const fa=n=>String(n).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
let mode=null,level=1,score=0,moves=0,best=0,selectedTube=null,selectedPiece=null,liquid=[],block=null,history=[],pourAnimating=false,blockAnimating=false;
let audioContext=null,ambientNodes=[],ambientActive=false;
function ensureAudio(){
 audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();
 if(audioContext.state==="suspended")audioContext.resume();
 return audioContext;
}
function stopAmbient(){
 if(!ambientActive)return;
 ambientActive=false;
 if(!audioContext)return;
 const now=audioContext.currentTime;
 ambientNodes.forEach(node=>{
  try{
   node.gain.gain.cancelScheduledValues(now);
   node.gain.gain.setTargetAtTime(.0001,now,.35);
   node.osc.stop(now+1.5);
  }catch(e){}
 });
 ambientNodes=[];
}
function startAmbient(){
 if(!state.get().sound||!document.body.classList.contains("home-active")||ambientActive)return;
 try{
  const ctx=ensureAudio(),now=ctx.currentTime;
  ambientActive=true;
  [[130.81,.026],[196,.019],[261.63,.012],[392,.006]].forEach(([frequency,volume],index)=>{
   const osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type="sine";
   osc.frequency.setValueAtTime(frequency,now);
   osc.detune.setValueAtTime(index===1?3:index===2?-4:2,now);
   gain.gain.setValueAtTime(.0001,now);
   gain.gain.setTargetAtTime(volume,now+index*.18,.75);
   osc.connect(gain);gain.connect(ctx.destination);osc.start(now);
   ambientNodes.push({osc,gain});
  });
 }catch(e){ambientActive=false;}
}
function tone(freq,duration=.09,when=0,wave="sine",volume=.035){
 if(!state.get().sound)return;
 try{
  audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==="suspended")audioContext.resume();
  const start=audioContext.currentTime+when,osc=audioContext.createOscillator(),gain=audioContext.createGain();
  osc.type=wave;osc.frequency.setValueAtTime(freq,start);
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain);gain.connect(audioContext.destination);osc.start(start);osc.stop(start+duration+.02);
 }catch(e){}
}
function sound(freq=440,duration=.07){tone(freq,duration,0,"sine",.035);}
function sfx(kind){
 const notes={
  start:[[392,.09,0],[523,.11,.08],[659,.16,.17]],
  select:[[520,.055,0,"triangle",.025],[780,.07,.045,"sine",.02]],
  error:[[220,.12,0,"triangle",.035],[165,.16,.09,"sine",.025]],
  pour:[[440,.07,0,"sine",.022],[587,.09,.07,"triangle",.028],[740,.12,.15,"sine",.025]],
  place:[[330,.06,0,"triangle",.025],[494,.08,.055,"sine",.03]],
  clear:[[523,.08,0,"triangle",.025],[659,.09,.07,"sine",.03],[784,.12,.14,"triangle",.03],[1046,.18,.22,"sine",.025]],
  win:[[659,.12,0,"triangle",.03],[784,.12,.1,"sine",.035],[988,.16,.2,"triangle",.035],[1318,.24,.31,"sine",.03]],
  lose:[[330,.13,0,"triangle",.03],[247,.16,.12,"sine",.03],[185,.22,.26,"triangle",.025]],
  undo:[[587,.08,0,"sine",.025],[440,.11,.08,"triangle",.025]]
 };
 (notes[kind]||[]).forEach(([freq,duration,when,wave,volume])=>tone(freq,duration,when,wave,volume));
}
function renderHeader(){const s=state.get();$("#gem-count").textContent=s.gems;$("#gem-stat").textContent=fa(s.gems);$("#level-stat").textContent=fa(s.level).padStart(2,"۰");$("#sound-toggle").textContent=s.sound?"♫":"♪̸";}
function setMessage(t){$("#game-message").textContent=t;}
function closeModal(){modal.hidden=true;modal.classList.remove("result-win","result-lose");}
function showModal(kicker,title,description,buttons,resultType=""){modal.classList.remove("result-win","result-lose");if(resultType)modal.classList.add("result-"+resultType);$("#dialog-kicker").textContent=kicker;$("#dialog-title").textContent=title;$("#dialog-description").textContent=description;const actions=$("#dialog-actions");actions.innerHTML="";buttons.forEach(b=>{const el=document.createElement("button");el.className=b.primary?"primary-button":"secondary-button";el.textContent=b.label;el.addEventListener("click",()=>{closeModal();if(b.action)b.action();});actions.append(el);});modal.hidden=false;}
function startGame(which){stopAmbient();document.body.classList.remove("home-active");document.body.classList.add("game-active");mode=which;level=state.get().level;home.hidden=true;game.hidden=false;$("#game-kicker").textContent=which==="liquid"?"LIQUID SORT":"BLOCK PUZZLE";$("#game-title").textContent=which==="liquid"?"مرتب‌سازی رنگ":"پازل بلوکی";$("#game-level").textContent=fa(level);liquidBoard.hidden=which!=="liquid";blockWrap.hidden=which!=="blocks";score=0;moves=0;history=[];selectedTube=null;selectedPiece=null;if(which==="liquid"){liquid=LiquidEngine.makeLevel(level);renderLiquid();}else{block={board:BlockEngine.emptyBoard(),pieces:BlockEngine.newPieces()};renderBlocks();}renderHud();setMessage(which==="liquid"?"رنگ‌های یکسان را در یک لوله جمع کن.":"قطعه‌ای را انتخاب کن و در خانه‌های خالی قرار بده.");sfx("start");}
function backHome(){document.body.classList.remove("game-active");document.body.classList.add("home-active");game.hidden=true;home.hidden=false;mode=null;closeModal();startAmbient();}
function renderHud(){$("#score-value").textContent=fa(score);$("#moves-value").textContent=fa(moves);$("#best-value").textContent=fa(best);}
function pushHistory(){history.push(mode==="liquid"?{mode,tubes:LiquidEngine.clone(liquid),score,moves}:{mode,board:BlockEngine.clone(block.board),pieces:block.pieces.map(p=>({...p,shape:p.shape.map(r=>r.slice())})),score,moves});if(history.length>30)history.shift();}
function undo(){const h=history.pop();if(!h){setMessage("هنوز حرکتی برای برگشت وجود ندارد.");return;}score=h.score;moves=h.moves;if(h.mode==="liquid"){liquid=LiquidEngine.clone(h.tubes);selectedTube=null;renderLiquid();}else{block={board:BlockEngine.clone(h.board),pieces:h.pieces};selectedPiece=null;renderBlocks();}renderHud();setMessage("حرکت قبلی برگشت داده شد.");sfx("undo");}
function renderLiquid(targetIndex=null,flowAmount=0,sourceIndex=null){liquidBoard.innerHTML="";liquid.forEach((tube,index)=>{const el=document.createElement("button");el.type="button";el.className="tube"+(!tube.length?" empty":"")+(selectedTube===index?" selected":"")+(targetIndex===index?" pour-target":"")+(sourceIndex===index?" pour-source":"");el.setAttribute("aria-label","لوله "+fa(index+1));tube.forEach((color,layerIndex)=>{const layer=document.createElement("span");layer.className="liquid-layer"+(targetIndex===index&&layerIndex>=tube.length-flowAmount?" flow-in":"");layer.style.background=LiquidEngine.COLORS[color];el.append(layer);});el.addEventListener("click",()=>tapTube(index));liquidBoard.append(el);});}
function animatePour(fromIndex,toIndex,color,onComplete){
 const source=liquidBoard.children[fromIndex],target=liquidBoard.children[toIndex];
 if(!source||!target){onComplete();return;}
 pourAnimating=true;
 const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
 const x1=a.left+a.width/2,y1=a.top+5,x2=b.left+b.width/2,y2=b.top+5;
 const dx=x2-x1,dy=y2-y1;
 const lift=Math.max(55,Math.min(125,Math.abs(dx)*.22+Math.abs(dy)*.12));
 const pathData="M "+x1+" "+y1+" C "+(x1+dx*.28)+" "+(y1-lift)+" "+(x2-dx*.28)+" "+(y2-lift)+" "+x2+" "+y2;
 const svgNS="http://www.w3.org/2000/svg";
 const svg=document.createElementNS(svgNS,"svg");
 svg.setAttribute("viewBox","0 0 "+window.innerWidth+" "+window.innerHeight);
 svg.setAttribute("class","pour-flight-overlay");
 const defs=document.createElementNS(svgNS,"defs"),gradient=document.createElementNS(svgNS,"linearGradient");
 gradient.setAttribute("id","pour-gradient");gradient.setAttribute("x1","0");gradient.setAttribute("y1","0");gradient.setAttribute("x2","1");gradient.setAttribute("y2","0");
 [[0,"#ffffff"],[.35,LiquidEngine.COLORS[color]],[1,LiquidEngine.COLORS[color]]].forEach(([offset,hex])=>{const stop=document.createElementNS(svgNS,"stop");stop.setAttribute("offset",offset);stop.setAttribute("stop-color",hex);gradient.append(stop);});
 defs.append(gradient);svg.append(defs);
 const path=document.createElementNS(svgNS,"path");
 path.setAttribute("d",pathData);path.setAttribute("fill","none");path.setAttribute("stroke","url(#pour-gradient)");
 path.setAttribute("stroke-width",Math.max(7,Math.min(13,a.width*.25)));path.setAttribute("stroke-linecap","round");
 path.setAttribute("pathLength","1");path.setAttribute("stroke-dasharray","1");path.setAttribute("stroke-dashoffset","1");path.setAttribute("class","pour-flight-stream");
 svg.append(path);document.body.append(svg);
 source.classList.add("pour-source");
 target.classList.add("pour-target");
 requestAnimationFrame(()=>path.classList.add("travel"));
 window.setTimeout(()=>{svg.remove();onComplete();},520);
}
function tapTube(index){if(pourAnimating)return;if(selectedTube===null){if(!liquid[index].length){setMessage("اول یک لوله دارای مایع انتخاب کن.");return;}selectedTube=index;renderLiquid();setMessage("حالا لوله مقصد را انتخاب کن.");sfx("select");return;}if(selectedTube===index){selectedTube=null;renderLiquid();setMessage("انتخاب لغو شد.");return;}if(!LiquidEngine.canPour(liquid,selectedTube,index)){if(!liquid[index].length||liquid[index].at(-1)===liquid[selectedTube].at(-1)){setMessage("این حرکت امکان‌پذیر نیست.");sfx("error");return;}selectedTube=index;renderLiquid();setMessage("فقط روی رنگ مشابه یا لوله خالی بریز.");sound(170);return;}pushHistory();const result=LiquidEngine.pour(liquid,selectedTube,index);const fromIndex=selectedTube;const oldTubes=liquid;liquid=result.tubes;selectedTube=null;moves++;score+=result.amount*5;renderHud();sfx("pour");animatePour(fromIndex,index,result.color,()=>{renderLiquid(index,result.amount,fromIndex);pourAnimating=false;if(LiquidEngine.won(liquid))winLevel("liquid");else setMessage(fa(result.amount)+" واحد مایع جابه‌جا شد. ادامه بده!");});}
function liquidHint(){for(let a=0;a<liquid.length;a++)for(let b=0;b<liquid.length;b++)if(LiquidEngine.canPour(liquid,a,b)){setMessage("راهنما: از لوله "+fa(a+1)+" به لوله "+fa(b+1)+" انتقال بده.");const els=liquidBoard.children;els[a].classList.add("selected");els[b].style.borderColor="#ffe28b";setTimeout(()=>{if(els[a])els[a].classList.remove("selected");if(els[b])els[b].style.borderColor="";},1300);return;}setMessage("حرکت مناسبی پیدا نشد؛ بازی را دوباره شروع کن.");}
function renderBlocks(placedCells=[],clearingCells=[]){const placedSet=new Set(placedCells.map(([r,c])=>r+","+c)),clearingMap=new Map(clearingCells.map(([r,c,color])=>[r+","+c,color]));blockBoard.innerHTML="";for(let r=0;r<8;r++)for(let c=0;c<8;c++){const cell=document.createElement("button");cell.type="button";const key=r+","+c,clearing=clearingMap.has(key);cell.className="block-cell"+(block.board[r][c]?" filled":"")+(placedSet.has(key)?" placed":"")+(clearing?" clearing":"");cell.setAttribute("role","gridcell");if(block.board[r][c])cell.style.setProperty("--cell-color",block.board[r][c]);else if(clearing)cell.style.setProperty("--cell-color",clearingMap.get(key));cell.addEventListener("click",()=>placeSelected(r,c));blockBoard.append(cell);}tray.innerHTML="";block.pieces.forEach((piece,index)=>{const slot=document.createElement("button");slot.type="button";slot.className="piece-slot"+(piece.used?" used":"")+(selectedPiece===index?" selected":"");slot.setAttribute("aria-label","قطعه "+fa(index+1));if(!piece.used){const shape=document.createElement("span");shape.className="piece-shape";shape.style.gridTemplateColumns="repeat("+piece.shape[0].length+",17px)";shape.style.setProperty("--piece-color",piece.color);piece.shape.forEach(row=>row.forEach(v=>{const sq=document.createElement("i");sq.className="piece-square";sq.style.visibility=v?"visible":"hidden";shape.append(sq);}));slot.append(shape);}slot.addEventListener("click",()=>selectPiece(index));tray.append(slot);});}
function selectPiece(i){if(block.pieces[i].used)return;selectedPiece=i;renderBlocks();setMessage("حالا محل قرارگیری قطعه را روی صفحه لمس کن.");sfx("select");}
function placeSelected(r,c){if(blockAnimating)return;if(selectedPiece===null){setMessage("اول یکی از قطعه‌های پایین صفحه را انتخاب کن.");return;}const p=block.pieces[selectedPiece],result=BlockEngine.place(block.board,p,r,c);if(!result){setMessage("این قطعه در این محل جا نمی‌شود.");sound(160);return;}pushHistory();const placedCells=[],clearingCells=result.clearCells.map(([y,x])=>[y,x,block.board[y][x]]);for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(!block.board[y][x]&&result.board[y][x])placedCells.push([y,x]);block.board=result.board;p.used=true;moves++;score+=result.points;if(result.cleared){score+=result.cleared*10;setMessage("عالیه! ردیف‌ها و ستون‌ها در حال انفجارند.");sfx("clear");}else setMessage("قطعه با موفقیت قرار گرفت.");selectedPiece=null;if(block.pieces.every(x=>x.used))block.pieces=BlockEngine.newPieces();renderBlocks(placedCells,clearingCells);renderHud();if(result.cleared){blockAnimating=true;setTimeout(()=>{renderBlocks();blockAnimating=false;if(!BlockEngine.anyMove(block.board,block.pieces))endBlocks();},520);}else if(!BlockEngine.anyMove(block.board,block.pieces)){endBlocks();return;}if(!result.cleared)sfx("place");}
function winLevel(which){const reward=35+level*5;state.update({gems:state.get().gems+reward,level:level+1});renderHeader();showModal("مرحله کامل شد ✦","درخشان بود!","معما را حل کردی و "+fa(reward)+" کریستال به دست آوردی.",[{label:"مرحله بعدی",primary:true,action:()=>startGame(which)},{label:"صفحه اصلی",action:backHome}],"win");sfx("win");}
function endBlocks(){best=Math.max(best,score);showModal("پایان بازی","حرکت دیگری باقی نمانده","امتیاز تو: "+fa(score)+" · برای رکورد بهتر دوباره تلاش کن.",[{label:"بازی دوباره",primary:true,action:()=>startGame("blocks")},{label:"صفحه اصلی",action:backHome}],"lose");sfx("lose");}
function restart(){showModal("شروع دوباره","از اول شروع کنیم؟","پیشرفت همین مرحله پاک می‌شود.",[{label:"بله، شروع دوباره",primary:true,action:()=>startGame(mode)},{label:"ادامه بازی"}]);}
function hint(){if(mode==="liquid"){liquidHint();return;}if(selectedPiece===null){const i=block.pieces.findIndex(p=>!p.used);if(i>=0)selectPiece(i);}if(selectedPiece!==null){const p=block.pieces[selectedPiece];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(BlockEngine.fits(block.board,p.shape,r,c)){setMessage("راهنما: قطعه انتخاب‌شده در ردیف "+fa(r+1)+"، ستون "+fa(c+1)+" جا می‌شود.");return;}}setMessage("برای این قطعه جای خالی مناسبی نیست.");}
function settings(){showModal("تنظیمات","تنظیمات بازی","صدا را می‌توانی از دکمه بالای صفحه روشن یا خاموش کنی.",[{label:"متوجه شدم",primary:true}]);}
document.addEventListener("pointerdown",()=>{if(document.body.classList.contains("home-active"))startAmbient();},{passive:true});
$("#play-button").addEventListener("click",()=>{startAmbient();showModal("انتخاب مسیر","اولین چالش تو","کدام معما را می‌خواهی حل کنی؟",[{label:"مرتب‌سازی رنگ",primary:true,action:()=>startGame("liquid")},{label:"پازل بلوکی",action:()=>startGame("blocks")} ]);});
$("#liquid-mode").addEventListener("click",()=>startGame("liquid"));$("#block-mode").addEventListener("click",()=>startGame("blocks"));$("#back-home").addEventListener("click",backHome);$("#home-link").addEventListener("click",e=>{e.preventDefault();backHome();});$("#undo-button").addEventListener("click",undo);$("#hint-button").addEventListener("click",hint);$("#restart-button").addEventListener("click",restart);$("#settings-open").addEventListener("click",settings);$("#sound-toggle").addEventListener("click",()=>{state.update({sound:!state.get().sound});renderHeader();if(state.get().sound){sound(600);startAmbient();}else stopAmbient();});$("#dialog-close").addEventListener("click",closeModal);modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!modal.hidden)closeModal();else if(!game.hidden)backHome();}});document.body.classList.add("home-active");state.subscribe(renderHeader);renderHeader();
})();