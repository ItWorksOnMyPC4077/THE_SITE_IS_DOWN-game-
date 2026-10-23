/* Offline shop simulation: no real portal, payment, USB or file access. */
var RoomCore=(()=>{
  const catalog=typeof MISSION_DATA!=='undefined'?MISSION_DATA:require('./missions.json');
  const CUSTOMERS=catalog.customers,TASKS=catalog.tasks,COUNT=CUSTOMERS.length,DAYS=3,STORY_DAYS=10,DAILY_COUNT=5,TOTAL=DAILY_COUNT*DAYS,STORY=catalog.story;
  const LEGACY_COUNT=11;
  const APPS=['browser','files','photo','scanner','accounts','planner'];
  const LEVELS={
    easy:{duration:.7,portal:1,pressure:.025,workPressure:.09,penalty:2,tea:18,patience:60,slip:.55},
    normal:{duration:1,portal:3,pressure:.055,workPressure:.18,penalty:4,tea:14,patience:60,slip:1},
    hard:{duration:1.45,portal:4,pressure:.09,workPressure:.3,penalty:6,tea:11,patience:60,slip:1.35}
  };
  const PLACES=['monitor','printer','shelf','papers'];
  const LEGACY_PLACES=['tea','door','router','fan','phone','lamp'];
  const UPGRADES={cpu:[30000,60000,100000],printer:[25000,50000,90000]};
  const clone=x=>JSON.parse(JSON.stringify(x)),finite=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b,int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
  const validKey=k=>CUSTOMERS.some(c=>c.missions.some((_,m)=>k===c.id+':'+m));
  const draft=()=>({crop:'square',background:'filter',size:80,roller:false,hotspot:false,angle:15,isolated:[],fields:{},selected:[],total:''});
  const validDraft=f=>!(!f||!f.fields||Array.isArray(f.fields)||typeof f.fields!=='object'||Object.keys(f.fields).some(k=>!/^\w{1,24}$/.test(k)||typeof f.fields[k]!=='string'||f.fields[k].length>40)||!Array.isArray(f.selected)||new Set(f.selected).size!==f.selected.length||f.selected.some(k=>typeof k!=='string'||!/^\w{1,24}$/.test(k))||typeof f.total!=='string'||!/^\d{0,12}$/.test(f.total)||!['square','3x4'].includes(f.crop)||!['filter','gray'].includes(f.background)||![45,80].includes(f.size)||typeof f.roller!=='boolean'||typeof f.hotspot!=='boolean'||![15,45,80].includes(f.angle)||!Array.isArray(f.isolated)||new Set(f.isolated).size!==f.isolated.length||f.isolated.some(n=>!int(n,0,3)));
  const freshPlot=()=>({day:1,choices:[],transfer:{active:false,elapsed:0,covered:false,checked:false,alarm:0,spotted:false,days:[]}});
  const fresh=()=>({version:9,roster:[],developer:false,visitResume:null,storyResume:null,plot:freshPlot(),dayBreak:true,credits:[],difficulty:null,stress:18,paper:20,prints:0,teaCooldown:0,attempts:0,server:'offline',usbScanned:false,consoleModel:'PS4',consoleChecked:false,visited:[],rng:(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0||1,gameOver:false,ending:null,endingReason:null,present:true,arrivalRemaining:0,departureRemaining:0,wait:0,complaints:0,slipCooldown:0,slipClock:0,slips:0,stressReason:'stress_calm',spent:0,upgrades:{cpu:0,printer:0},risk:0,mistakes:0,failed:[],feedback:null,devices:{radio:false,breathCooldown:0,cleanCooldown:0,printerClean:false},schedule:[],position:0,order:{index:0,mission:0,step:0,line:0,earnings:0,retries:0,checked:false,codeBad:false,code:'',completed:[],errors:[],draft:draft(),missionElapsed:0,refreshes:0,refreshGap:0,deadlineMissed:false,bonus:0,riskPending:0}});
  class Room{
    constructor(saved){
      this.state=fresh();this.started=false;this.paused=false;this.job=null;
      if(!saved){this.makeSchedule();return;}
      const d=typeof saved==='string'?JSON.parse(saved):clone(saved);
      if(!d||![1,2,3,4,5,6,7,8,9].includes(d.version)||!finite(d.stress,0,100)||!int(d.paper,0,99)||!int(d.prints,0,1e9)||!finite(d.teaCooldown,0,1e9)||!int(d.attempts,0,1e9)||!['offline','online'].includes(d.server)||!['PS3','PS4'].includes(d.consoleModel)||!Array.isArray(d.visited)||d.visited.some(p=>!PLACES.includes(p)&&!LEGACY_PLACES.includes(p)))throw Error('Invalid save');
      // Retire old equipment while retaining compatible visits and earned money.
      d.visited=d.visited.filter(p=>PLACES.includes(p));
      if(d.devices)for(const key of ['fan','lamp','phoneCooldown','routerCooldown','routerBoost'])delete d.devices[key];
      if(d.activeJob?.kind==='router')d.activeJob=null;
      if(d.version===5&&d.upgrades&&Object.hasOwn(d.upgrades,'router')){
        if(!int(d.upgrades.router,0,3)||!int(d.spent,0,1e9))throw Error('Invalid legacy upgrade');
        d.spent-=[35000,65000,110000].slice(0,d.upgrades.router).reduce((a,b)=>a+b,0);
        delete d.upgrades.router;
      }
      if(d.version<6){this.migrate(d);return;}
      const oldCount=d.schedule?.length/DAYS;
      if(d.version===6){
        d.version=7;d.plot=freshPlot();d.plot.day=d.position<oldCount*DAYS?Math.floor(d.position/oldCount)+1:4;
        // Completed v6 shop saves continue into the new night story without losing earnings.
        if(d.position===oldCount*DAYS&&d.stress<100){d.ending=null;d.endingReason=null;d.gameOver=false;d.dayBreak=true;d.present=false;}
      }
      if(d.version<8){d.developer=false;d.visitResume=null;d.storyResume=null;}
      this.validate(d,oldCount);
      for(const k of Object.keys(this.state))if(k in d)this.state[k]=clone(d[k]);
      this.state.version=9;
      if(d.version<9){this.state.roster=[];this.migrateDailyRoster(d,oldCount);return;}
      if(d.activeJob){this.validateJob(d.activeJob);this.job=clone(d.activeJob);}
    }
    validate(d,count=DAILY_COUNT){
      const q=d.order,dev=d.devices,total=count*DAYS,limit=d.version<9?count:COUNT;
      if(![DAILY_COUNT,LEGACY_COUNT,COUNT].includes(count)||typeof d.developer!=='boolean')throw Error('Invalid roster or developer flag');
      if(d.version===9&&(!Array.isArray(d.roster)||d.roster.length!==DAILY_COUNT||new Set(d.roster).size!==DAILY_COUNT||d.roster.some(n=>!int(n,0,COUNT-1))||d.schedule.some(n=>!d.roster.includes(n))))throw Error('Invalid selected roster');
      if(d.difficulty!==null&&!Object.hasOwn(LEVELS,d.difficulty))throw Error('Invalid difficulty');
      if(!Array.isArray(d.schedule)||d.schedule.length!==total||!int(d.position,0,total)||d.schedule.some((n,i)=>!int(n,0,limit-1)||i>0&&n===d.schedule[i-1])||Array.from({length:DAYS},(_,day)=>new Set(d.schedule.slice(day*count,(day+1)*count)).size).some(n=>n!==count)||typeof d.dayBreak!=='boolean'||typeof d.present!=='boolean'||typeof d.gameOver!=='boolean'||!int(d.rng,1,0xffffffff))throw Error('Invalid day schedule');
      if(!q||!int(q.index,0,limit)||!int(q.mission,0,DAYS-1)||!int(q.step,0,5)||!int(q.line,0,2)||!int(q.earnings,0,1e9)||!int(q.retries,0,10)||typeof q.checked!=='boolean'||typeof q.codeBad!=='boolean'||typeof q.code!=='string'||!/^\d{0,4}$/.test(q.code))throw Error('Invalid order');
      for(const a of [q.completed,d.failed,d.credits])if(!Array.isArray(a)||new Set(a).size!==a.length||a.some(k=>!validKey(k)))throw Error('Invalid ledger');
      const resolved=[...q.completed,...d.failed];
      if(new Set(resolved).size!==resolved.length||d.credits.some(k=>!resolved.includes(k)))throw Error('Invalid resolved visits');
      for(let i=0;i<total;i++){
        const key=CUSTOMERS[d.schedule[i]].id+':'+Math.floor(i/count),paid=resolved.includes(key);
        if(i<d.position&&!paid||i===d.position&&paid!==(q.step===5)||i>d.position&&paid&&!d.credits.includes(key))throw Error('Invalid visit history');
      }
      if(q.index===limit?(d.position!==total||d.present):(d.schedule[d.position]!==q.index||q.mission!==Math.floor(d.position/count)||d.dayBreak&&(d.present||q.step!==0)||!d.dayBreak&&!d.present&&q.step!==5||q.step!==5&&q.step>(d.difficulty==='easy'?3:4)))throw Error('Invalid current visit');
      if(!dev||['radio','printerClean'].some(k=>typeof dev[k]!=='boolean')||['breathCooldown','cleanCooldown'].some(k=>!finite(dev[k],0,120))||['arrivalRemaining','departureRemaining','wait','slipCooldown','slipClock'].some(k=>!finite(d[k],0,1e9))||!int(d.slips,0,1e9)||!int(d.complaints,0,1))throw Error('Invalid device state');
      if(!d.upgrades||Object.keys(UPGRADES).some(k=>!int(d.upgrades[k],0,3))||!int(d.spent,0,q.earnings)||d.spent!==Object.keys(UPGRADES).reduce((sum,k)=>sum+UPGRADES[k].slice(0,d.upgrades[k]).reduce((a,b)=>a+b,0),0)||!int(d.risk,0,1e9)||!int(d.mistakes,0,1e9)||![null,'good','bad'].includes(d.ending)||![null,'stress','closing'].includes(d.endingReason)||d.gameOver!==(d.ending==='bad'))throw Error('Invalid economy or ending');
      this.validatePlot(d,count);
      this.validateResumes(d,count);
      const flags=this.plotFlags(d.plot);
      if(d.ending==='good'&&(!flags.cleaned||flags.transferred||flags.dealActive)||d.endingReason==='stress'&&d.stress!==100)throw Error('Invalid ending progress');
      if(!Array.isArray(q.errors)||q.errors.some(e=>!e||!['reference','task','deadline'].includes(e.reason)||e.task!==null&&!Object.hasOwn(TASKS,e.task))||!finite(q.missionElapsed,0,1e9)||!int(q.refreshes,0,100)||!finite(q.refreshGap,0,1)||typeof q.deadlineMissed!=='boolean'||!int(q.bonus,0,1e9)||!int(q.riskPending,0,1e9))throw Error('Invalid work state');
      if(!validDraft(q.draft))throw Error('Invalid draft');
      if(d.feedback&&(!['wrong','anger','left'].includes(d.feedback.kind)||!CUSTOMERS.some(c=>c.id===d.feedback.customer)||typeof d.feedback.message?.fa!=='string'||typeof d.feedback.message?.en!=='string'))throw Error('Invalid customer feedback');
    }
    validatePlot(d,count=DAILY_COUNT){
      const total=count*DAYS;
      const p=d.plot,tr=p?.transfer;
      if(!p||!int(p.day,1,STORY_DAYS)||!Array.isArray(p.choices)||p.choices.length>7||p.choices.some((c,i)=>!c||c.day!==i+4||!STORY.chapters[c.day-1]?.event.options.some(o=>o.id===c.option)))throw Error('Invalid story choices');
      if(d.position<total?(p.day!==Math.floor(d.position/count)+1||p.choices.length>0):(p.day!==Math.min(10,4+p.choices.length)))throw Error('Invalid story day');
      if(d.endingReason==='closing'?(d.position!==total||p.choices.length!==7||d.dayBreak):!d.ending&&d.position===total&&(!d.dayBreak||p.choices.length===7))throw Error('Invalid story ending');
      if(!tr||['active','covered','checked','spotted'].some(k=>typeof tr[k]!=='boolean')||!finite(tr.elapsed,0,8)||!finite(tr.alarm,0,2.5)||!Array.isArray(tr.days)||new Set(tr.days).size!==tr.days.length||tr.days.some(n=>!int(n,1,3))||tr.active&&(d.position===total||d.dayBreak||d.ending||tr.days.includes(p.day)))throw Error('Invalid simulated transfer');
      if(tr.spotted&&!tr.checked||tr.alarm>0&&(!tr.checked||tr.covered||!tr.active))throw Error('Invalid inspection');
      if(d.endingReason==='closing'){
        const f=this.plotFlags(p),good=Boolean(f.cleaned&&!f.transferred&&!f.dealActive);
        if((d.ending==='good')!==good)throw Error('Invalid story outcome');
      }
    }
    plotFlags(plot=this.state.plot){
      const flags={dealActive:false,transferred:false,cleaned:false,warningIgnored:false};
      for(const c of plot.choices)Object.assign(flags,STORY.chapters[c.day-1].event.options.find(o=>o.id===c.option).flags);
      return flags;
    }
    chooseStory(id){
      const s=this.state,p=s.plot;if(!this.started||s.ending||s.position!==TOTAL||!s.dayBreak)return false;
      const option=STORY.chapters[p.day-1].event.options.find(o=>o.id===id);if(!option)return false;
      p.choices.push({day:p.day,option:id});s.order.earnings+=option.cash;s.risk+=option.risk;
      if(p.choices.length===7){const f=this.plotFlags();this.end(f.cleaned&&!f.transferred&&!f.dealActive?'good':'bad','closing');}
      else p.day++;
      return true;
    }
    beginCopy(){
      const s=this.state,tr=s.plot.transfer;if(!this.ready()||this.job||tr.active||tr.days.includes(this.day()))return false;
      Object.assign(tr,{active:true,elapsed:0,covered:false,checked:false,alarm:0,spotted:false});return true;
    }
    toggleCover(){
      const tr=this.state.plot.transfer;if(!this.ready()||!tr.active)return false;
      tr.covered=!tr.covered;if(tr.covered)tr.alarm=0;return true;
    }
    tickCopy(seconds){
      const s=this.state,tr=s.plot.transfer;if(!tr.active||tr.covered)return null;
      // Inspection consumes a real response window, even when tick() receives a large delta.
      tr.elapsed=Math.min(8,tr.elapsed+seconds);let event=null;
      if(!tr.checked&&tr.elapsed>=3){tr.checked=true;tr.alarm=2.5;event='copy_alert';}
      const exposed=event==='copy_alert'?Math.max(0,tr.elapsed-3):seconds;
      if(tr.alarm>0){tr.alarm=Math.max(0,tr.alarm-exposed);if(!tr.alarm){tr.spotted=true;s.risk++;this.stressBy(12,'stress_inspector');event='copy_spotted';}}
      if(s.ending)return 'game_over';
      if(tr.elapsed>=8){tr.active=false;tr.alarm=0;tr.days.push(this.day());s.order.earnings+=15000;return 'copy_done';}
      return event;
    }
    validateResumes(d,count=DAILY_COUNT){
      const total=count*DAYS;
      const r=d.visitResume;
      if(r){
        const c=CUSTOMERS.find(c=>c.id===r.customer),q=r.order;
        if(!c||!int(r.mission,0,2)||!q||!int(q.step,0,d.difficulty==='easy'?3:4)||!int(q.line,0,2)||!finite(r.wait,0,59.999999)||!int(r.complaints,0,1)||!int(q.retries,0,10)||typeof q.checked!=='boolean'||typeof q.codeBad!=='boolean'||typeof q.code!=='string'||!/^\d{0,4}$/.test(q.code)||!validDraft(q.draft)||!Array.isArray(q.errors)||q.errors.some(e=>!e||!['reference','task','deadline'].includes(e.reason)||e.task!==null&&!Object.hasOwn(TASKS,e.task))||!finite(q.missionElapsed,0,1e9)||!int(q.refreshes,0,100)||!finite(q.refreshGap,0,1)||typeof q.deadlineMissed!=='boolean'||!int(q.bonus,0,1e9)||!int(q.riskPending,0,1e9))throw Error('Invalid pending visit');
        const j=r.job;if(j&&(!['work','retry','print','scan','console','breath'].includes(j.kind)||!finite(j.duration,.1,120)||!finite(j.elapsed,0,j.duration)||j.elapsed>=j.duration||j.kind==='work'&&!c.missions[r.mission].tasks.includes(j.task)))throw Error('Invalid pending job');
      }
      if(d.storyResume){
        const r=d.storyResume;if(d.position===total||!r.plot||![null,'good','bad'].includes(r.ending)||![null,'closing'].includes(r.endingReason))throw Error('Invalid pending story');
        this.validatePlot({...d,plot:r.plot,position:total,dayBreak:!r.ending,ending:r.ending,endingReason:r.endingReason},count);
      }
    }
    migrateDailyRoster(old,count){
      const s=this.state,q=s.order,keys=['step','line','retries','checked','codeBad','code','errors','draft','missionElapsed','refreshes','refreshGap','deadlineMissed','bonus','riskPending'];
      s.credits=[...new Set([...s.credits,...q.completed,...s.failed])];
      if(old.position===count*DAYS&&old.endingReason!=='stress')s.storyResume={plot:clone(old.plot),ending:old.ending,endingReason:old.endingReason};
      if(old.position<count*DAYS&&old.present&&q.step<5)s.visitResume={customer:CUSTOMERS[q.index].id,mission:q.mission,order:Object.fromEntries(keys.map(k=>[k,clone(q[k])])),wait:s.wait,complaints:s.complaints,feedback:clone(s.feedback),job:old.activeJob?clone(old.activeJob):null};
      if(old.endingReason!=='stress'){s.ending=null;s.endingReason=null;s.gameOver=false;}
      const copyDays=[...s.plot.transfer.days];s.plot=freshPlot();s.plot.transfer.days=copyDays;
      this.makeSchedule(old.order.index);
      if(s.visitResume&&s.order.index===old.order.index&&s.order.mission===old.order.mission){s.dayBreak=false;s.present=true;this.restoreVisit();}
      if(s.stress>=100)this.end('bad','stress');
      this.validate(s);if(this.job)this.validateJob(this.job);
    }
    restoreVisit(){
      const s=this.state,r=s.visitResume;
      if(!r||s.dayBreak||!s.present||CUSTOMERS[s.order.index]?.id!==r.customer||s.order.mission!==r.mission)return;
      for(const key of ['step','line','retries','checked','codeBad','code','errors','draft','missionElapsed','refreshes','refreshGap','deadlineMissed','bonus','riskPending'])s.order[key]=clone(r.order[key]);
      s.wait=r.wait;s.complaints=r.complaints;s.feedback=clone(r.feedback);this.job=r.job?clone(r.job):null;s.visitResume=null;
    }
    toggleDeveloper(){if(!this.started)return false;this.state.developer=!this.state.developer;return true;}
    developerSkip(satisfied){
      const s=this.state,q=s.order;if(!this.started||!s.developer||s.ending||s.dayBreak||!s.present||q.step===5||typeof satisfied!=='boolean')return null;
      const key=this.customer().id+':'+q.mission;if(q.completed.includes(key)||s.failed.includes(key))return null;
      this.job=null;q.errors=[];q.bonus=0;q.riskPending=0;q.step=5;q.line=0;s.feedback=null;
      if(satisfied){q.completed.push(key);q.earnings+=this.mission().reward;this.stressBy(-7,'stress_delivery');}else s.failed.push(key);
      s.present=false;s.departureRemaining=0;s.arrivalRemaining=4;
      return satisfied?'dev_skip_happy':'dev_skip_unhappy';
    }
    validateJob(j){
      const t=this.task();if(!['work','retry','print','scan','console','breath'].includes(j.kind)||!finite(j.duration,.1,120)||!finite(j.elapsed,0,j.duration)||j.elapsed>=j.duration||(j.kind==='work'&&(!t||j.task!==this.taskId()||['choice','refresh'].includes(t.kind)))||(!this.state.present&&j.kind==='work'))throw Error('Invalid job');
    }
    migrate(d){
      const s=this.state,old=d.order;
      for(const k of ['stress','paper','prints','teaCooldown','attempts','server','usbScanned','consoleModel','consoleChecked','visited'])if(k in d)s[k]=clone(d[k]);
      if(old&&!int(old.earnings,0,1e9))throw Error('Invalid legacy earnings');
      s.order.earnings=old?.earnings||0;
      if(d.difficulty!==undefined&&d.difficulty!==null&&!Object.hasOwn(LEVELS,d.difficulty))throw Error('Invalid legacy difficulty');
      s.difficulty=d.difficulty||null;
      if(d.version>=4){
        const count=d.version===4?5:LEGACY_COUNT;
        if(!Array.isArray(d.schedule)||d.schedule.length!==count*2||d.schedule.some(n=>!int(n,0,count-1))||Array.from({length:count},(_,c)=>d.schedule.filter(n=>n===c).length).some(n=>n!==2)||!int(d.position,0,count*2)||!old||!int(old.index,0,count))throw Error('Invalid legacy schedule');
        for(const [source,target] of [[old.completed,'completed'],[d.failed||[],'failed']]){
          if(!Array.isArray(source)||new Set(source).size!==source.length||source.some(k=>!validKey(k)||!/[01]$/.test(k)))throw Error('Invalid legacy ledger');
          if(target==='completed')s.order.completed=[...source];else s.failed=[...source];
        }
        if(d.version===5)for(const k of ['spent','upgrades','risk','mistakes'])if(k in d)s[k]=clone(d[k]);
        if(d.devices)for(const k of Object.keys(s.devices))if(k in d.devices)s.devices[k]=clone(d.devices[k]);
        for(const k of ['slips','slipCooldown','slipClock'])s[k]=d[k]||0;
      }else{
        const legacy=Array.isArray(old?.completed)?[...old.completed]:[];
        if(d.version===2&&old){if(old.index>0||old.index===0&&old.step===5)legacy.push('man:0');if(old.index>1||old.index===1&&old.step===5)legacy.push('woman:0');}
        for(const c of CUSTOMERS.slice(0,5))for(let m=0;m<2;m++)if(legacy.includes(c.id+':'+c.legacyMissions[m]))s.order.completed.push(c.id+':'+m);
      }
      s.credits=[...s.order.completed,...s.failed];
      this.makeSchedule(old&&int(old.index,0,COUNT-1)?old.index:undefined);
      // Resume an active legacy visit only if it is the next unfinished visit in day order.
      const compatible=old&&s.order.index===old.index&&s.order.mission===(old.mission||0)&&old.step>0&&old.step<5;
      if(compatible){
        for(const k of ['step','line','retries','checked','code','codeBad','errors','missionElapsed','refreshes','refreshGap','deadlineMissed','bonus','riskPending'])if(k in old)s.order[k]=clone(old[k]);
        s.order.draft={...draft(),...(old.draft||{})};s.dayBreak=false;s.present=true;s.wait=Math.min(59,d.wait||0);s.complaints=s.wait>=30?1:0;
        if(d.activeJob&&this.task()&&!['choice','refresh'].includes(this.task().kind)){
          const duration=this.duration(this.task());this.job={kind:'work',task:this.taskId(),elapsed:Math.min(duration-.01,Math.max(0,d.activeJob.elapsed||0)),duration,wrong:Boolean(d.activeJob.wrong)};
        }
      }
      if(s.stress>=100)this.end('bad','stress');
      this.validate(s);if(this.job)this.validateJob(this.job);
    }
    random(){let x=this.state.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.state.rng=x>>>0||1;return this.state.rng/4294967296;}
    shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
    arrangeRemaining(preferred){
      const s=this.state,resolved=new Set([...s.order.completed,...s.failed]);s.schedule=[];let preferredUsed=false;
      for(let day=0;day<DAYS;day++){
        const all=this.shuffle([...s.roster]),done=all.filter(c=>resolved.has(CUSTOMERS[c].id+':'+day)),pending=all.filter(c=>!resolved.has(CUSTOMERS[c].id+':'+day));
        const forced=!preferredUsed&&pending.includes(preferred);
        if(forced){pending.splice(pending.indexOf(preferred),1);pending.unshift(preferred);}
        if(pending.length)preferredUsed=true;
        const block=done.concat(pending);
        if(block[0]===s.schedule.at(-1)){
          if(forced){const last=s.schedule.length-1;[s.schedule[last],s.schedule[last-1]]=[s.schedule[last-1],s.schedule[last]];}
          else [block[0],block[1]]=[block[1],block[0]];
        }
        s.schedule.push(...block);
      }
      s.position=0;while(s.position<TOTAL&&resolved.has(CUSTOMERS[s.schedule[s.position]].id+':'+Math.floor(s.position/DAILY_COUNT)))s.position++;
    }
    makeSchedule(preferred){
      const s=this.state;
      if(s.roster.length!==DAILY_COUNT){
        s.roster=['neighbours','gaming','education','urgent','sensitive'].map(group=>{
          const candidates=CUSTOMERS.map((c,i)=>c.group===group?i:null).filter(i=>i!==null);
          return candidates.includes(preferred)?preferred:candidates[Math.floor(this.random()*candidates.length)];
        });
      }
      // Explicit preferred visitors are used by save migration and scenario setup.
      if(int(preferred,0,COUNT-1)&&!s.roster.includes(preferred)){
        const slot=s.roster.findIndex(i=>CUSTOMERS[i].group===CUSTOMERS[preferred].group);
        s.roster[slot<0?0:slot]=preferred;
      }
      s.credits=[...new Set([...s.credits,...s.order.completed,...s.failed])];
      this.arrangeRemaining(preferred??(s.order.completed.length?undefined:s.roster[0]));this.selectVisit(s.position,true);
    }
    visitCount(ledger=this.state.order.completed){
      const s=this.state;return s.schedule.reduce((sum,c,i)=>sum+Number(ledger.includes(CUSTOMERS[c].id+':'+Math.floor(i/DAILY_COUNT))),0);
    }
    selectVisit(position,opening=false){
      const s=this.state,q=s.order,previousDay=Math.floor(s.position/DAILY_COUNT),resolved=new Set([...q.completed,...s.failed]);
      while(position<TOTAL&&resolved.has(CUSTOMERS[s.schedule[position]].id+':'+Math.floor(position/DAILY_COUNT)))position++;
      s.position=position;s.plot.day=position<TOTAL?Math.floor(position/DAILY_COUNT)+1:4;s.dayBreak=position===TOTAL||opening||Math.floor(position/DAILY_COUNT)>previousDay;if(s.dayBreak){s.plot.transfer.active=false;s.plot.transfer.alarm=0;}s.present=position<TOTAL&&!s.dayBreak;s.wait=0;s.complaints=0;s.departureRemaining=0;s.arrivalRemaining=0;s.feedback=null;
      Object.assign(q,{index:position<TOTAL?s.schedule[position]:COUNT,mission:position<TOTAL?Math.floor(position/DAILY_COUNT):0,step:0,line:0,retries:0,checked:false,codeBad:false,code:'',errors:[],draft:draft(),missionElapsed:0,refreshes:0,refreshGap:0,deadlineMissed:false,bonus:0,riskPending:0});
      if(position===TOTAL&&s.storyResume){const r=s.storyResume;s.plot=clone(r.plot);s.storyResume=null;if(r.ending)this.end(r.ending,r.endingReason);}
      if(position<TOTAL)this.restoreVisit();
    }
    day(){return this.state.plot.day;}
    startDay(){
      const s=this.state;if(!this.started||this.paused||s.ending||!s.dayBreak||s.position===TOTAL)return false;
      if(this.day()>1){this.stressBy(-20,'stress_overnight');s.paper=Math.max(20,s.paper);}
      s.dayBreak=false;s.present=true;this.restoreVisit();return true;
    }
    level(){return LEVELS[this.state.difficulty||'normal'];}
    setDifficulty(value){
      if(this.started||!Object.hasOwn(LEVELS,value))return false;
      if(this.state.difficulty!==value)this.state.visitResume=null;
      const q=this.state.order,oldTask=this.taskId(),delivery=q.step===this.deliveryStep();this.state.difficulty=value;
      if(q.step>0&&q.step<5){const ids=this.taskIds();q.step=delivery?ids.length+1:Math.max(1,(ids.includes(oldTask)?ids.indexOf(oldTask):Math.min(q.step-1,ids.length-1))+1);if(this.job?.kind==='work'&&this.job.task!==this.taskId())this.job=null;q.checked=false;if(q.code.length!==4)q.code=String(1000+Math.floor(this.random()*9000));}return true;
    }
    customer(){return this.state.present?CUSTOMERS[this.state.order.index]||null:null;}
    mission(){return this.customer()?.missions[this.state.order.mission]||null;}
    taskIds(){const m=this.mission();return m?(this.state.difficulty==='easy'?[m.tasks[1]&&TASKS[m.tasks[1]].kind==='portal'&&!['form','files','invoice'].includes(TASKS[m.tasks[0]].kind)?m.tasks[1]:m.tasks[0],m.tasks.at(-1)]:m.tasks):[];}
    taskId(){return this.taskIds()[this.state.order.step-1]||null;}
    task(){return TASKS[this.taskId()]||null;}
    deliveryStep(){return this.taskIds().length+1;}
    start(){if(!this.state.difficulty)return false;this.started=true;this.paused=false;return true;}
    ready(){return this.started&&!this.paused&&!this.state.ending&&!this.state.dayBreak&&this.state.position<TOTAL;}
    end(type,reason){this.state.ending=type;this.state.endingReason=reason;this.state.gameOver=type==='bad';this.state.plot.transfer.active=false;this.state.plot.transfer.alarm=0;if(this.state.position===TOTAL)this.state.dayBreak=false;this.job=null;}
    stressBy(amount,reason){const s=this.state;s.stress=Math.max(0,Math.min(100,s.stress+amount));if(Math.abs(amount)>.5||!this.reasonTime){s.stressReason=reason;if(Math.abs(amount)>.5)this.reasonTime=6;}if(s.stress>=100)this.end('bad','stress');}
    advance(){const q=this.state.order;q.step++;q.line=0;q.retries=0;q.checked=false;q.codeBad=false;q.code=String(1000+Math.floor(this.random()*9000));q.draft=draft();q.refreshes=0;q.refreshGap=0;this.stressBy(-1.5,'stress_progress');}
    feedback(kind,message){this.state.feedback={kind,customer:this.customer().id,message};this.state.order.line=0;}
    dialogueNext(){if(!this.ready()||!this.customer())return false;if(this.state.feedback){this.state.feedback=null;return true;}const q=this.state.order,limit=q.step===0?2:q.step===5?1:0;if(q.line>=limit)return false;q.line++;return true;}
    slip(){const s=this.state;if(s.stress<=50||s.slipCooldown>0)return false;if(this.random()>=(s.stress-50)/50*.55*this.level().slip)return false;s.slips++;s.slipCooldown=18;this.stressBy(3,'stress_slip');return true;}
    error(task=this.taskId(),reason='task'){const errors=this.state.order.errors;if(!errors.some(e=>e.task===task&&e.reason===reason))errors.push({task,reason});}
    finishStage(wrong=false){if(wrong)this.error();if(this.state.order.codeBad)this.error(this.taskId(),'reference');this.advance();return 'task_complete';}
    reject(){
      const q=this.state.order,e=q.errors[0],c=this.customer(),t=TASKS[e.task];let message;
      if(e.reason==='reference')message={fa:'«کد پرونده رو اشتباه وارد کردی! چهار رقم هم از دستت در می‌ره مهندس؟ دوباره انجام بده!»',en:'Wrong case code! Four digits are too much for you, engineer? Do it again!'};
      else if(e.reason==='deadline')message={fa:'«مهلت سفارش پرید! با این سرعتت لاک‌پشت هم ازت جلو می‌زنه. از اول انجام بده!»',en:'The order deadline passed! A tortoise is faster than you. Start again!'};
      else {const f=t?.feedback||{fa:'این خروجی با درخواست من جور نیست.',en:'This output does not match my request.'};const mock=c.mock||{fa:'«مهندس! با این دقتت باید کیبوردت بازنشسته بشه. دوباره انجام بده!»',en:'Engineer! At this accuracy your keyboard should retire. Do it again!'};message={fa:f.fa+' '+mock.fa,en:f.en+' '+mock.en};}
      this.feedback('wrong',message);this.state.mistakes++;this.stressBy(25,'stress_rework');
      q.step=1;q.line=0;q.retries=0;q.checked=false;q.codeBad=false;q.code=String(1000+Math.floor(this.random()*9000));q.draft=draft();q.refreshes=0;q.refreshGap=0;q.errors=[];q.bonus=0;q.riskPending=0;q.deadlineMissed=false;q.missionElapsed=0;return this.state.ending?'game_over':'order_rejected';
    }
    refreshTarget(){return Math.max(2,({easy:2,normal:5,hard:7}[this.state.difficulty||'normal'])-this.state.upgrades.cpu);}
    duration(t){const category=t.kind==='print'||t.kind==='jam'?'printer':'cpu';return (t.duration||2.5)*this.level().duration*(1-this.state.upgrades[category]*.2);}
    balance(){return this.state.order.earnings-this.state.spent;}
    price(id){return UPGRADES[id]?.[this.state.upgrades[id]]??null;}
    purchase(id){if(!this.started||this.state.ending||this.job||!Object.hasOwn(UPGRADES,id))return null;const price=this.price(id);if(price===null)return 'upgrade_max';if(this.balance()<price)return 'upgrade_poor';this.state.spent+=price;this.state.upgrades[id]++;return 'upgrade_bought';}
    orderAction(action){
      if(!this.ready()||this.job||!this.mission())return null;
      const s=this.state,q=s.order,t=this.task();
      if(action==='accept'&&q.step===0){this.advance();return 'order_accepted';}
      if(action==='deliver'&&q.step===this.deliveryStep()){
        if(q.errors.length)return this.reject();
        const key=this.customer().id+':'+q.mission;if(q.completed.includes(key)||s.failed.includes(key))return null;
        q.completed.push(key);q.earnings+=this.mission().reward+q.bonus;s.risk+=q.riskPending;q.step=5;q.line=0;s.feedback=null;s.departureRemaining=5;this.stressBy(-7,'stress_delivery');return 'mission_delivered';
      }
      if(action==='next'&&q.step===5)return this.depart();
      if(action.startsWith('check:')&&s.difficulty==='hard'&&t){q.checked=true;q.codeBad=action.slice(6)!==q.code;return 'code_recorded';}
      if(t&&s.difficulty==='hard'&&!q.checked)return 'code_needed';
      if(action==='refresh'&&t?.kind==='refresh'){
        if(q.refreshGap>0)return null;q.refreshGap=.35;q.refreshes++;if(q.refreshes>=this.refreshTarget()){s.server='online';return this.finishStage();}return 'refresh_sent';
      }
      if(action.startsWith('set:')&&t){
        const [field,value]=action.slice(4).split(':');
        if(t.kind==='photo'&&field==='crop'&&['3x4','square'].includes(value))q.draft.crop=value;
        else if(t.kind==='photo'&&field==='background'&&['gray','filter'].includes(value))q.draft.background=value;
        else if(t.kind==='photo'&&field==='size'&&['45','80'].includes(value))q.draft.size=Number(value);
        else if(t.kind==='jam'&&field==='roller')q.draft.roller=value==='true';
        else if(t.kind==='signal'&&field==='hotspot')q.draft.hotspot=value==='true';
        else if(t.kind==='signal'&&field==='angle'&&['15','45','80'].includes(value))q.draft.angle=Number(value);
        else if(t.kind==='quarantine'&&field==='isolate'&&/^[0-3]$/.test(value)){const n=Number(value),a=q.draft.isolated;q.draft.isolated=a.includes(n)?a.filter(x=>x!==n):[...a,n];}
        else if(t.kind==='form'&&t.fields.some(f=>f.key===field&&f.options.some(o=>o.value===value)))q.draft.fields[field]=value;
        else if(t.kind==='files'&&field==='file'&&t.items.some(i=>i.id===value)){const a=q.draft.selected;q.draft.selected=a.includes(value)?a.filter(x=>x!==value):[...a,value];}
        else if(t.kind==='invoice'&&field==='total'&&/^\d{0,12}$/.test(value))q.draft.total=value;
        else return null;return 'setting_saved';
      }
      if(action.startsWith('choose:')&&t?.kind==='choice'){
        const id=action.slice(7);if(!t.options.some(o=>o.id===id))return null;
        const branch=t.branches?.[id],wrong=!branch&&id!==t.correct;
        if(wrong&&s.difficulty==='easy'){this.stressBy(this.level().penalty,'stress_wrong');return 'wrong_choice';}
        if(branch){q.bonus+=branch.bonus||0;q.riskPending+=branch.risk||0;if(branch.stress)this.stressBy(branch.stress,'stress_work');}
        const slipped=this.slip();if(s.ending)return 'game_over';
        if(slipped&&s.difficulty==='easy'){q.checked=false;return 'slip_typo';}
        return this.finishStage(wrong||slipped);
      }
      if(action==='work'&&t&&!['choice','refresh'].includes(t.kind)){
        if(t.kind==='print'&&s.paper<t.sheets)return 'order_paper_empty';
        let wrong=t.kind==='photo'&&(q.draft.crop!=='3x4'||q.draft.background!=='gray'||q.draft.size>=50)||t.kind==='jam'&&!q.draft.roller||t.kind==='signal'&&(!q.draft.hotspot||q.draft.angle!==45)||t.kind==='quarantine'&&q.draft.isolated.length!==4||t.kind==='form'&&t.fields.some(f=>q.draft.fields[f.key]!==f.correct)||t.kind==='files'&&(q.draft.selected.length!==t.required.length||t.required.some(k=>!q.draft.selected.includes(k)))||t.kind==='invoice'&&(q.draft.total===''||Number(q.draft.total)!==t.items.reduce((sum,i)=>sum+i.amount,0));
        if(wrong&&s.difficulty==='easy'){return 'wrong_setup';}
        if(t.kind==='print')s.paper-=t.sheets;
        this.job={kind:'work',task:this.taskId(),duration:this.duration(t),elapsed:0,wrong:Boolean(wrong)};return t.kind==='print'?'printing_order':'request_working';
      }
      return null;
    }
    depart(){if(!this.ready()||this.state.order.step!==5)return null;this.state.present=false;this.state.departureRemaining=0;this.state.arrivalRemaining=4;this.job=null;return 'customer_left';}
    visit(place){if(this.ready()&&PLACES.includes(place)&&!this.state.visited.includes(place))this.state.visited.push(place);}
    tea(){if(!this.ready()||this.state.teaCooldown>0)return false;this.stressBy(-this.level().tea,'stress_tea');this.state.teaCooldown=25;return true;}
    utility(action){
      if(!this.ready()||!['radio','clean','breath'].includes(action))return null;const d=this.state.devices;
      if(action==='radio'){d[action]=!d[action];return 'device_toggled';}
      if(this.job)return 'equipment_busy';
      if(action==='clean'&&d.cleanCooldown<=0){d.cleanCooldown=30;d.printerClean=true;this.stressBy(-3,'stress_progress');return 'clean_done';}
      if(action==='breath'&&d.breathCooldown<=0){d.breathCooldown=40;this.job={kind:'breath',duration:4,elapsed:0};return 'breath_start';}return 'device_cooldown';
    }
    begin(kind){if(!this.ready()||this.job||!['retry','print','scan','console'].includes(kind)||kind==='print'&&this.state.paper<1)return false;if(kind==='print')this.state.paper--;const cat=kind==='print'?'printer':'cpu';this.job={kind,elapsed:0,duration:(kind==='retry'?2.5:kind==='print'?1.8:2)*(1-this.state.upgrades[cat]*.2)};return true;}
    timeout(){const s=this.state,q=s.order,key=this.customer().id+':'+q.mission;s.failed.push(key);q.step=5;q.line=0;s.departureRemaining=5;this.job=null;this.feedback('left',{fa:'«یک دقیقه تموم شد! این سفارش رو نمی‌خوام؛ پولی هم نمی‌دم. مغازه رو دادی دست لاک‌پشت؟!»',en:'A whole minute! Keep the order. I am not paying. Is a tortoise running this shop?'});return 'customer_timeout';}
    tick(seconds){
      if(!this.ready()||!finite(seconds,.000001,3600))return null;
      const s=this.state,q=s.order,d=s.devices,l=this.level();this.reasonTime=Math.max(0,(this.reasonTime||0)-seconds);
      s.teaCooldown=Math.max(0,s.teaCooldown-seconds);s.slipCooldown=Math.max(0,s.slipCooldown-seconds);q.refreshGap=Math.max(0,q.refreshGap-seconds);
      for(const k of ['breathCooldown','cleanCooldown'])d[k]=Math.max(0,d[k]-seconds);
      if(!s.present&&s.arrivalRemaining>0){s.arrivalRemaining=Math.max(0,s.arrivalRemaining-seconds);this.stressBy(-seconds*.5,'stress_calm');if(!s.arrivalRemaining){this.selectVisit(s.position+1);return s.ending?'shift_done':s.dayBreak?'day_complete':'new_order';}}
      if(s.present&&q.step===5){s.departureRemaining=Math.max(0,s.departureRemaining-seconds);if(!s.departureRemaining)return this.depart();}
      let complaint=false;
      if(s.present&&q.step<5){
        const previous=s.wait;s.wait=Math.min(60,s.wait+seconds);
        if(previous<30&&s.wait>=30&&!s.complaints){s.complaints=1;this.feedback('anger',this.customer().angry||{fa:'«سی ثانیه شد! با این سرعتت کبوتر نامه‌بر زودتر جواب می‌آورد مهندس!»',en:'Thirty seconds! A carrier pigeon would have finished by now, engineer!'});this.stressBy(15,'stress_complaint');complaint=true;}
        if(s.ending)return 'game_over';if(s.wait>=60)return this.timeout();
        if(q.step>0){q.missionElapsed+=seconds;const deadline=this.mission().deadline;if(deadline&&q.missionElapsed>=deadline&&q.step<this.deliveryStep()&&!q.deadlineMissed){q.deadlineMissed=true;this.error(null,'deadline');}}
        const pressure=(l.pressure+(this.job&&this.job.kind!=='breath'?l.workPressure:0))*(d.radio ? .85:1);this.stressBy(seconds*pressure,'stress_work');if(s.ending)return 'game_over';
      }else if(!this.job)this.stressBy(-seconds*.12,'stress_calm');
      const copyEvent=this.tickCopy(seconds);if(s.ending)return 'game_over';
      if(s.stress>50){s.slipClock+=seconds;if(s.slipClock>=12){s.slipClock=0;if(this.slip()){if(this.job)this.job.duration+=1.5;if(s.ending)return 'game_over';if(!complaint)return 'slip_delay';}}}else s.slipClock=0;
      if(!this.job)return complaint?'customer_complaint':copyEvent;
      this.job.elapsed=Math.min(this.job.duration,this.job.elapsed+seconds);if(this.job.elapsed<this.job.duration)return complaint?'customer_complaint':copyEvent;
      const j=this.job;this.job=null;
      if(j.kind==='breath'){this.stressBy(-12,'stress_breath');return 'breath_done';}
      if(j.kind==='work'){
        const t=this.task();if(!t)return null;
        const protectedPrint=t.kind==='print'&&d.printerClean;if(protectedPrint)d.printerClean=false;
        const slipped=!protectedPrint&&this.slip();if(s.ending)return 'game_over';
        if(slipped&&s.difficulty==='easy'){q.checked=false;return t.kind==='print'?'slip_print':'slip_typo';}
        if(t.kind==='portal'){
          q.retries++;s.attempts=q.retries;const required=Math.max(1,l.portal-Math.floor(s.upgrades.cpu/2));
          if(q.retries<required){s.server='offline';this.stressBy(l.penalty,'stress_timeout');return s.ending?'game_over':q.retries===1?'order_502':'order_99';}s.server='online';
        }
        if(t.kind==='print')s.prints+=t.sheets;
        this.finishStage(j.wrong||slipped);return q.step===this.deliveryStep()?'order_print_done':'task_complete';
      }
      if(j.kind==='retry'){s.attempts++;if(s.attempts>=Math.max(1,l.portal-Math.floor(s.upgrades.cpu/2))){s.server='online';return 'server_online';}this.stressBy(l.penalty,'stress_timeout');return s.ending?'game_over':'server_error';}
      if(j.kind==='print'){s.prints++;return 'print_done';}if(j.kind==='scan'){s.usbScanned=true;return 'scan_done';}if(j.kind==='console'){s.consoleChecked=true;return 'console_done';}
      return complaint?'customer_complaint':copyEvent;
    }
    refill(){if(this.ready())this.state.paper=Math.min(99,this.state.paper+20);}
    model(value){if(this.ready()&&!this.job&&['PS3','PS4'].includes(value)){this.state.consoleModel=value;this.state.consoleChecked=false;}}
    serialize(){return JSON.stringify({...this.state,activeJob:this.job});}
  }
  return {Room,CUSTOMERS,TASKS,STORY,APPS,DAYS,STORY_DAYS,LEVELS,PLACES,UPGRADES,COUNT,DAILY_COUNT,TOTAL};
})();
if(typeof module!=='undefined')module.exports=RoomCore;
