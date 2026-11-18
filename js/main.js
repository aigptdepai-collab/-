/* CHROMA QUEST — home screen interactions */
(function(){
  "use strict";
  const state=window.ChromaState;
  const $=selector=>document.querySelector(selector);
  const backdrop=$("#modal-backdrop");
  const title=$("#dialog-title");
  const description=$("#dialog-description");
  const kicker=$("#dialog-kicker");
  const actions=$("#dialog-actions");
  let previousFocus=null;

  function openDialog(kind){
    previousFocus=document.activeElement;
    backdrop.hidden=false;
    if(kind==="settings"){
      kicker.textContent="تنظیمات بازی";
      title.textContent="همه‌چیز روبه‌راهه؟";
      description.textContent="تنظیمات اولیه بازی از همین‌جا قابل تغییر است.";
      actions.innerHTML='<button class="secondary-button" id="settings-sound" type="button">تغییر وضعیت صدا</button><button class="primary-button compact" id="settings-done" type="button">بازگشت به بازی</button>';
      $("#settings-sound").addEventListener("click",toggleSound);
      $("#settings-done").addEventListener("click",closeDialog);
    }else{
      kicker.textContent="انتخاب مسیر";
      title.textContent="اولین چالش تو";
      description.textContent="برای شروع ماجراجویی یکی از مسیرهای زیر را انتخاب کن.";
      actions.innerHTML='<button class="primary-button compact" data-mode="liquid" type="button">مرتب‌سازی رنگ <span>✦</span></button><button class="secondary-button" data-mode="blocks" type="button">پازل بلوکی <span>◆</span></button>';
      actions.querySelectorAll("[data-mode]").forEach(button=>button.addEventListener("click",()=>chooseMode(button.dataset.mode)));
    }
    const focusTarget=actions.querySelector("button");
    if(focusTarget)focusTarget.focus();
  }
  function closeDialog(){
    backdrop.hidden=true;
    if(previousFocus&&typeof previousFocus.focus==="function")previousFocus.focus();
  }
  function chooseMode(mode){
    state.update({selectedMode:mode});
    kicker.textContent=mode==="liquid"?"LIQUID SORT":"BLOCK PUZZLE";
    title.textContent=mode==="liquid"?"آماده مرتب‌سازی هستی؟":"وقت چیدن قطعه‌هاست!";
    description.textContent="این مسیر برای نسخه بعدی در حال آماده‌سازی است. انتخابت ذخیره شد؛ به‌زودی اولین مرحله را بازی می‌کنی.";
    actions.innerHTML='<button class="primary-button compact" id="mode-ok" type="button">متوجه شدم</button>';
    $("#mode-ok").addEventListener("click",closeDialog);
  }
  function toggleSound(){
    const next=!state.get().sound;
    state.update({sound:next});
    render();
  }
  function render(){
    const current=state.get();
    $("#gem-count").textContent=String(current.gems);
    $("#level-stat").textContent=String(current.level).padStart(2,"0").replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
    $("#sound-icon").textContent=current.sound?"♫":"♪̸";
    $("#sound-toggle").setAttribute("aria-pressed",String(current.sound));
    $("#sound-toggle").setAttribute("aria-label",current.sound?"خاموش کردن صدا":"روشن کردن صدا");
  }

  $("#play-button").addEventListener("click",()=>openDialog("play"));
  $("#liquid-mode").addEventListener("click",()=>{openDialog("play");});
  $("#block-mode").addEventListener("click",()=>{openDialog("play");});
  $("#settings-open").addEventListener("click",()=>openDialog("settings"));
  $("#sound-toggle").addEventListener("click",toggleSound);
  $("#dialog-close").addEventListener("click",closeDialog);
  backdrop.addEventListener("click",event=>{if(event.target===backdrop)closeDialog();});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!backdrop.hidden)closeDialog();});
  state.subscribe(render);
  render();
})();