(() => {
  'use strict';
  const data=JSON.parse(document.getElementById('room-data').textContent);
  const $=id=>document.getElementById(id);
  const SAVE='site-down-room-v1', PREF='site-down-room-settings-v1';
  let preferences={},saved=null,storageOK=true;
  try{preferences=JSON.parse(localStorage.getItem(PREF)||'{}')||{};saved=localStorage.getItem(SAVE);}catch(_){storageOK=false;}
  let room;
  try{room=new RoomCore.Room(saved);}catch(_){room=new RoomCore.Room();}
  let language=preferences.language==='en'?'en':'fa';
  let sound=Boolean(preferences.sound);
  let motion=typeof preferences.motion==='boolean'?preferences.motion:!matchMedia('(prefers-reduced-motion: reduce)').matches;
  let showHints=false,panel=null,computerTab='browser',panelKey='',lastTime=performance.now(),elapsed=0,speechTime=0;
  let training=null,devReturnPanel=null,plannerReturn=null,sceneSource=null,storyCursor=preferences.storyCursor||null;
  let speechKey='',speechValues={},audio=null,hum=null,humGain=null,eventTime=0,autosaveTime=0,toolsTime=0,radioClock=0,radioNote=0;
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=value=>Number(value).toLocaleString(language==='fa'?'fa-IR':'en-US',{maximumFractionDigits:0,useGrouping:false});
  function text(key,values={}){return (data.strings[language][key]||key).replace(/\{(\w+)\}/g,(_,name)=>typeof values[name]==='number'?num(values[name]):String(values[name]??''));}
  const t=(key,values)=>escape(text(key,values));
  const action=(id,key,disabled=false,secondary=false)=>`<button type="button" class="panel-button ${secondary?'secondary':''}" data-action="${id}" ${disabled?'disabled':''}>${t(key)}</button>`;
  const heading=(eyebrow,title,copy)=>`<div class="panel-eyebrow">${t(eyebrow)}</div><h2 id="panel-title">${t(title)}</h2>${copy?`<p>${t(copy)}</p>`:''}`;
  const row=(key,value)=>`<div class="device-row"><span>${t(key)}</span><b>${escape(value)}</b></div>`;
  const rowText=(label,value)=>`<div class="device-row"><span>${escape(label)}</span><b>${escape(value)}</b></div>`;
  const progress=()=>room.job?`<div class="progress-track" role="progressbar" aria-label="${t('busy')}" aria-valuemin="0" aria-valuemax="100" id="job-meter"><i id="job-progress"></i></div>`:'';

  function save(){
    try{localStorage.setItem(SAVE,room.serialize());localStorage.setItem(PREF,JSON.stringify({language,sound,motion,storyCursor}));}
    catch(_){storageOK=false;}
    $('save-warning').hidden=storageOK;
  }
  function startAudio(){
    if(!sound)return;
    try{
      audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});
      if(!hum){hum=audio.createOscillator();humGain=audio.createGain();hum.type='sine';hum.frequency.value=50;humGain.gain.value=.008;hum.connect(humGain);humGain.connect(audio.destination);hum.start();}
      updateAudio();
    }catch(_){sound=false;}
  }
  function updateAudio(){if(humGain)humGain.gain.setTargetAtTime(sound&&room.started&&!room.paused&&!document.hidden ? .008 : 0,audio.currentTime,.1);}
  function beep(kind='click'){
    if(!sound||!audio||room.paused||audio.state!=='running')return;
    try{const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;
      osc.type=kind==='print'?'sawtooth':'sine';osc.frequency.value=kind==='print'?75:kind==='error'?120:kind==='tea'?540:330;
      gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(kind==='print'?.012:.035,now+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+(kind==='print'?1.2:.2));
      osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(now+1.3);
    }catch(_){}
  }
  function say(key,values={}){speechKey=key;speechValues=values;speechTime=7;$('speech-text').textContent=text(key,values);$('speech').hidden=!room.started;}
  function announce(key,values={}){eventTime=6;$('game-event').textContent=text(key,values);$('game-event').hidden=false;$('speech').hidden=true;$('game-event').classList.toggle('slip',key.startsWith('slip_'));}
  function renderDifficulty(){
    document.querySelectorAll('[data-difficulty]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.difficulty===room.state.difficulty)));
    $('difficulty-description').textContent=text(room.state.difficulty?'difficulty_'+room.state.difficulty:'difficulty_choose');
    $('start').disabled=!room.state.difficulty;
    $('restart-shift').hidden=!room.state.gameOver&&!room.state.order.completed.length&&room.state.order.step===0;
    $('difficulty-picker').hidden=false;
  }
  function playRadioNote(){
    if(!sound||!audio||audio.state!=='running')return;
    try{const melody=[220,261.63,293.66,261.63,196,220,246.94,196],note=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;note.type='triangle';note.frequency.value=melody[radioNote++%melody.length];gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.009,now+.07);gain.gain.exponentialRampToValueAtTime(.0001,now+.65);note.connect(gain);gain.connect(audio.destination);note.start();note.stop(now+.7);}catch(_){}
  }
  function translate(){
    document.documentElement.lang=language;document.documentElement.dir=language==='fa'?'rtl':'ltr';
    document.title=localized(RoomCore.STORY.title);
    document.querySelectorAll('[data-text]').forEach(el=>el.textContent=text(el.dataset.text));
    document.querySelectorAll('[data-place]').forEach(el=>el.setAttribute('aria-label',text(el.dataset.place)));
    $('shop-image').alt=text('room_alt');$('world').setAttribute('aria-label',text('shop_name'));
    document.querySelector('.settings').setAttribute('aria-label',text('settings'));
    $('close-panel').setAttribute('aria-label',text('close'));$('stress-bar').setAttribute('aria-label',text('stress'));$('patience-bar').setAttribute('aria-label',text('patience'));
    $('language').textContent=language==='fa'?'English':'فارسی';
    $('audio').textContent=text(sound?'audio_on':'audio_off');$('audio').setAttribute('aria-pressed',String(sound));
    $('motion').textContent=text(motion?'motion_on':'motion_off');$('motion').setAttribute('aria-pressed',String(motion));
    $('show-hints').setAttribute('aria-pressed',String(showHints));
    document.body.classList.toggle('no-motion',!motion);
    if(speechKey)$('speech-text').textContent=text(speechKey,speechValues);
    if(eventTime>0)$('game-event').hidden=true;
    renderDifficulty();panelKey='';renderPanel();renderHUD();
  }
  function renderHUD(){
    renderScene();renderCustomer();
    $('dev-toolbar').hidden=!room.started||!room.state.developer;
    $('dev-skip').disabled=!canSkipCustomer();
    const today=room.day(),done=room.state.order.completed.filter(k=>k.endsWith(':'+(today-1))&&room.state.roster.some(i=>k.startsWith(RoomCore.CUSTOMERS[i].id+':'))).length;
    $('day-status').textContent=text(today>3?'night_progress':'day_progress',{day:today,count:done});
    $('day-board').textContent=text('day_number',{day:today})+' · '+text('day_board');
    $('stress-number').textContent=room.state.stress.toLocaleString(language==='fa'?'fa-IR':'en-US',{maximumFractionDigits:1,useGrouping:false})+'%';
    $('stress-fill').style.width=`${room.state.stress}%`;
    $('stress-bar').setAttribute('aria-valuenow',String(room.state.stress));
    document.body.classList.toggle('stress-high',room.state.stress>50);document.body.classList.toggle('stress-critical',room.state.stress>=80);
    $('stress-state').textContent=text(room.state.stress>=80?'stress_critical':room.state.stress>50?'stress_high':'stress_safe');
    $('stress-cause').textContent=text(room.state.stressReason);
    $('stress-bar').setAttribute('aria-valuetext',num(Math.round(room.state.stress))+'% — '+$('stress-state').textContent);
    $('take-breath').disabled=Boolean(room.job)||room.state.devices.breathCooldown>0||Boolean(room.state.ending);
    $('paper-count').textContent=text('paper_count',{count:room.state.paper});
    renderPatience();
    const tr=room.state.plot.transfer;
    $('copy-cover').hidden=!room.started||!tr.active||Boolean(room.state.ending)||room.paused;
    $('copy-cover').textContent=text(tr.covered?'copy_resume':'copy_cover');
    if($('copy-fill'))$('copy-fill').style.width=tr.elapsed/8*100+'%';
    if($('copy-meter'))$('copy-meter').setAttribute('aria-valuenow',String(Math.round(tr.elapsed/8*100)));
    if($('copy-status'))$('copy-status').textContent=text(tr.covered?'copy_covered':tr.alarm>0?'copy_alert':tr.active?'copy_running':'copy_daily_done');
    if($('job-progress')){$('job-progress').style.width=`${room.job?room.job.elapsed/room.job.duration*100:100}%`;$('job-meter').setAttribute('aria-valuenow',String(room.job?Math.floor(room.job.elapsed/room.job.duration*100):100));}
  }
  const localized=value=>value?.[language]??'';
  const customerId=()=>room.customer()?.id;
  const missionName=()=>localized(room.mission()?.title);
  function objective(){const q=room.state.order;if(room.state.dayBreak)return text('day_number',{day:room.day()});if(room.state.ending)return text(room.state.ending==='good'?'good_ending':'bad_ending');return q.index===RoomCore.COUNT?text('all_done'):!room.state.present?text('waiting_customer'):q.step===0?text('accept_instruction'):q.step===room.deliveryStep()?text('deliver_order'):q.step===5?text('leave_customer'):localized(room.task()?.label);}
  function taskPlace(){return room.task()?.place||'customer';}
  function taskApp(){return room.task()?.app||'browser';}
  const digits=value=>String(value).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[,٬\s]/g,'');
  let customerRenderKey='',taskFeedback=null;
  function dialogueContent(){
    const q=room.state.order;
    if(room.state.feedback)return {lines:[localized(room.state.feedback.message)]};
    if(q.step===0)return {lines:room.mission().lines[language]};
    if(q.step===5)return {lines:room.state.failed.includes(customerId()+':'+q.mission)?[text('no_payment')]:[text('customer_thanks'),text('payment_line',{amount:room.mission().reward+q.bonus})]};
    return {lines:[text(room.state.wait>=30?'customer_waiting':'customer_working')]};
  }
  function renderCustomer(){
    const q=room.state.order,key=JSON.stringify([q.index,q.mission,q.step,q.line,q.earnings,q.bonus,q.completed.length,room.state.plot.day,room.state.ending,room.state.dayBreak,language,room.started,room.paused,panel,room.job?.kind,room.state.present,room.state.gameOver,Math.ceil(room.state.arrivalRemaining),Math.ceil(room.state.departureRemaining),room.state.wait>=30,room.state.feedback]);
    if(key===customerRenderKey)return;customerRenderKey=key;
    $('customer-sprite').hidden=!room.started||!room.state.present||q.index===RoomCore.COUNT||room.state.gameOver;
    $('order-tracker').hidden=!room.started;
    $('scene-dialogue').hidden=!room.started||!room.state.present||q.index===RoomCore.COUNT||Boolean(panel)||room.paused||room.state.gameOver;
    $('customer-actions').hidden=!room.started||Boolean(panel)||room.paused||room.state.gameOver||room.state.dayBreak||q.index===RoomCore.COUNT;
    $('accept-order').hidden=!room.state.present||q.step!==0;$('accept-order').disabled=Boolean(room.job);
    $('deliver-order').hidden=!room.state.present||q.step!==room.deliveryStep();$('deliver-order').disabled=Boolean(room.job);
    $('leave-customer').hidden=!room.state.present||q.step!==5;
    $('visit-status').hidden=room.state.present&&q.step!==5;
    $('visit-status').textContent=text(room.state.present?'leaving_soon':'arrival_in',{seconds:Math.ceil(room.state.present?room.state.departureRemaining:room.state.arrivalRemaining)});
    document.body.classList.toggle('has-scene-dialogue',!$('scene-dialogue').hidden);
    if(q.index<RoomCore.COUNT&&room.state.present){
      const id=customerId(),name=localized(room.customer().name),dialogue=dialogueContent(),line=Math.min(q.line,dialogue.lines.length-1);
      if($('customer-image').dataset.customer!==id){$('customer-image').src=data.portraits[id];$('customer-image').dataset.customer=id;}
      $('customer-image').alt=name;$('customer-name').textContent=name;$('customer-sprite').setAttribute('aria-label',text('talk_to',{name}));
      $('scene-dialogue-name').textContent=name+' · '+missionName();
      $('scene-dialogue-line').textContent=dialogue.lines[line];
      $('scene-dialogue-count').textContent=num(line+1)+' / '+num(dialogue.lines.length);
      $('scene-dialogue-hint').textContent=text(room.state.feedback?'read_reaction':line<dialogue.lines.length-1?'click_next':'dialogue_end');
      $('scene-dialogue').disabled=false;
      $('scene-dialogue').setAttribute('aria-label',name+': '+dialogue.lines[line]+' — '+$('scene-dialogue-hint').textContent);
    }
    $('order-label').textContent=q.index===RoomCore.COUNT?text('shift_done'):!room.state.present?text('waiting_customer'):localized(room.customer().name)+' · '+text('mission_number',{count:q.mission+1});
    $('order-objective').textContent=objective();
    $('order-money').textContent=text('cash')+': '+text('tomans',{amount:room.balance()})+' · '+text('orders_done',{count:room.visitCount()});
    $('order-tracker').setAttribute('aria-label',text('customer')+' — '+objective());
  }
  function performOrder(action){
    const task=room.task(),result=room.orderAction(action);if(!result)return;
    taskFeedback=result==='wrong_choice'?task.feedback:null;
    if(taskFeedback){say('choice_feedback',{message:localized(taskFeedback)});announce('choice_feedback',{message:localized(taskFeedback)});}else{say(result);announce(result);}
    if(room.job?.kind==='work'&&room.task()?.kind==='print'){$('printer-paper').classList.remove('printing');void $('printer-paper').offsetWidth;$('printer-paper').classList.add('printing');beep('print');}else beep(result==='wrong_choice'?'error':'click');
    if(action==='next'&&panel)closePanel();
    renderPanel();renderHUD();save();if(room.state.order.index===RoomCore.COUNT)openPanel('customer');
    if(room.state.ending)openPanel('ending');
  }
  function advanceDialogue(){
    if(!room.ready()||panel||!room.mission())return;
    if(room.dialogueNext()){renderHUD();save();return;}
    // Speech clicks only advance speech. Accept, deliver and tools have their own buttons.
  }
  function canSkipCustomer(){return room.started&&room.state.developer&&!room.state.dayBreak&&!room.state.ending&&room.state.present&&room.state.order.step<5;}
  function askDeveloperSkip(){if(!canSkipCustomer())return;devReturnPanel=panel;openPanel('developer');}
  function cancelDeveloperSkip(){const previous=devReturnPanel;devReturnPanel=null;if(previous)openPanel(previous,true);else closePanel();}
  function developerHTML(){return heading('developer','dev_question','dev_copy')+'<p>'+escape(localized(room.customer()?.name))+' · '+escape(missionName())+'</p><div class="panel-buttons">'+action('dev-satisfied','dev_satisfied',!canSkipCustomer())+action('dev-unhappy','dev_unhappy',!canSkipCustomer(),true)+action('dev-cancel','dev_cancel',false,true)+'</div>';}
  function toggleDeveloper(){if(training||!room.toggleDeveloper())return;if(panel==='developer'&&!room.state.developer)cancelDeveloperSkip();announce(room.state.developer?'dev_on':'dev_disabled');renderHUD();renderPanel();save();}
  function customerHTML(){
    const q=room.state.order;
    if(q.index===RoomCore.COUNT)return room.state.ending?endingHTML():chapterHTML();
    if(!room.state.present)return heading('customer','waiting_customer','waiting_copy');
    const busy=Boolean(room.job);
    const steps=room.taskIds().map((id,i)=>'<li class="'+(q.step>i+1?'done':q.step===i+1?'current':'')+'"><span>'+(q.step>i+1?'✓':num(i+1))+'</span>'+escape(localized(RoomCore.TASKS[id].label))+'</li>').join('');
    return '<div class="panel-eyebrow">'+t('mission_number',{count:q.mission+1})+' · '+t(room.state.difficulty)+'</div><h2 id="panel-title">'+escape(localized(room.customer().name))+'</h2><h3>'+escape(missionName())+'</h3>'+missionNotes()+'<ol class="order-steps">'+steps+'</ol><div class="order-reward">'+t('reward',{amount:room.mission().reward})+'</div><p>'+escape(objective())+'</p>'+progress()+'<div class="panel-buttons">'+(q.step===0?action('order-accept','accept_order',busy):q.step===room.deliveryStep()?action('order-deliver','deliver_order',busy):q.step===5?action('order-next','leave_customer',busy):action('goto-'+taskPlace(),'go_'+taskPlace()))+'</div>';
  }
  function orderStation(place){
    const q=room.state.order,task=room.task();if(!room.mission()||q.step===0||q.step===5)return '';
    if(taskPlace()!==place)return '<section class="order-work"><p>'+escape(objective())+'</p>'+action('goto-'+taskPlace(),'go_'+taskPlace())+'</section>';
    const busy=Boolean(room.job),needsCheck=room.state.difficulty==='hard'&&!q.checked;let controls='';
    if(needsCheck)controls+='<div class="reference-check"><label for="reference-input">'+t('code_prompt')+' <code>'+escape(q.code)+'</code></label><input id="reference-input" inputmode="numeric" autocomplete="off" maxlength="4" aria-label="'+t('code_label')+'">'+action('order-check','check_reference',busy)+'</div>';
    if(['refresh','photo','jam','signal','quarantine','form','files','invoice'].includes(task.kind)){controls+=miniGameHTML(task,busy||needsCheck);}
    else if(task.kind==='choice'){
      if(room.state.difficulty==='easy')controls+='<p class="task-hint">'+t('option_hint',{label:localized(task.options.find(o=>o.id===task.correct).label)})+'</p>';
      controls+=task.options.map(o=>'<button type="button" class="panel-button" data-action="order-choose:'+o.id+'" '+(busy||needsCheck?'disabled':'')+'>'+escape(localized(o.label))+'</button>').join('');
    }
    else{
      if(task.kind==='portal')controls+='<div class="portal-ticket"><b dir="ltr">'+(q.retries===0?'READY':q.retries===1?'502 BAD GATEWAY':'99% → TIMEOUT')+'</b><p>'+t('portal_attempts',{count:q.retries,total:room.level().portal})+'</p></div>';
      if(task.kind==='print')controls+='<p>'+t('paper_required',{count:task.sheets})+'</p>';
      controls+=action('order-work',task.kind==='print'?'print_order':task.kind==='portal'?'send_request':'run_task',busy||needsCheck||(task.kind==='print'&&room.state.paper<task.sheets));
      if(task.kind==='print'&&room.state.paper<task.sheets)controls+=action('goto-papers','get_paper',false,true);
    }
    return '<section class="order-work"><div class="panel-eyebrow">'+escape(localized(room.customer().name))+' / '+escape(missionName())+'</div><h3>'+escape(objective())+'</h3>'+missionNotes()+'<div class="panel-buttons">'+controls+'</div>'+(taskFeedback?'<p class="task-feedback" role="alert">'+escape(localized(taskFeedback))+'</p>':'')+(busy?'<p role="status">'+t('busy')+'</p>':'')+'</section>';
  }

  function renderPatience(){
    const s=room.state,q=s.order,visible=room.started&&s.present&&q.step<5&&!s.ending;
    $('customer-patience').hidden=!visible;
    const left=Math.max(0,60-s.wait),percent=left/60*100;
    for(const prefix of ['','panel-']){
      const fill=$(prefix+'patience-fill'),number=$(prefix+'patience-number'),bar=$(prefix+'patience-bar');
      if(fill)fill.style.width=percent+'%';
      if(number)number.textContent=text('patience_left',{seconds:Math.ceil(left)});
      if(bar){bar.setAttribute('aria-valuenow',String(Math.ceil(left)));bar.setAttribute('aria-valuetext',text('patience_left',{seconds:Math.ceil(left)}));bar.classList.toggle('angry',s.wait>=30);}
    }
    const deadline=room.mission()?.deadline;
    if($('mission-clock'))$('mission-clock').textContent=deadline?text('deadline_left',{seconds:Math.max(0,Math.ceil(deadline-q.missionElapsed))}):customerId()==='otpman'&&q.mission===0?text('gateway_left',{seconds:Math.max(0,Math.ceil(120-q.missionElapsed))}):'';
  }
  function panelPatienceHTML(){
    if(!room.state.present||room.state.order.step===5||room.state.ending)return '';
    return '<div class="panel-patience"><span>'+t('patience')+'</span><b id="panel-patience-number"></b><div id="panel-patience-bar" class="patience-track" role="progressbar" aria-label="'+t('patience')+'" aria-valuemin="0" aria-valuemax="60"><i id="panel-patience-fill"></i><span class="patience-half"></span></div></div>';
  }
  function customerReactionHTML(){const f=room.state.feedback;if(!f||!room.customer())return '';return '<aside class="customer-reaction" role="status"><img src="'+escape(data.portraits[customerId()])+'" alt=""><div><strong>'+escape(localized(room.customer().name))+'</strong><p>'+escape(localized(f.message))+'</p>'+action('dismiss-reaction','read_reaction',false,true)+'</div></aside>';}
  function missionNotes(){const m=room.mission();return m?.description?'<p class="mission-notes">'+escape(localized(m.description))+'</p><p id="mission-clock" class="mission-clock"></p>':'';}
  function miniGameHTML(task,disabled){
    const q=room.state.order,f=q.draft;
    const setting=(field,value,label,on)=>'<button type="button" class="panel-button secondary" data-action="order-set:'+field+':'+value+'" aria-pressed="'+on+'" '+(disabled?'disabled':'')+'>'+t(label)+'</button>';
    if(task.kind==='form')return '<div class="form-workbench">'+task.fields.map(field=>'<fieldset><legend>'+escape(localized(field.label))+'</legend>'+(room.state.difficulty==='easy'?'<p class="task-hint">'+t('form_hint',{label:localized(field.options.find(o=>o.value===field.correct).label)})+'</p>':'')+field.options.map(o=>'<button type="button" class="panel-button secondary" data-action="order-set:'+field.key+':'+o.value+'" aria-pressed="'+(f.fields[field.key]===o.value)+'" '+(disabled?'disabled':'')+'>'+escape(localized(o.label))+'</button>').join('')+'</fieldset>').join('')+action('order-work','form_submit',disabled)+'</div>';
    if(task.kind==='files')return '<div class="file-workbench"><p>'+t('files_selected',{count:f.selected.length})+'</p>'+(room.state.difficulty==='easy'?'<p class="task-hint">'+t('form_hint',{label:task.items.filter(i=>task.required.includes(i.id)).map(i=>localized(i.label)).join(' / ')})+'</p>':'')+'<div class="file-grid">'+task.items.map(i=>'<button type="button" class="file-entry" data-action="order-set:file:'+i.id+'" aria-pressed="'+f.selected.includes(i.id)+'" '+(disabled?'disabled':'')+'><span aria-hidden="true">▤</span><strong>'+escape(localized(i.label))+'</strong><small>'+t(f.selected.includes(i.id)?'file_ready':'file_available')+'</small></button>').join('')+'</div>'+action('order-work','files_submit',disabled)+'</div>';
    if(task.kind==='invoice')return '<div class="invoice-workbench">'+task.items.map(i=>rowText(localized(i.label),text('tomans',{amount:i.amount}))).join('')+(room.state.difficulty==='easy'?'<p class="task-hint">'+t('invoice_hint',{amount:task.items.reduce((sum,i)=>sum+i.amount,0)})+'</p>':'')+'<label for="invoice-total">'+t('invoice_total')+'</label><input id="invoice-total" type="text" inputmode="numeric" autocomplete="off" maxlength="12" value="'+escape(f.total)+'" '+(disabled?'disabled':'')+'>'+action('invoice-work','invoice_submit',disabled)+'</div>';
    if(task.kind==='refresh')return '<div class="portal-ticket"><b dir="ltr">502 BAD GATEWAY</b><p>'+t('refresh_progress',{count:q.refreshes,total:room.refreshTarget()})+'</p><div class="refresh-track"><i style="width:'+q.refreshes/room.refreshTarget()*100+'%"></i></div></div>'+action('order-refresh','refresh_button',disabled);
    if(task.kind==='photo')return '<div class="photo-workbench"><div class="photo-preview '+(f.crop==='3x4'?'portrait':'square')+' '+(f.background==='gray'?'plain':'filtered')+'" aria-hidden="true"><span>●<br>▟█▙</span></div><div><p>'+t('photo_crop')+'</p>'+setting('crop','3x4','crop_3x4',f.crop==='3x4')+setting('crop','square','crop_square',f.crop==='square')+'<p>'+t('photo_background')+'</p>'+setting('background','gray','background_gray',f.background==='gray')+setting('background','filter','background_filter',f.background==='filter')+'<p>'+t('photo_size')+'</p>'+setting('size','45','size_45',f.size===45)+setting('size','80','size_80',f.size===80)+'</div></div>'+action('order-work','export_photo',disabled);
    if(task.kind==='jam')return '<div class="jam-illustration '+(f.roller?'released':'')+'" aria-hidden="true"><span>▤</span><b>⚙</b></div>'+row('jam_status',text(f.roller?'roller_free':'roller_jammed'))+setting('roller','true','release_roller',f.roller)+action('order-work','test_roller',disabled);
    if(task.kind==='signal')return '<div class="signal-bars" aria-hidden="true">'+[1,2,3,4].map((_,i)=>'<i style="height:'+(14+i*10)+'px;opacity:'+(f.hotspot&&f.angle===45?1:f.hotspot&&f.angle===15&&i===0?1:.15)+'"></i>').join('')+'</div>'+setting('hotspot',String(!f.hotspot),f.hotspot?'hotspot_on':'hotspot_off',f.hotspot)+'<p>'+t('signal_angle')+'</p>'+[15,45,80].map(angle=>setting('angle',angle,'angle_'+angle,f.angle===angle)).join('')+action('order-work','receive_sms',disabled);
    if(task.kind==='quarantine')return '<div class="quarantine-grid">'+[0,1,2,3].map(i=>'<button type="button" class="quarantine-file" data-action="order-set:isolate:'+i+'" aria-pressed="'+f.isolated.includes(i)+'" '+(disabled?'disabled':'')+'><span>▧</span>'+t('quarantine_file',{count:i+1})+'<b>'+t(f.isolated.includes(i)?'isolated':'not_isolated')+'</b></button>').join('')+'</div>'+action('order-work','apply_quarantine',disabled);
    return '';
  }
  function upgradesHTML(){
    return heading('upgrades','upgrades_title','upgrades_copy')+row('cash',text('tomans',{amount:room.balance()}))+'<div class="upgrade-grid">'+Object.keys(RoomCore.UPGRADES).map(id=>{
      const level=room.state.upgrades[id],price=room.price(id);
      return '<article class="upgrade-card"><div class="upgrade-pixels" aria-hidden="true">'+({cpu:'▣',printer:'▤'}[id])+'</div><h3>'+t('upgrade_'+id)+'</h3><p>'+t('upgrade_'+id+'_copy')+'</p><div class="upgrade-levels" aria-hidden="true">'+[1,2,3].map(n=>'<i class="'+(n<=level?'owned':'')+'"></i>').join('')+'</div><p>'+t('upgrade_level',{level,percent:level*20})+'</p><button type="button" class="panel-button" data-action="buy-'+id+'" '+(price===null||room.balance()<price||room.job?'disabled':'')+'>'+t(price===null?'upgrade_max':'buy_upgrade',{amount:price})+'</button></article>';
    }).join('')+'</div>'+row('total_spent',text('tomans',{amount:room.state.spent}));
  }
  function endingHTML(){
    if(room.state.endingReason==='closing')return storyEndingHTML();
    const s=room.state,good=s.ending==='good';
    return '<div class="ending '+(good?'ending-good':'ending-bad')+'"><div class="ending-art" aria-hidden="true">'+(good?'☕':s.endingReason==='stress'?'⌨ ✕':'▥')+'</div>'+heading('shift_done',good?'good_ending':'bad_ending')+storyPeople(good?['amirali','maryam','rahim']:['amirali'])+'<p>'+t(good?'good_ending_copy':s.endingReason==='stress'?'game_over_copy':'bad_ending_copy')+'</p><div class="story-epilogue">'+(s.endingReason==='stress'?[]:RoomCore.STORY[good?'good':'bad']).map(p=>'<p>'+escape(localized(p))+'</p>').join('')+'</div><p>'+t('cash_scope')+'</p><div class="receipt">'+row('completed_orders',num(room.visitCount())+' / '+num(RoomCore.TOTAL))+row('missed_orders',num(room.visitCount(s.failed)))+row('inspection_risk',num(s.risk))+row('rejected_orders',num(s.mistakes))+row('income',text('tomans',{amount:s.order.earnings}))+row('total_spent',text('tomans',{amount:s.spent}))+row('cash',text('tomans',{amount:room.balance()}))+'</div><p class="ending-rule">'+t('ending_rule')+'</p>'+action('new-shift','new_shift')+'</div>';
  }

  function storyLogHTML(){
    return room.state.plot.choices.map(c=>{const chapter=RoomCore.STORY.chapters[c.day-1],o=chapter.event.options.find(o=>o.id===c.option);return '<article class="story-decision"><strong>'+t('day_number',{day:c.day})+' · '+escape(localized(o.label))+'</strong><p>'+escape(localized(o.reaction))+'</p></article>';}).join('');
  }
  function sceneKey(){return room.started&&room.day()>3?storyScript().background:'shop';}
  function renderScene(){
    const key=sceneKey(),source=data.scenes[key],outdoors=key!=='shop';
    if(sceneSource!==source){sceneSource=source;$('shop-image').src=source;document.documentElement.style.setProperty('--scene-image',`url("${source}")`);}
    $('shop-image').alt=text(outdoors?key==='market'?'market_alt':'street_alt':'room_alt');
    document.body.classList.toggle('outdoors',outdoors);$('hotspots').hidden=outdoors;$('hotspots').inert=outdoors||!room.started;
  }
  function storyPeople(ids){return '<div class="story-people">'+ids.map(id=>'<figure><img src="'+escape(data.storyPortraits[id])+'" alt="'+t('story_'+id)+'"><figcaption>'+t('story_'+id)+'</figcaption></figure>').join('')+'</div>';}
  function storyScript(){return room.state.endingReason==='closing'?data.storyScenes.endings[room.state.ending]:data.storyScenes.chapters[room.day()-1];}
  function isStoryPage(){return panel==='day'||panel==='ending'&&room.state.endingReason==='closing';}
  function storyPosition(){
    const day=room.day(),ending=room.state.endingReason==='closing'?room.state.ending:null;
    if(!storyCursor||storyCursor.day!==day||(storyCursor.ending||null)!==ending||!Number.isInteger(storyCursor.beat)||storyCursor.beat<0||storyCursor.beat>=storyScript().beats.length)storyCursor={day,ending,beat:0};
    return storyCursor.beat;
  }
  function advanceStory(replay=false){
    if(!isStoryPage())return;
    const beat=storyPosition(),last=storyScript().beats.length-1;
    if(!replay&&beat===last)return;
    storyCursor.beat=replay?0:beat+1;panelKey='';renderPanel();save();
  }
  function storyDuelHTML(script,beat){
    const last=beat===script.beats.length-1,lines=script.beats[beat],dir=language==='fa'?'rtl':'ltr';
    const portrait=id=>'<figure><img src="'+escape(data.storyPortraits[id])+'" alt="'+t('story_'+id)+'" draggable="false"><figcaption>'+t('story_'+id)+'</figcaption></figure>';
    const bubble=(id,side)=>'<button type="button" id="story-'+side+'-bubble" class="story-bubble" dir="'+dir+'" data-action="story-next" aria-describedby="story-progress" '+(last?'disabled':'')+'><strong>'+t('story_'+id)+'</strong><span class="story-bubble-text" aria-live="polite" aria-atomic="true">'+escape(localized(lines[side]))+'</span><small>'+t(last?'story_last_bubble':'story_bubble_hint')+'</small></button>';
    return '<div class="story-duel" dir="ltr" aria-label="'+t('story_page')+'"><div class="story-actor opponent" data-character="'+script.opponent+'">'+portrait(script.opponent)+bubble(script.opponent,'left')+'</div><div class="story-actor hero" data-character="amirali">'+bubble('amirali','right')+portrait('amirali')+'</div></div>';
  }
  function storyPageHTML(title,records,choices,note=''){
    const script=storyScript(),beat=storyPosition(),key=script.background,last=beat===script.beats.length-1,ending=room.state.endingReason==='closing'?room.state.ending:'';
    return '<section id="story-page" class="story-page '+(ending?'story-ending ending-'+ending:'')+'"><img class="story-background" src="'+escape(data.scenes[key])+'" alt="'+t(key==='market'?'market_alt':key==='street'?'street_alt':'room_alt')+'"><header class="story-heading"><div><span class="story-eyebrow">'+t('day_number',{day:room.day()})+' · '+t('story_page')+'</span><h2 id="panel-title">'+escape(title)+'</h2><p>'+t('story_frozen')+'</p></div><nav class="story-navigation"><button type="button" class="quiet-button" data-action="story-language">'+(language==='fa'?'English':'فارسی')+'</button>'+action('menu','story_back_menu',false,true)+'</nav></header>'+storyDuelHTML(script,beat)+'<footer class="story-controls"><div class="story-reading"><span id="story-progress" role="status">'+t('story_beat',{count:beat+1,total:script.beats.length})+'</span>'+action(last?'story-replay':'story-next',last?'story_replay':'story_next',false,true)+'</div>'+note+'<div class="story-decisions">'+choices+'</div><details class="story-records"><summary>'+t('story_records')+'</summary>'+records+'</details></footer></section>';
  }
  function storyEndingHTML(){
    const s=room.state,good=s.ending==='good';
    const records='<div class="story-epilogue">'+RoomCore.STORY[good?'good':'bad'].map(p=>'<p>'+escape(localized(p))+'</p>').join('')+'</div><p>'+t('cash_scope')+'</p><div class="receipt">'+row('completed_orders',num(room.visitCount())+' / '+num(RoomCore.TOTAL))+row('missed_orders',num(room.visitCount(s.failed)))+row('inspection_risk',num(s.risk))+row('rejected_orders',num(s.mistakes))+row('income',text('tomans',{amount:s.order.earnings}))+row('total_spent',text('tomans',{amount:s.spent}))+row('cash',text('tomans',{amount:room.balance()}))+'</div><p>'+t('ending_rule')+'</p>';
    const message=(good?'':'<div class="story-seized" role="status">'+t('seizure_message')+'</div>')+'<p class="story-ending-copy">'+t(good?'good_ending_copy':'bad_ending_copy')+'</p>';
    return storyPageHTML(text(good?'good_ending':'bad_ending'),records,message+action('new-shift','new_shift'));
  }
  function chapterHTML(){
    const day=room.day(),chapter=RoomCore.STORY.chapters[day-1],previous=RoomCore.STORY.chapters[day-2],s=room.state;
    const last=s.plot.choices.at(-1),lastOption=last&&RoomCore.STORY.chapters[last.day-1].event.options.find(o=>o.id===last.option);
    const night=day>3;
    const intro=day===1?'<p class="story-prologue">'+escape(localized(RoomCore.STORY.premise))+'</p>':'';
    const note=lastOption?'<aside class="night-note"><strong>'+t('story_consequence')+'</strong><p>'+escape(localized(lastOption.reaction))+'</p></aside>':previous?'<aside class="night-note"><strong>'+t('last_night')+'</strong><p>'+escape(localized(previous.closing))+'</p></aside>':'';
    const choices=night?'<section class="plot-choice"><h3>'+t('story_choice')+'</h3><p>'+escape(localized(chapter.event.prompt))+'</p><div class="plot-options">'+chapter.event.options.map(o=>'<button type="button" class="panel-button" data-action="plot-'+o.id+'">'+escape(localized(o.label))+'</button>').join('')+'</div></section>'+action('goto-planner','planner',false,true):'<p>'+t('day_break_copy')+'</p><div class="panel-buttons">'+action('begin-day','day_start')+action('goto-planner','planner',false,true)+'</div>';
    const records=intro+'<p class="chapter-opening">'+escape(localized(chapter.opening))+'</p><div class="chapter-obstacle"><strong>'+t('day_obstacle')+'</strong><p>'+escape(localized(chapter.obstacle))+'</p></div><div class="receipt">'+row('completed_orders',num(room.visitCount())+' / '+num(RoomCore.TOTAL))+row('missed_orders',num(room.visitCount(s.failed)))+row('cash',text('tomans',{amount:room.balance()}))+'</div>';
    return storyPageHTML(localized(chapter.title),records,choices,note);
  }
  function plannerHTML(){
    const q=room.state.order,s=room.state,groups=['neighbours','gaming','education','urgent','sensitive'];
    const cards=groups.map(group=>'<section class="customer-category"><h3>'+t('category_'+group)+'</h3>'+RoomCore.CUSTOMERS.filter(c=>c.group===group).map(c=>'<article class="dossier"><div class="dossier-person"><img src="'+escape(data.portraits[c.id])+'" alt=""><strong>'+escape(localized(c.name))+'</strong><small class="roster-label">'+t(s.roster.includes(RoomCore.CUSTOMERS.indexOf(c))?'roster_active':'roster_other')+'</small></div><ol>'+c.missions.map((m,i)=>{const key=c.id+':'+i,status=q.completed.includes(key)?'done':s.failed.includes(key)?'failed':s.present&&room.customer()?.id===c.id&&q.mission===i?'current':'pending';return '<li class="mission-'+status+'"><span>'+t('day_number',{day:i+1})+'</span><div><strong>'+escape(localized(m.title))+'</strong><small>'+t('mission_'+status)+' · '+t('reward',{amount:m.reward})+'</small></div></li>';}).join('')+'</ol></article>').join('')+'</section>').join('');
    return heading('planner','daily_missions','records_notice')+'<p>'+t('day_rules')+'</p>'+cards+'<section class="story-journal"><h3>'+t('campaign_premise')+'</h3><p>'+escape(localized(RoomCore.STORY.premise))+'</p>'+RoomCore.STORY.chapters.slice(0,room.day()).map(c=>'<h3>'+escape(localized(c.title))+'</h3><p>'+escape(localized(c.opening))+'</p>').join('')+storyLogHTML()+'</section>'+(s.dayBreak?action('goto-day','return_day_report'):'');
  }
  function copyHTML(){
    const tr=room.state.plot.transfer,done=tr.days.includes(room.day());
    if(room.day()>3)return '';
    return '<section class="shadow-copy '+(tr.alarm>0?'copy-warning':'')+'"><h3>'+t('copy_title')+'</h3><p>'+t('copy_intro')+'</p>'+(tr.active?'<div class="copy-screen '+(tr.covered?'covered':'')+'"><b>'+t(tr.covered?'copy_vehicle':'copy_running')+'</b><p id="copy-status" role="status"></p><div class="progress-track" id="copy-meter" role="progressbar" aria-label="'+t('copy_title')+'" aria-valuemin="0" aria-valuemax="100"><i id="copy-fill"></i></div></div>'+action('copy-toggle',tr.covered?'copy_resume':'copy_cover'):done?'<p>'+t('copy_daily_done')+'</p>':action('copy-start','copy_start',Boolean(room.job)))+'</section>';
  }
  function coverCopy(){if(room.toggleCover()){renderPanel();renderHUD();save();}}
  function monitorHTML(){
    const s=room.state,active=room.mission()&&s.order.step>0&&s.order.step<5&&taskPlace()==='monitor',matches=active&&taskApp()===computerTab,icons={browser:'▣',files:'▤',photo:'▧',scanner:'▱',accounts:'▦',planner:'▥'};
    let html=heading('monitor_eyebrow','monitor_title','monitor_copy');
    html+='<div class="desktop-shell"><div class="desktop-status">'+t('desktop_status')+'</div><nav class="desktop-apps" aria-label="'+t('monitor')+'">'+RoomCore.APPS.map(app=>'<button type="button" data-action="tab-'+app+'" class="desktop-app '+(app===computerTab?'selected':'')+'" aria-pressed="'+(app===computerTab)+'"><b aria-hidden="true">'+icons[app]+'</b><span>'+t('app_'+app)+'</span></button>').join('')+'</nav><div class="desktop-title"><strong>'+t('app_'+computerTab)+'</strong><span>'+escape(room.customer()?localized(room.customer().name):text('ready'))+'</span></div>';
    if(active&&!matches)html+='<aside class="app-route"><p>'+t('app_needed',{app:text('app_'+taskApp())})+'</p><button type="button" class="panel-button" data-action="tab-'+taskApp()+'">'+t('open_required_app',{app:text('app_'+taskApp())})+'</button></aside>';
    html+=matches?orderStation('monitor'):'<p class="desktop-idle">'+t(computerTab+'_idle')+'</p>';
    if(computerTab==='browser')html+='<div class="browser-window"><div class="browser-address"><span>services.local / '+escape(matches?room.taskId():'home')+'</span><span>LOCAL</span></div><div class="browser-status"><span>'+t(s.server==='online'?'browser_online':'browser_error')+'</span><span>'+t('request_attempt',{count:s.attempts})+'</span></div></div>';
    if(computerTab==='files')html+=copyHTML()+'<div class="device-table">'+row('usb_label',text(s.usbScanned?'usb_ok':'usb_unknown'))+row('usb_capacity','16 GB')+'</div>';
    if(computerTab==='photo'&&!matches)html+='<div class="photo-placeholder" aria-hidden="true">▧<span>3 × 4 / JPG</span></div>';
    if(computerTab==='scanner'&&!matches)html+='<div class="scanner-placeholder" aria-hidden="true"><span>▤</span><i></i></div>';
    if(computerTab==='accounts')html+='<div class="device-table">'+row('income',text('tomans',{amount:s.order.earnings}))+row('total_spent',text('tomans',{amount:s.spent}))+row('cash',text('tomans',{amount:room.balance()}))+'</div>';
    if(!active&&computerTab==='browser')html+=progress()+action('retry',room.job?.kind==='retry'?'busy':'retry',Boolean(room.job));
    if(!active&&computerTab==='files')html+=progress()+action('scan',room.job?.kind==='scan'?'busy':'scan',Boolean(room.job));
    return html+'</div><p class="local-notice">'+t('local_notice')+'</p>';
  }
  function printerHTML(){const s=room.state;return heading('printer_eyebrow','printer_title','printer_copy')+`<div class="device-table">${row('printer_status',text(room.job?.kind==='print'?'busy':'ready'))}${row('paper_remaining',num(s.paper))}${row('pages_printed',num(s.prints))}</div>${progress()}${s.paper? action('print',room.job?.kind==='print'?'busy':'print_test',Boolean(room.job)):`<p>${t('paper_empty')}</p>`}`;}
  function shelfHTML(){const s=room.state;return heading('shelf_eyebrow','shelf_title','shelf_copy')+'<p>'+t('bench_instruction')+'</p><div class="console-bench console-cards"><img src="'+escape(data.scenes.consoles)+'" alt="'+t('bench_alt')+'">'+['PS3','PS4'].map(model=>'<button class="console-hit console-'+model.toLowerCase()+(model===s.consoleModel?' selected':'')+'" type="button" data-action="console-pick:'+model+'" aria-label="'+model+'" aria-pressed="'+(model===s.consoleModel)+'" '+(room.job?'disabled':'')+'><span>'+model+'</span></button>').join('')+'</div><span class="status-tag">'+escape(s.consoleModel)+' · '+t(s.consoleChecked?'console_checked':'console_pending')+'</span>'+progress()+'<div>'+action('console',room.job?.kind==='console'?'busy':'console_test',Boolean(room.job))+'</div>';}
  function pickConsole(model){
    if(!room.ready()||room.job||!['PS3','PS4'].includes(model))return;
    room.model(model);
    const task=room.task();
    if(task?.place==='shelf'&&task.kind==='choice'){
      const option=task.options.find(o=>localized(o.label).split(' / ')[0]===model);
      if(option)performOrder('choose:'+option.id);
    }
    renderPanel();renderHUD();save();
  }
  function papersHTML(){return heading('papers_eyebrow','papers_title','papers_copy')+`<div class="memo"><h3>${t('memo_title')}</h3><ul>${[1,2,3,4].map(i=>`<li>${t('memo_'+i)}</li>`).join('')}</ul></div>${action('refill','refill',room.state.paper>=99)}`;}
  function toolsHTML(){
    const s=room.state,d=s.devices,busy=Boolean(room.job);
    const cards=[
      ['tea','tea_copy','drink_tea',s.teaCooldown>0],
      ['clean','clean_copy','clean_printer',busy||d.cleanCooldown>0],['radio','radio_copy',d.radio?'turn_off':'turn_on',false],['breath','breath_copy','take_breath',busy||d.breathCooldown>0]
    ];
    return heading('tools','tools_title','tools_copy')+action('goto-upgrades','upgrades')+progress()+'<div class="utility-grid">'+cards.map(([id,copy,label,disabled])=>'<div class="utility-card"><h3>'+t(id)+'</h3><p>'+t(copy)+'</p>'+action('utility-'+id,label,disabled)+(((id==='tea'?s.teaCooldown:d[id+'Cooldown'])||0)>0?'<p>'+t('cooldown_seconds',{seconds:Math.ceil(id==='tea'?s.teaCooldown:d[id+'Cooldown'])})+'</p>':'')+'</div>').join('')+'</div>';
  }
  function practiceRoom(){const r=new RoomCore.Room();r.makeSchedule(0);r.setDifficulty('normal');r.start();r.startDay();r.slip=()=>false;return r;}
  function beginTraining(){if(room.started)return;training={step:0,room:practiceRoom(),notice:'',done:false,waitStage:0,apps:[],app:'browser'};openPanel('tutorial');}
  function advanceTraining(){training.step++;training.done=false;training.notice='';if(training.step===7)training.room.state.stress=60;if(training.step===8){training.room=practiceRoom();training.room.state.order.earnings=30000;}renderPanel();}
  function trainingHTML(){
    if(!training)return '';
    const n=training.step,r=training.room,q=r.state.order;
    let controls='',content='';
    if(n===0)controls=action('tutorial-next','tutorial_begin');
    if(n===1){content='<div class="training-customer"><img src="'+escape(data.portraits.man)+'" alt="'+escape(localized(RoomCore.CUSTOMERS[0].name))+'"><button class="training-bubble" data-action="tutorial-talk" type="button">'+escape(r.mission().lines[language][q.line])+'<small>'+num(q.line+1)+' / '+num(3)+'</small></button></div>';controls=action('tutorial-next','tutorial_next',q.line<2);}
    if(n===2)controls=action('tutorial-accept','accept_order');
    if(n===3||n===4){const task=r.task();content='<div class="training-station"><b>'+t(n===3?'papers':'printer')+'</b><p>'+escape(localized(task.label))+'</p></div>';controls=task.options.map(o=>'<button class="panel-button" data-action="tutorial-choice:'+o.id+'" type="button">'+escape(localized(o.label))+'</button>').join('');}
    if(n===5){content='<div class="progress-track" id="training-meter" role="progressbar" aria-label="'+t('tutorial_print')+'" aria-valuemin="0" aria-valuemax="100"><i id="training-progress"></i></div>'+row('paper_remaining',num(r.state.paper));controls=action('tutorial-print',r.job?'busy':'tutorial_print',Boolean(r.job));}
    if(n===6){content=row('cash',text('tomans',{amount:r.balance()}));controls=action(training.done?'tutorial-next':'tutorial-deliver',training.done?'tutorial_next':'deliver_order');}
    if(n===7){content='<div class="training-stress"><span>'+t('stress')+'</span><b>'+num(r.state.stress)+'%</b><div class="stress-track"><i style="width:'+r.state.stress+'%"></i><span class="stress-threshold"></span></div></div>';controls=training.done?action('tutorial-next','tutorial_next'):'<button class="training-tea" data-action="tutorial-tea" type="button" aria-label="'+t('drink_tea')+'">☕ <span>'+t('drink_tea')+'</span></button>';}
    if(n===8){const left=60-r.state.wait;content='<div class="training-patience"><b>'+t('patience_left',{seconds:left})+'</b><div class="patience-track"><i style="width:'+left/60*100+'%"></i><span class="patience-half"></span></div><p>'+escape(r.state.feedback?localized(r.state.feedback.message):text('patience_rule'))+'</p>'+row('stress',num(r.state.stress)+'%')+'</div>';controls=training.waitStage<2?action(training.waitStage?'tutorial-wait60':'tutorial-wait30',training.waitStage?'tutorial_wait60':'tutorial_wait30'):action('tutorial-next','tutorial_next');}
    if(n===9){content=row('cash',text('tomans',{amount:r.balance()}))+row('upgrade_cpu',text('upgrade_level',{level:r.state.upgrades.cpu,percent:r.state.upgrades.cpu*20}));controls=training.done?action('tutorial-next','tutorial_next'):'<button class="panel-button" data-action="tutorial-upgrade" type="button">'+t('buy_upgrade',{amount:30000})+'</button>';}
    if(n===10){content='<nav class="training-apps">'+RoomCore.APPS.map(app=>'<button class="panel-button secondary" data-action="tutorial-app:'+app+'" type="button" aria-pressed="'+(app===training.app)+'">'+(training.apps.includes(app)?'✓ ':'')+t('app_'+app)+'</button>').join('')+'</nav><div class="training-app-detail"><h3>'+t('app_'+training.app)+'</h3><p>'+t('tutorial_app_'+training.app)+'</p></div>';controls='<p>'+t('tutorial_apps_hint')+'</p>'+action('tutorial-next','tutorial_next',training.apps.length<6);}
    if(n===11){content='<p>'+t('ending_rule')+'</p><p>'+t('dev_hint')+'</p>';controls=action('tutorial-exit','tutorial_finish')+action('tutorial-restart','tutorial_again',false,true);}
    return '<section class="tutorial-course"><button class="quiet-button training-language" data-action="tutorial-language" type="button">'+(language==='fa'?'English':'فارسی')+'</button><div class="panel-eyebrow">'+t('tutorial_step',{step:n+1,total:12})+'</div><div class="tutorial-track" role="progressbar" aria-label="'+t('tutorial')+'" aria-valuemin="0" aria-valuemax="12" aria-valuenow="'+(n+1)+'"><i style="width:'+(n+1)/12*100+'%"></i></div><h2 id="panel-title">'+t('tutorial_'+n+'_title')+'</h2><p>'+t('tutorial_'+n+'_copy')+'</p><small class="practice-notice">'+t('tutorial_safe')+'</small>'+content+(training.notice?'<p class="training-feedback" role="status">'+t(training.notice)+'</p>':'')+'<div class="panel-buttons">'+controls+'</div>'+(n<11?'<div class="training-exit">'+action('tutorial-exit','tutorial_exit',false,true)+'</div>':'')+'</section>';
  }
  function trainingAction(id){
    if(!training)return;const n=training.step,r=training.room;
    if(id==='exit'){closePanel();$('open-tutorial').focus();return;}
    if(id==='restart'){beginTraining();return;}
    if(id==='language'){language=language==='fa'?'en':'fa';translate();save();return;}
    if(id==='talk'&&n===1){r.dialogueNext();renderPanel();return;}
    if(id==='next'&&([0,1,6,7,8,9,10].includes(n))){if([6,7,9].includes(n)&&!training.done||n===1&&r.state.order.line<2||n===8&&training.waitStage<2||n===10&&training.apps.length<6)return;advanceTraining();return;}
    if(id==='accept'&&n===2){r.orderAction('accept');advanceTraining();return;}
    if(id.startsWith('choice:')&&[3,4].includes(n)){const value=id.slice(7);if(value===r.task().correct){r.orderAction('choose:'+value);advanceTraining();}else{training.notice='tutorial_wrong';renderPanel();}return;}
    if(id==='print'&&n===5&&!r.job){r.orderAction('work');renderPanel();return;}
    if(id==='deliver'&&n===6){if(!training.done&&r.orderAction('deliver')==='mission_delivered'){training.done=true;training.notice='tutorial_correct';renderPanel();}return;}
    if(id==='tea'&&n===7&&!training.done){r.tea();training.done=true;training.notice='tutorial_correct';renderPanel();return;}
    if((id==='wait30'&&n===8&&training.waitStage===0)||(id==='wait60'&&n===8&&training.waitStage===1)){r.tick(30);training.waitStage++;renderPanel();return;}
    if(id==='upgrade'&&n===9){if(!training.done&&r.purchase('cpu')==='upgrade_bought'){training.done=true;training.notice='upgrade_bought';renderPanel();}return;}
    if(id.startsWith('app:')&&n===10&&RoomCore.APPS.includes(id.slice(4))){training.app=id.slice(4);if(!training.apps.includes(training.app))training.apps.push(training.app);renderPanel();}
  }
  function gameoverHTML(){return heading('stress','game_over')+'<div class="keyboard-break" aria-hidden="true">⌨ ✕</div><p class="gameover-copy">'+t('game_over_copy')+'</p>'+row('income',text('tomans',{amount:room.state.order.earnings}))+row('slips_total',num(room.state.slips))+action('new-shift','new_shift');}
  function guideHTML(){return heading('guide_eyebrow','guide_title')+[1,2,3,4].map(i=>`<div class="guide-item"><h3>${t('guide_'+i+'_title')}</h3><p>${t('guide_'+i)}</p></div>`).join('');}
  function renderPanel(){
    if(!panel)return;
    if(isStoryPage())storyPosition();
    const key=JSON.stringify([panel,language,computerTab,room.state,room.job?.kind,training,storyCursor]);if(key===panelKey)return;
    const invoiceValue=$('invoice-total')?.value,referenceValue=$('reference-input')?.value,referenceVisit=customerId()+':'+room.state.order.mission+':'+room.state.order.step;
    const focus=document.activeElement;const focusAction=focus?.dataset?.action;const hadFocus=$('panel-content').contains(focus);
    panelKey=key;
    $('panel').dataset.view=panel;
    $('panel').classList.toggle('story-screen',isStoryPage());document.body.classList.toggle('story-page-active',isStoryPage());
    $('close-panel').disabled=isStoryPage();
    $('panel-caption').textContent=text(panel==='pause'?'pause':panel==='guide'?'guide':panel);
    $('panel-content').innerHTML=(['pause','guide','upgrades','ending','gameover','day','planner','tutorial','developer'].includes(panel)?'':panelPatienceHTML()+customerReactionHTML())+(panel==='tutorial'?trainingHTML():panel==='developer'?developerHTML():panel==='day'?chapterHTML():panel==='planner'?plannerHTML():panel==='ending'||panel==='gameover'?endingHTML():panel==='upgrades'?upgradesHTML():panel==='tools'?toolsHTML():panel==='customer'?customerHTML():panel==='monitor'?monitorHTML():panel==='printer'?orderStation('printer')+printerHTML():panel==='shelf'?shelfHTML()+orderStation('shelf'):panel==='papers'?orderStation('papers')+papersHTML():panel==='guide'?guideHTML():heading('pause_eyebrow','pause_title','pause_copy')+`<div class="panel-buttons">${action('resume','resume')}${action('menu','back_menu',false,true)}</div>`);
    if(canSkipCustomer()&&!['tutorial','developer','ending','gameover'].includes(panel))$('panel-content').innerHTML='<div class="dev-panel-controls">'+action('dev-ask','dev_skip',false,true)+'</div>'+$('panel-content').innerHTML;
    if(referenceValue!==undefined&&$('reference-input')&&referenceVisit===customerId()+':'+room.state.order.mission+':'+room.state.order.step&&focus?.id==='reference-input')$('reference-input').value=referenceValue;
    if(invoiceValue!==undefined&&$('invoice-total')&&referenceVisit===customerId()+':'+room.state.order.mission+':'+room.state.order.step&&focus?.id==='invoice-total')$('invoice-total').value=invoiceValue;
    if(hadFocus&&focus?.id==='invoice-total'&&$('invoice-total'))$('invoice-total').focus({preventScroll:true});
    if(hadFocus&&focus?.id==='reference-input'&&$('reference-input'))$('reference-input').focus({preventScroll:true});
    if(hadFocus&&focusAction){const next=$('panel-content').querySelector(`[data-action="${focusAction}"]:not(:disabled)`);if(next)next.focus({preventScroll:true});}
    renderHUD();
  }
  function openPanel(which,restoring=false){
    if(!room.started&&which!=='tutorial')return;
    if(which==='planner'&&panel!=='planner'&&!restoring)plannerReturn=room.state.dayBreak?'day':panel;
    else if(panel==='planner'&&which!=='developer')plannerReturn=null;
    panel=which;panelKey='';room.paused=['pause','guide','upgrades','day','planner','developer','tutorial'].includes(which);updateAudio();
    renderPanel();if(!$('panel').open)$('panel').showModal();
    const focus=isStoryPage()?$('panel-title'):$('close-panel');if(isStoryPage())focus.tabIndex=-1;focus.focus({preventScroll:true});
  }
  function closePanel(force=false){
    if(!force&&panel==='planner'){const previous=plannerReturn;plannerReturn=null;if(previous){openPanel(previous);save();return;}}
    if(!force&&room.started&&room.state.dayBreak&&!room.state.ending&&panel!=='day'){openPanel('day');save();return;}
    plannerReturn=null;
    const previous=panel;if(previous==='tutorial')training=null;panel=null;panelKey='';$('panel').close();
    $('panel').classList.remove('story-screen');document.body.classList.remove('story-page-active');
    if(['pause','guide','upgrades','day','planner','developer','tutorial'].includes(previous)){room.paused=false;updateAudio();}
    renderHUD();save();
  }
  function visit(place){
    if(!room.ready())return;room.visit(place);beep();
    if(place==='tea'){
      if(room.tea()){say('tea_drink');beep('tea');}else say('tea_wait',{seconds:Math.ceil(room.state.teaCooldown)});
      renderHUD();save();return;
    }
    openPanel(place);save();
  }
  function beginGame(){
    if(!room.start()){renderDifficulty();return;}startAudio();$('intro').hidden=true;$('shop-identity').hidden=false;$('pause').hidden=false;$('hud').hidden=false;
    $('hotspots').inert=false;showHints=false;document.body.classList.remove('show-hints');
    $('world').tabIndex=-1;$('world').focus({preventScroll:true});say('welcome');translate();save();if(room.state.ending)openPanel('ending');else if(room.state.dayBreak)openPanel('day');
  }
  function backMenu(){
    closePanel(true);room.started=false;room.paused=false;updateAudio();
    eventTime=0;$('game-event').hidden=true;
    $('intro').hidden=false;$('shop-identity').hidden=true;$('pause').hidden=true;$('hud').hidden=true;$('speech').hidden=true;$('hotspots').inert=true;
    document.body.classList.remove('show-hints');$('start').focus();save();
    renderScene();renderCustomer();renderDifficulty();
  }
  $('open-tutorial').addEventListener('click',beginTraining);
  $('dev-skip').addEventListener('click',askDeveloperSkip);
  $('start').addEventListener('click',beginGame);
  document.querySelectorAll('[data-difficulty]').forEach(el=>el.addEventListener('click',()=>{room.setDifficulty(el.dataset.difficulty);renderDifficulty();save();}));
  function newShift(){training=null;devReturnPanel=null;storyCursor=null;closePanel(true);room=new RoomCore.Room();customerRenderKey='';taskFeedback=null;backMenu();translate();save();}
  $('restart-shift').addEventListener('click',newShift);
  $('accept-order').addEventListener('click',()=>performOrder('accept'));
  $('deliver-order').addEventListener('click',()=>performOrder('deliver'));
  $('leave-customer').addEventListener('click',()=>performOrder('next'));
  $('day-board').addEventListener('click',()=>openPanel(room.state.dayBreak?'day':'planner'));
  $('open-tools').addEventListener('click',()=>openPanel('tools'));
  $('open-upgrades').addEventListener('click',()=>openPanel('upgrades'));
  function useUtility(id){if(id==='tea'){visit('tea');renderPanel();return;}const result=room.utility(id);if(result){say(result);announce(result);beep();}renderPanel();renderHUD();save();}
  $('copy-cover').addEventListener('click',coverCopy);
  $('take-breath').addEventListener('click',()=>useUtility('breath'));
  $('customer-sprite').addEventListener('click',advanceDialogue);
  $('scene-dialogue').addEventListener('click',advanceDialogue);
  $('order-tracker').addEventListener('click',()=>openPanel('customer'));
  document.querySelectorAll('[data-place]').forEach(element=>element.addEventListener('click',()=>visit(element.dataset.place)));
  $('language').addEventListener('click',()=>{language=language==='fa'?'en':'fa';translate();save();});
  $('audio').addEventListener('click',()=>{sound=!sound;if(sound)startAudio();updateAudio();translate();save();});
  $('motion').addEventListener('click',()=>{motion=!motion;translate();save();});
  $('pause').addEventListener('click',()=>openPanel('pause'));
  $('guide').addEventListener('click',()=>openPanel('guide'));
  function toggleHints(){showHints=!showHints;document.body.classList.toggle('show-hints',showHints);$('show-hints').setAttribute('aria-pressed',String(showHints));}
  $('show-hints').addEventListener('click',toggleHints);
  $('close-panel').addEventListener('click',()=>{if(panel==='developer')cancelDeveloperSkip();else if(!isStoryPage())closePanel();});
  $('panel').addEventListener('cancel',event=>{event.preventDefault();if(panel==='developer')cancelDeveloperSkip();else if(!isStoryPage())closePanel();});
  $('panel').addEventListener('click',event=>{if(event.target===$('panel')&&!isStoryPage()){const r=$('panel').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom){if(panel==='developer')cancelDeveloperSkip();else closePanel();}}});
  $('panel-content').addEventListener('input',event=>{if(event.target.id==='invoice-total'){const value=digits(event.target.value).replace(/\D/g,'');room.orderAction('set:total:'+value);save();}});
  $('panel-content').addEventListener('click',event=>{
    const control=event.target.closest('button');if(!control||control.disabled)return;
    if(control.dataset.model){pickConsole(control.dataset.model);return;}
    const action=control.dataset.action;
    if(action==='story-next'||action==='story-replay'){advanceStory(action==='story-replay');return;}
    if(action==='story-language'){language=language==='fa'?'en':'fa';translate();save();return;}
    if(action?.startsWith('console-pick:')){pickConsole(action.slice(13));return;}
    if(action?.startsWith('tutorial-')){trainingAction(action.slice(9));return;}
    if(action==='dev-ask'){askDeveloperSkip();return;}
    if(action==='dev-cancel'){cancelDeveloperSkip();return;}
    if(action==='dev-satisfied'||action==='dev-unhappy'){const result=room.developerSkip(action==='dev-satisfied');if(result){devReturnPanel=null;closePanel();announce(result);renderHUD();save();}return;}
    if(action?.startsWith('plot-')){if(room.chooseStory(action.slice(5))){renderHUD();save();openPanel(room.state.ending?'ending':'day');}return;}
    if(action==='copy-start'){if(room.beginCopy()){renderPanel();renderHUD();save();}return;}
    if(action==='copy-toggle'){coverCopy();return;}
    if(action==='begin-day'){closePanel(true);if(room.startDay()){renderHUD();save();say('welcome');}return;}
    if(action==='invoice-work'){const value=digits($('invoice-total')?.value||'').replace(/\D/g,'');room.orderAction('set:total:'+value);performOrder('work');return;}
    if(action==='new-shift'){newShift();return;}
    if(action==='dismiss-reaction'){room.dialogueNext();renderPanel();renderHUD();save();return;}
    if(action?.startsWith('buy-')){const result=room.purchase(action.slice(4));if(result)announce(result);renderPanel();renderHUD();save();return;}
    if(action?.startsWith('utility-')){useUtility(action.slice(8));return;}
    if(action?.startsWith('goto-')){openPanel(action.slice(5));return;}
    if(action==='order-check'){const digits=($('reference-input')?.value||'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632));performOrder('check:'+digits);return;}
    if(action?.startsWith('order-')){performOrder(action.slice(6));return;}
    if(action?.startsWith('tab-')&&RoomCore.APPS.includes(action.slice(4))){const app=action.slice(4);if(app==='planner'){openPanel('planner');return;}computerTab=app;renderPanel();return;}
    if(['retry','print','scan','console'].includes(action)){
      if(room.begin(action)){beep(action==='print'?'print':'click');if(action==='print')$('printer-paper').classList.add('printing');}
      renderPanel();save();return;
    }
    if(action==='refill'){room.refill();say('refill_done');renderPanel();renderHUD();save();}
    if(action==='resume')closePanel();
    if(action==='menu')backMenu();
  });
  $('fullscreen').addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
    catch(_){say('fullscreen_failed');}
  });
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=text(document.fullscreenElement?'exit_fullscreen':'fullscreen');});
  document.addEventListener('keydown',event=>{
    const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||['invoice-total','reference-input'].includes(document.activeElement?.id);
    if(!event.repeat&&!event.ctrlKey&&!event.metaKey&&!typing&&room.ready()&&room.state.plot.transfer.active&&((event.code==='KeyC'&&!event.altKey)||(event.code==='Tab'&&event.altKey))){event.preventDefault();coverCopy();return;}
    if(event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
    if(room.started&&!typing&&(event.code==='KeyN'||event.key==='د'||event.key?.toLowerCase()==='n')){event.preventDefault();toggleDeveloper();return;}
    if(!room.started){if(event.key==='Enter'&&document.activeElement===document.body){event.preventDefault();beginGame();}return;}
    if(event.code==='F5'&&room.ready()&&room.task()?.kind==='refresh'&&(!panel||panel==='monitor')){event.preventDefault();performOrder('refresh');return;}
    if($('panel').open)return;
    if(event.key==='Escape'){event.preventDefault();openPanel('pause');return;}
    if(event.code==='KeyH'){event.preventDefault();toggleHints();return;}
    const index=['Digit1','Digit2','Digit3','Digit4'].indexOf(event.code);
    if(index>=0){event.preventDefault();visit(RoomCore.PLACES[index]);}
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&room.started&&!room.paused){if(panel)closePanel();openPanel('pause');save();}
    updateAudio();lastTime=performance.now();
  });
  window.addEventListener('pagehide',save);
  function frame(now){
    const dt=Math.min(.25,Math.max(0,(now-lastTime)/1000));lastTime=now;
    if(training?.room.job&&panel==='tutorial'&&!document.hidden){training.room.tick(dt);const j=training.room.job;if($('training-progress'))$('training-progress').style.width=(j?j.elapsed/j.duration*100:100)+'%';if($('training-meter'))$('training-meter').setAttribute('aria-valuenow',String(j?Math.floor(j.elapsed/j.duration*100):100));if(!j)advanceTraining();}
    const result=room.tick(dt);if(result){$('printer-paper').classList.remove('printing');say(result);announce(result);beep(result==='server_error'||result.startsWith('slip_')?'error':'click');renderPanel();renderHUD();save();if(room.state.ending)openPanel('ending');else if(room.state.dayBreak)openPanel('day');}
    if(room.started&&!room.paused&&speechTime>0){speechTime-=dt;if(speechTime<=0)$('speech').hidden=true;}
    elapsed+=dt;if(elapsed>.1){elapsed=0;renderHUD();}
    if(room.ready()&&eventTime>0){eventTime-=dt;if(eventTime<=0)$('game-event').hidden=true;}
    if(room.ready()){autosaveTime+=dt;if(autosaveTime>=5){autosaveTime=0;save();}}
    if(panel==='tools'&&room.ready()){toolsTime+=dt;if(toolsTime>=1){toolsTime=0;renderPanel();}}
    if(room.ready()&&room.state.devices.radio&&sound){radioClock+=dt;if(radioClock>=.8){radioClock=0;playRadioNote();}}
    requestAnimationFrame(frame);
  }
  document.documentElement.style.setProperty('--scene-image',`url("${$('shop-image').src}")`);
  translate();$('save-warning').hidden=storageOK;requestAnimationFrame(frame);
})();
