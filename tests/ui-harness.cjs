/* Executes actual UI event handlers in a DOM stub. This is not a visual browser test. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const {CUSTOMERS,TASKS}=require('../src/engine.js');
function app(saved){
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),elements=new Map(),groups={'[data-place]':[],'[data-text]':[],'[data-difficulty]':[]},storage=new Map(saved||[]);let frame,now=0,anonymous=0;
  function element(id){const classes=new Set();let markup='';const el={id,hidden:false,disabled:false,dataset:{},listeners:{},style:{setProperty(){}},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),toggle(c,on){if(on===undefined)on=!classes.has(c);on?classes.add(c):classes.delete(c);},contains:c=>classes.has(c)},textContent:'',value:'',src:'',addEventListener(k,fn){this.listeners[k]=fn;},setAttribute(k,v){this[k]=v;},focus(){document.activeElement=this;},contains(){return false;},showModal(){this.open=true;},close(){this.open=false;},querySelector(){return null;}};
    Object.defineProperty(el,'innerHTML',{get:()=>markup,set(v){markup=v;for(const m of v.matchAll(/\bid="([^"]+)"/g))element(m[1]);}});elements.set(id,el);return el;
  }
  const document={hidden:false,activeElement:null,listeners:{},addEventListener(k,fn){this.listeners[k]=fn;},querySelectorAll:s=>groups[s]||[],querySelector:s=>s==='.settings'?elements.get('settings'):null,getElementById:id=>elements.get(id)||null};
  const body=html.slice(html.indexOf('<body>'),html.indexOf('<script type="application/json"'));
  for(const m of body.matchAll(/<[a-z][^>]*>/g)){
    const tag=m[0],id=tag.match(/\bid="([^"]+)"/)?.[1],el=element(id||'anonymous-'+anonymous++);
    el.hidden=/\bhidden\b/.test(tag);el.disabled=/\bdisabled\b/.test(tag);
    for(const attr of ['place','text','difficulty']){const val=tag.match(new RegExp('data-'+attr+'="([^"]+)"'))?.[1];if(val){el.dataset[attr]=val;groups['[data-'+attr+']'].push(el);}}
    const src=tag.match(/\bsrc="([^"]+)"/)?.[1];if(src)el.src=src;
  }
  element('settings');document.documentElement=element('html');document.body=element('body');document.activeElement=document.body;
  element('room-data').textContent=html.match(/<script type="application\/json" id="room-data">([\s\S]*?)<\/script>/)[1];
  const context=vm.createContext({document,window:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},matchMedia:()=>({matches:false}),performance:{now:()=>0},requestAnimationFrame:fn=>{frame=fn;},MISSION_DATA:JSON.parse(fs.readFileSync(path.join(root,'src/missions.json'),'utf8'))});
  vm.runInContext(fs.readFileSync(path.join(root,'src/engine.js'),'utf8'),context);vm.runInContext(fs.readFileSync(path.join(root,'src/app.js'),'utf8'),context);
  function clickElement(el){assert.ok(el);assert.equal(el.disabled,false,'Control enabled: '+el.id);el.listeners.click({});}
  return {get:id=>elements.get(id),storage,document,
    state:()=>JSON.parse(storage.get('site-down-room-v1')),
    click:id=>clickElement(elements.get(id)),
    difficulty:value=>clickElement(groups['[data-difficulty]'].find(e=>e.dataset.difficulty===value)),
    place:value=>clickElement(groups['[data-place]'].find(e=>e.dataset.place===value)),
    action(name,id){const tag=elements.get('panel-content').innerHTML.match(new RegExp('<button[^>]*'+(id?'id="'+id+'"[^>]*':'')+'data-action="'+name+'"[^>]*>'));assert.ok(tag,'Present action: '+name);assert.equal(/\bdisabled\b/.test(tag[0]),false,'Enabled action: '+name);const control={dataset:{action:name},disabled:false};elements.get('panel-content').listeners.click({target:{closest:()=>control}});},
    advance(seconds){for(let i=0;i<Math.ceil(seconds*4);i++){now+=250;frame(now);}},
    key(code,modifiers={}){let prevented=false;document.listeners.keydown({code,key:code,...modifiers,preventDefault(){prevented=true;}});return prevented;}
  };
}

module.exports={app};
