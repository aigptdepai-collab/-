/* CHROMA QUEST — playable game controller */
(function(){
"use strict";
const $=s=>document.querySelector(s),state=window.ChromaState;
const home=$("#home-screen"),game=$("#game-screen"),store=$("#store-screen"),liquidBoard=$("#liquid-board"),blockWrap=$("#block-board-wrap"),blockBoard=$("#block-board"),tray=$("#piece-tray"),modal=$("#modal-backdrop");
const fa=n=>String(n).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
let mode=null,level=1,score=0,moves=0,best=0,selectedTube=null,selectedPiece=null,liquid=[],block=null,history=[],pourAnimating=false,blockAnimating=false,hintUses=0;
let audioContext=null;
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
function getAdventureRank(total){if(total>=2000)return "افسانه";if(total>=1200)return "استاد";if(total>=600)return "حرفه‌ای";if(total>=200)return "عادی";return "تازه‌وارد";}
function renderHeader(){const s=state.get();document.body.dataset.theme=(s.equippedTheme||"theme-violet").replace("theme-","");$("#gem-count").textContent=s.gems;const wallet=$("#store-gems");if(wallet)wallet.textContent=fa(s.gems);$("#gem-stat").textContent=fa(s.gems);$("#level-stat").textContent=fa(s.level).padStart(2,"۰");const rank=$("#adventure-rank");if(rank)rank.textContent=getAdventureRank(s.totalGemsEarned??s.gems);$("#sound-toggle").textContent=s.sound?"♫":"♪̸";document.body.dataset.tubeSkin=(s.equippedTubeSkin||"tube-glass").replace("tube-","");document.body.dataset.blockSkin=(s.equippedBlockSkin||"block-prism").replace("block-","");document.body.dataset.badge=(s.equippedBadge||"badge-none").replace("badge-","");}

const STORE_ITEMS=[
 {id:"theme-violet",type:"theme",name:"نئونی بنفش",tag:"DEFAULT",desc:"هویت کریستالی کلاسیک CHROMA",price:0,swatch:"violet",owned:true,group:"تم‌ها"},
 {id:"theme-aurora",type:"theme",name:"شفق قطبی",tag:"ATMOSPHERE",desc:"فیروزه‌ای و سبز زمردی",price:90,swatch:"aurora",group:"تم‌ها"},
 {id:"theme-ember",type:"theme",name:"کهربای سلطنتی",tag:"GOLD EDITION",desc:"مشکی عمیق با جزئیات طلایی",price:140,swatch:"ember",group:"تم‌ها"},
 {id:"theme-midnight",type:"theme",name:"آبی نیمه‌شب",tag:"NOCTURNE",desc:"آبی جوهری و آرام",price:180,swatch:"midnight",group:"تم‌ها"},
 {id:"theme-obsidian",type:"theme",name:"آبسیدین طلایی",tag:"PRESTIGE",desc:"سنگ آتشفشانی و طلای شامپاینی",price:260,swatch:"obsidian",group:"تم‌ها"},
 {id:"theme-rose",type:"theme",name:"رز نوآر",tag:"ATELIER",desc:"زرشکی تیره با رزگلد",price:220,swatch:"rose",group:"تم‌ها"},
 {id:"tube-glass",type:"tube",name:"شیشه کریستالی",tag:"CLASSIC",desc:"شفافیت شیشه با لبه‌های صیقلی",price:0,swatch:"glass",owned:true,group:"پوسته لوله"},
 {id:"tube-gold",type:"tube",name:"طلای برس‌خورده",tag:"GOLD CRAFT",desc:"لبه‌های فلزی طلایی و درخشش گرم",price:150,swatch:"gold",group:"پوسته لوله"},
 {id:"tube-obsidian",type:"tube",name:"آبسیدین",tag:"BLACK LABEL",desc:"بدنه تیره و لبه‌های سنگی",price:190,swatch:"obsidian",group:"پوسته لوله"},
 {id:"tube-frost",type:"tube",name:"یخ بلورین",tag:"FROST",desc:"شیشه سرد با هاله یخی",price:170,swatch:"frost",group:"پوسته لوله"},
 {id:"tube-rose",type:"tube",name:"رزگلد",tag:"ROSE METAL",desc:"فلز رزگلد با انعکاس ظریف",price:210,swatch:"rose",group:"پوسته لوله"},
 {id:"block-prism",type:"block",name:"منشور کلاسیک",tag:"DEFAULT",desc:"سطوح شفاف با نور منشوری",price:0,swatch:"prism",owned:true,group:"پوسته بلوک"},
 {id:"block-marble",type:"block",name:"مرمر سلطنتی",tag:"MARBLE",desc:"بافت سنگی لوکس و رگه‌های روشن",price:130,swatch:"marble",group:"پوسته بلوک"},
 {id:"block-metal",type:"block",name:"تیتانیوم",tag:"TITANIUM",desc:"سطح فلزی برس‌خورده و صنعتی",price:160,swatch:"metal",group:"پوسته بلوک"},
 {id:"block-neon",type:"block",name:"نئون شب",tag:"AFTER DARK",desc:"لبه‌های نورانی روی زمینه تیره",price:180,swatch:"neon",group:"پوسته بلوک"},
 {id:"badge-none",type:"badge",name:"بدون نشان",tag:"DEFAULT",desc:"نمای ساده و مینیمال",price:0,swatch:"violet",owned:true,group:"نشان‌ها"},
 {id:"badge-royal",type:"badge",name:"نشان سلطنتی",tag:"ROYAL CREST",desc:"نشان اختصاصی طلایی برای پروفایل",price:140,swatch:"gold",group:"نشان‌ها"},
 {id:"badge-master",type:"badge",name:"استاد رنگ‌ها",tag:"COLOR MASTER",desc:"نشان ویژه برای استادان معما",price:240,swatch:"rose",group:"نشان‌ها"}
];
const groups=["همه","تم‌ها","پوسته لوله","پوسته بلوک","نشان‌ها"];
let storeFilter="همه";
function openStorePreview(item,art){
 const overlay=document.createElement("div");overlay.className="store-preview-backdrop";
 const panel=document.createElement("section");panel.className="store-preview-panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");
 const visual=art.cloneNode(true);visual.classList.add("store-preview-art");
 const title=document.createElement("h2");title.textContent=item.name;
 const desc=document.createElement("p");desc.textContent=item.desc;
 const type=document.createElement("span");type.className="store-preview-type";type.textContent=item.group;
 const close=document.createElement("button");close.type="button";close.className="store-preview-close";close.textContent="بستن";
 close.addEventListener("click",()=>overlay.remove());
 overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove();});
 panel.append(visual,type,title,desc,close);overlay.append(panel);document.body.append(overlay);close.focus();
}
function renderStore(){
 const s=state.get(),grid=$("#store-grid");if(!grid)return;
 $("#store-gems").textContent=fa(s.gems);grid.innerHTML="";
 let filters=$("#store-filters");
 if(filters){filters.innerHTML="";groups.forEach(group=>{const b=document.createElement("button");b.type="button";b.className="store-filter"+(storeFilter===group?" active":"");b.textContent=group;b.addEventListener("click",()=>{storeFilter=group;renderStore();});filters.append(b);});}
 STORE_ITEMS.filter(item=>storeFilter==="همه"||item.group===storeFilter).forEach(item=>{
  const owned=s.ownedItems.includes(item.id),key={theme:"equippedTheme",tube:"equippedTubeSkin",block:"equippedBlockSkin",badge:"equippedBadge"}[item.type],equipped=s[key]===item.id;
  const card=document.createElement("article");card.className="store-item "+(equipped?"is-equipped":"");
  const art=document.createElement("button");art.type="button";art.className="store-item-art preview-"+item.type+" art-"+item.swatch+" art-"+item.id;art.setAttribute("aria-label","پیش‌نمایش "+item.name);
  art.innerHTML='<span class="art-orbit"></span><span class="art-crystal"></span><span class="preview-object" aria-hidden="true"></span><small>'+item.tag+'</small><b class="art-view-label">مشاهده</b>';
  art.addEventListener("click",()=>openStorePreview(item,art));
  const info=document.createElement("div");info.className="store-item-info";
  const title=document.createElement("h3");title.textContent=item.name;
  const desc=document.createElement("p");desc.textContent=item.desc;
  const foot=document.createElement("div");foot.className="store-item-foot";
  const price=document.createElement("span");price.className="item-price";price.textContent=item.price===0?"رایگان":"◆ "+fa(item.price);
  const button=document.createElement("button");button.type="button";button.className="item-action"+(equipped?" equipped":"");
  button.textContent=equipped?"فعال است":owned?"فعال‌سازی":"بازگشایی";button.disabled=equipped;
  button.addEventListener("click",()=>storeAction(item));
  foot.append(price,button);info.append(title,desc,foot);card.append(art,info);grid.append(card);
 });
}
function storeAction(item){
 const s=state.get(),owned=s.ownedItems.includes(item.id);
 if(!owned){
  if(s.gems<item.price){showModal("کریستال کافی نیست","اعتبار کافی نداری","با حل مراحل بازی کریستال جمع کن و دوباره برگرد.",[{label:"متوجه شدم",primary:true}]);return;}
  state.update({gems:s.gems-item.price,ownedItems:[...s.ownedItems,item.id]});
 }
 const key={theme:"equippedTheme",tube:"equippedTubeSkin",block:"equippedBlockSkin",badge:"equippedBadge"}[item.type];
 state.update({[key]:item.id});renderStore();renderHeader();sfx("select");
}
function openStore(){
 closeModal();
 document.body.classList.remove("game-active");document.body.classList.add("home-active","store-active");
 home.hidden=true;game.hidden=true;store.hidden=false;
 $("#home-nav").classList.remove("active");$("#home-nav").removeAttribute("aria-current");
 $("#store-nav").classList.add("active");renderStore();window.scrollTo({top:0,behavior:"smooth"});
}
function closeStore(){
 closeModal();
 store.hidden=true;home.hidden=false;document.body.classList.remove("store-active");
 $("#store-nav").classList.remove("active");$("#home-nav").classList.add("active");$("#home-nav").setAttribute("aria-current","page");
 window.scrollTo({top:0,behavior:"smooth"});
}

