/* CHROMA QUEST — local state foundation */
(function(){
  "use strict";
  const STORAGE_KEY = "chroma-quest-state-v1";
  const defaults = Object.freeze({gems:120,level:1,sound:true,selectedMode:null,stats:{liquidWins:0,blockRuns:0,blockClears:0,bestBlockScore:0}});
  function read(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(!raw) return {...defaults};
      const saved=JSON.parse(raw);
      return {
        gems:Number.isFinite(saved.gems)?Math.max(0,saved.gems):defaults.gems,
        level:Number.isFinite(saved.level)?Math.max(1,saved.level):defaults.level,
        sound:typeof saved.sound==="boolean"?saved.sound:defaults.sound,
        selectedMode:["liquid","blocks"].includes(saved.selectedMode)?saved.selectedMode:null,
        stats:{
          liquidWins:Number.isFinite(saved.stats?.liquidWins)?Math.max(0,saved.stats.liquidWins):0,
          blockRuns:Number.isFinite(saved.stats?.blockRuns)?Math.max(0,saved.stats.blockRuns):0,
          blockClears:Number.isFinite(saved.stats?.blockClears)?Math.max(0,saved.stats.blockClears):0,
          bestBlockScore:Number.isFinite(saved.stats?.bestBlockScore)?Math.max(0,saved.stats.bestBlockScore):0
        }
      };
    }catch(error){console.warn("Could not read saved game state.",error);return {...defaults};}
  }
  let state=read();
  const listeners=new Set();
  function snapshot(){return {...state};}
  function update(patch){
    state={...state,...patch};
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
    catch(error){console.warn("Could not save game state.",error);}
    listeners.forEach(listener=>listener(snapshot()));
    return snapshot();
  }
  window.ChromaState={
    get:snapshot,
    update,
    subscribe(listener){if(typeof listener!=="function")return()=>{};listeners.add(listener);return()=>listeners.delete(listener);}
  };
})();