function setMessage(t){$("#game-message").textContent=t;}
function closeModal(){modal.hidden=true;modal.classList.remove("result-win","result-lose","achievement-view");}
function showModal(kicker,title,description,buttons,resultType=""){modal.classList.remove("result-win","result-lose","achievement-view");if(kicker==="تالار افتخارات")modal.classList.add("achievement-view");if(resultType)modal.classList.add("result-"+resultType);$("#dialog-kicker").textContent=kicker;$("#dialog-title").textContent=title;$("#dialog-description").textContent=description;const actions=$("#dialog-actions");actions.innerHTML="";buttons.forEach(b=>{const el=document.createElement("button");el.className=b.primary?"primary-button":"secondary-button";el.textContent=b.label;el.addEventListener("click",()=>{closeModal();if(b.action)b.action();});actions.append(el);});modal.hidden=false;}
function startGame(which){document.body.classList.remove("home-active");document.body.classList.add("game-active");$("#home-nav").classList.remove("active");$("#home-nav").removeAttribute("aria-current");mode=which;level=state.get().level;best=state.get().stats.bestBlockScore||0;hintUses=0;updateHintButton();home.hidden=true;game.hidden=false;$("#game-kicker").textContent=which==="liquid"?"LIQUID SORT":"BLOCK PUZZLE";$("#game-title").textContent=which==="liquid"?"مرتب‌سازی رنگ":"پازل بلوکی";$("#game-level").textContent=fa(level);liquidBoard.hidden=which!=="liquid";blockWrap.hidden=which!=="blocks";score=0;moves=0;history=[];selectedTube=null;selectedPiece=null;if(which==="liquid"){liquid=LiquidEngine.makeLevel(level);renderLiquid();}else{block={board:BlockEngine.emptyBoard(),pieces:BlockEngine.newPieces()};renderBlocks();}renderHud();setMessage(which==="liquid"?"رنگ‌های یکسان را در یک لوله جمع کن.":"قطعه‌ای را انتخاب کن و در خانه‌های خالی قرار بده.");sfx("start");}
function backHome(){store.hidden=true;document.body.classList.remove("game-active","store-active");document.body.classList.add("home-active");$("#store-nav").classList.remove("active");$("#home-nav").classList.add("active");$("#home-nav").setAttribute("aria-current","page");game.hidden=true;home.hidden=false;mode=null;closeModal();}
function renderHud(){$("#score-value").textContent=fa(score);$("#moves-value").textContent=fa(moves);$("#best-value").textContent=fa(best);}
function pushHistory(){history.push(mode==="liquid"?{mode,tubes:LiquidEngine.clone(liquid),score,moves}:{mode,board:BlockEngine.clone(block.board),pieces:block.pieces.map(p=>({...p,shape:p.shape.map(r=>r.slice())})),score,moves});if(history.length>30)history.shift();}
function undo(){const h=history.pop();if(!h){setMessage("هنوز حرکتی برای برگشت وجود ندارد.");return;}score=h.score;moves=h.moves;if(h.mode==="liquid"){liquid=LiquidEngine.clone(h.tubes);selectedTube=null;renderLiquid();}else{block={board:BlockEngine.clone(h.board),pieces:h.pieces};selectedPiece=null;renderBlocks();}renderHud();setMessage("حرکت قبلی برگشت داده شد.");sfx("undo");}
function renderLiquid(targetIndex=null,flowAmount=0,sourceIndex=null){liquidBoard.innerHTML="";liquid.forEach((tube,index)=>{const reservoir=LiquidEngine.hasReservoir(level)&&index===liquid.length-1;const el=document.createElement("button");el.type="button";el.className="tube skin-"+(state.get().equippedTubeSkin||"tube-glass").replace("tube-","")+(reservoir?" reservoir":"")+(!tube.length?" empty":"")+(selectedTube===index?" selected":"")+(targetIndex===index?" pour-target":"")+(sourceIndex===index?" pour-source":"");el.setAttribute("aria-label",reservoir?"مخزن انتقال":("لوله "+fa(index+1)));tube.forEach((color,layerIndex)=>{const layer=document.createElement("span");layer.className="liquid-layer"+(targetIndex===index&&layerIndex>=tube.length-flowAmount?" flow-in":"");layer.style.background=LiquidEngine.COLORS[color];el.append(layer);});el.addEventListener("click",()=>tapTube(index));liquidBoard.append(el);});}
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
function renderBlocks(placedCells=[],clearingCells=[]){const placedSet=new Set(placedCells.map(([r,c])=>r+","+c)),clearingMap=new Map(clearingCells.map(([r,c,color])=>[r+","+c,color]));blockBoard.innerHTML="";for(let r=0;r<8;r++)for(let c=0;c<8;c++){const cell=document.createElement("button");cell.type="button";const key=r+","+c,clearing=clearingMap.has(key);cell.className="block-cell skin-"+(state.get().equippedBlockSkin||"block-prism").replace("block-","")+(block.board[r][c]?" filled":"")+(placedSet.has(key)?" placed":"")+(clearing?" clearing":"");cell.setAttribute("role","gridcell");if(block.board[r][c])cell.style.setProperty("--cell-color",block.board[r][c]);else if(clearing)cell.style.setProperty("--cell-color",clearingMap.get(key));cell.addEventListener("click",()=>placeSelected(r,c));blockBoard.append(cell);}tray.innerHTML="";block.pieces.forEach((piece,index)=>{const slot=document.createElement("button");slot.type="button";slot.className="piece-slot"+(piece.used?" used":"")+(selectedPiece===index?" selected":"");slot.setAttribute("aria-label","قطعه "+fa(index+1));if(!piece.used){const shape=document.createElement("span");shape.className="piece-shape";shape.style.gridTemplateColumns="repeat("+piece.shape[0].length+",17px)";shape.style.setProperty("--piece-color",piece.color);piece.shape.forEach(row=>row.forEach(v=>{const sq=document.createElement("i");sq.className="piece-square";sq.style.visibility=v?"visible":"hidden";shape.append(sq);}));slot.append(shape);}slot.addEventListener("click",()=>selectPiece(index));tray.append(slot);});}
function selectPiece(i){if(block.pieces[i].used)return;selectedPiece=i;renderBlocks();setMessage("حالا محل قرارگیری قطعه را روی صفحه لمس کن.");sfx("select");}
function placeSelected(r,c){if(blockAnimating)return;if(selectedPiece===null){setMessage("اول یکی از قطعه‌های پایین صفحه را انتخاب کن.");return;}const p=block.pieces[selectedPiece],result=BlockEngine.place(block.board,p,r,c);if(!result){setMessage("این قطعه در این محل جا نمی‌شود.");sound(160);return;}pushHistory();const placedCells=[],clearingCells=result.clearCells.map(([y,x])=>[y,x,block.board[y][x]]);for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(!block.board[y][x]&&result.board[y][x])placedCells.push([y,x]);block.board=result.board;p.used=true;moves++;score+=result.points;if(result.cleared){score+=result.cleared*10;const current=state.get();state.update({stats:{...current.stats,blockClears:current.stats.blockClears+result.cleared}});setMessage("عالیه! ردیف‌ها و ستون‌ها در حال انفجارند.");sfx("clear");}else setMessage("قطعه با موفقیت قرار گرفت.");selectedPiece=null;if(block.pieces.every(x=>x.used))block.pieces=BlockEngine.newPieces();renderBlocks(placedCells,clearingCells);renderHud();if(result.cleared){blockAnimating=true;setTimeout(()=>{renderBlocks();blockAnimating=false;if(!BlockEngine.anyMove(block.board,block.pieces))endBlocks();},520);}else if(!BlockEngine.anyMove(block.board,block.pieces)){endBlocks();return;}if(!result.cleared)sfx("place");}
function winLevel(which){const reward=20;const current=state.get();if(which==="liquid"){state.update({gems:current.gems+reward,totalGemsEarned:(current.totalGemsEarned??current.gems)+reward,level:level+1,stats:{...current.stats,liquidWins:current.stats.liquidWins+1}});}else{state.update({gems:current.gems+reward,totalGemsEarned:(current.totalGemsEarned??current.gems)+reward,level:level+1});}renderHeader();showModal("مرحله کامل شد ✦","درخشان بود!","معما را حل کردی و "+fa(reward)+" کریستال به دست آوردی.",[{label:"مرحله بعدی",primary:true,action:()=>startGame(which)},{label:"صفحه اصلی",action:backHome}],"win");sfx("win");}
function endBlocks(){best=Math.max(best,score);const current=state.get();state.update({stats:{...current.stats,blockRuns:current.stats.blockRuns+1,bestBlockScore:Math.max(current.stats.bestBlockScore,score)}});showModal("پایان بازی","حرکت دیگری باقی نمانده","امتیاز تو: "+fa(score)+" · برای رکورد بهتر دوباره تلاش کن.",[{label:"بازی دوباره",primary:true,action:()=>startGame("blocks")},{label:"صفحه اصلی",action:backHome}],"lose");sfx("lose");}
function restart(){showModal("شروع دوباره","از اول شروع کنیم؟","پیشرفت همین مرحله پاک می‌شود.",[{label:"بله، شروع دوباره",primary:true,action:()=>startGame(mode)},{label:"ادامه بازی"}]);}
function updateHintButton(){const button=$("#hint-button");if(!button)return;button.innerHTML=hintUses?"✧ <span>راهنما استفاده شد</span>":"✧ <span>راهنما ۱/۱</span>";button.disabled=hintUses>=1;}
function bestLiquidMove(){const options=[];for(let a=0;a<liquid.length;a++)for(let b=0;b<liquid.length;b++)if(LiquidEngine.canPour(liquid,a,b)){const result=LiquidEngine.pour(liquid,a,b),targetWasEmpty=liquid[b].length===0,sourceFinished=result.tubes[a].length===0,targetFinished=result.tubes[b].length===4&&result.tubes[b].every(x=>x===result.tubes[b][0]);let value=result.amount*4+(targetWasEmpty?1:7)+(sourceFinished?8:0)+(targetFinished?30:0);if(liquid[a].length===4&&liquid[a].every(x=>x===liquid[a][0]))value-=20;options.push({from:a,to:b,value,amount:result.amount});}options.sort((a,b)=>b.value-a.value);return options[0]||null;}
function bestBlockMove(){let bestMove=null;block.pieces.forEach((p,i)=>{if(p.used)return;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const result=BlockEngine.place(block.board,p,r,c);if(!result)continue;const center=Math.abs(3.5-r)+Math.abs(3.5-c),value=result.points+result.cleared*35-center*.15;if(!bestMove||value>bestMove.value)bestMove={piece:i,row:r,col:c,value,cleared:result.cleared};}});return bestMove;}
function hint(){if(hintUses>=1){setMessage("راهنمای این مرحله استفاده شده؛ ادامه‌اش با خودته!");return;}if(mode==="liquid"){const move=bestLiquidMove();if(!move){setMessage("حرکت قانونی پیدا نشد؛ مرحله را دوباره شروع کن.");return;}hintUses++;updateHintButton();selectedTube=move.from;renderLiquid();const target=liquidBoard.children[move.to];if(target)target.classList.add("hint-target");setMessage("راهنما: از لولهٔ "+fa(move.from+1)+" به لولهٔ "+fa(move.to+1)+" بریز.");return;}const move=bestBlockMove();if(!move){setMessage("برای قطعه‌های باقی‌مانده جای مناسبی پیدا نشد.");return;}hintUses++;updateHintButton();selectedPiece=move.piece;renderBlocks();const slot=tray.children[move.piece],cell=blockBoard.children[move.row*8+move.col];if(slot)slot.classList.add("hint-piece");if(cell)cell.classList.add("hint-target");setMessage("راهنما: قطعهٔ "+fa(move.piece+1)+" را در ردیف "+fa(move.row+1)+" و ستون "+fa(move.col+1)+" قرار بده.");}
function showAchievements(){
 const s=state.get(),a=s.stats;
 const items=[
  {icon:"✦",name:"اولین پیروزی",desc:"بردن اولین مرحله مرتب‌سازی رنگ",current:a.liquidWins,target:1,unit:"مرحله"},
  {icon:"♛",name:"قهرمان رنگ‌ها",desc:"بردن ۵ مرحله مرتب‌سازی رنگ",current:a.liquidWins,target:5,unit:"مرحله"},
  {icon:"▦",name:"شروع بلوکی",desc:"تمام کردن اولین دور پازل بلوکی",current:a.blockRuns,target:1,unit:"دور"},
  {icon:"✧",name:"شکننده ردیف‌ها",desc:"پاک کردن ۱۰ ردیف یا ستون",current:a.blockClears,target:10,unit:"ردیف"},
  {icon:"◆",name:"امتیاز درخشان",desc:"رسیدن به امتیاز ۵۰۰ در پازل بلوکی",current:a.bestBlockScore,target:500,unit:"امتیاز"}
 ];
 const unlocked=items.filter(x=>x.current>=x.target).length;
 const cards=items.map(x=>{
  const value=Math.min(x.current,x.target),pct=Math.round(value/x.target*100),done=value>=x.target;
  return '<article class="achievement-card '+(done?"is-unlocked":"is-locked")+'"><div class="achievement-emblem">'+x.icon+'</div><div class="achievement-copy"><div class="achievement-card-top"><h3>'+x.name+'</h3><span class="achievement-status">'+(done?"باز شده":"قفل")+'</span></div><p>'+x.desc+'</p><div class="achievement-progress"><span style="width:'+pct+'%"></span></div><div class="achievement-progress-meta"><span>'+(done?"تکمیل شد":fa(value)+" از "+fa(x.target))+'</span><b>'+fa(pct)+'٪</b></div></div></article>';
 }).join("");
 showModal("تالار افتخارات",fa(unlocked)+" از ۵ دستاورد باز شده","",[{label:"بازگشت",primary:true}]);
 $("#dialog-description").innerHTML='<div class="achievement-overview"><div class="achievement-trophy">♛</div><div><strong>'+fa(unlocked)+' / ۵</strong><span>مدال‌های کسب‌شده</span></div><div class="achievement-overview-track"><i style="width:'+(unlocked/items.length*100)+'%"></i></div></div><div class="achievement-list">'+cards+'</div>';
}
function settings(){showModal("تنظیمات","تنظیمات بازی","صدا را می‌توانی از دکمه بالای صفحه روشن یا خاموش کنی.",[{label:"متوجه شدم",primary:true}]);} $("#play-button").addEventListener("click",()=>{showModal("انتخاب مسیر","اولین چالش تو","کدام معما را می‌خواهی حل کنی؟",[{label:"مرتب‌سازی رنگ",primary:true,action:()=>startGame("liquid")},{label:"پازل بلوکی",action:()=>startGame("blocks")} ]);});
$("#liquid-mode").addEventListener("click",()=>startGame("liquid"));$("#block-mode").addEventListener("click",()=>startGame("blocks"));$("#back-home").addEventListener("click",backHome);$("#home-link").addEventListener("click",e=>{e.preventDefault();backHome();});$("#undo-button").addEventListener("click",undo);$("#hint-button").addEventListener("click",hint);$("#restart-button").addEventListener("click",restart);$("#settings-open").addEventListener("click",settings);$("#achievements-nav").addEventListener("click",showAchievements);$("#home-nav").addEventListener("click",backHome);$("#store-nav").addEventListener("click",openStore);$("#store-back").addEventListener("click",closeStore);$("#sound-toggle").addEventListener("click",()=>{state.update({sound:!state.get().sound});renderHeader();if(state.get().sound){sound(600);}});$("#dialog-close").addEventListener("click",closeModal);modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!modal.hidden)closeModal();else if(!game.hidden)backHome();}});document.body.classList.add("home-active");const intro=$("#intro-splash");if(intro){document.body.classList.add("intro-active");const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;window.setTimeout(()=>{intro.classList.add("is-leaving");document.body.classList.remove("intro-active");window.setTimeout(()=>intro.remove(),550);},reduced?220:1850);}state.subscribe(renderHeader);renderHeader();
})();