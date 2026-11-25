/* Pre-K Para Planner — Kenzi's NOVA-style planner app.
   Data: one document per entry in the shared "lists" collection, id "prek_…", kind:"prek"
   (the life planner's Lists page only shows lists without a "kind", so these stay hidden there). */
(function(){'use strict';
var API='https://script.google.com/macros/s/AKfycby2K77ahxWPKILsKQNSUwa199QUB7uymfJbCbZUT9eRmwBT-8f6wZW-WVovfLPS7cZ4bQ/exec';
var COL='lists', LSK='prek_k', LSDB='prek_db', LSOUT='prek_out', LSUI='prek_ui';
var STANDALONE=(window.navigator.standalone===true)||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);

/* ---------- key ---------- */
var K=localStorage.getItem(LSK)||'';
(function(){var m=(location.search+location.hash).match(/[?&#]k=([^&#]+)/);
 if(m){K=decodeURIComponent(m[1]);localStorage.setItem(LSK,K);
  // On an iPhone, Safari and the Home Screen app keep separate storage, so leave the key in the
  // address while in Safari: "Add to Home Screen" then carries it into the app. Elsewhere, tidy it.
  var keep=!STANDALONE&&/iPhone|iPad|iPod/.test(navigator.userAgent);
  try{history.replaceState(null,'',location.pathname+(keep?'?k='+encodeURIComponent(K):'')+(location.hash.replace(/[#&]?k=[^&#]+/,'')||''));}catch(e){}}
 if(!K)K=localStorage.getItem('pk')||''; // the life planner's key on this same site, if already saved
})();

/* ---------- tiny helpers ---------- */
function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function pad(n){return (n<10?'0':'')+n;}
function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function today(){return iso(new Date());}
function nowTime(){var d=new Date();return pad(d.getHours())+':'+pad(d.getMinutes());}
function pd(s){if(!s)return null;var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]);}
function addDays(s,n){var d=pd(s);d.setDate(d.getDate()+n);return iso(d);}
function monday(s){var d=pd(s||today()),w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);return iso(d);}
var DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],DOWL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
function fmtD(s){var d=pd(s);return d?DOW[d.getDay()]+' '+(d.getMonth()+1)+'/'+d.getDate():'';}
function fmtLong(s){var d=pd(s);return d?DOWL[d.getDay()]+', '+MON[d.getMonth()]+' '+d.getDate():'';}
function fmtMD(s){var d=pd(s);return d?MON[d.getMonth()].slice(0,3)+' '+d.getDate():'';}
function fmtT(t){if(!t)return '';var p=t.split(':'),h=+p[0],m=p[1];return (h%12||12)+':'+m+(h<12?' am':' pm');}
function first(s,n){s=String(s||'').replace(/\s+/g,' ').trim();return s.length>(n||90)?s.slice(0,(n||90)-1)+'…':s;}

/* ---------- icons ---------- */
var IC={
 home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 grid:'<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
 start:'<circle cx="12" cy="12" r="9"/><path d="m10 8.2 5.6 3.8-5.6 3.8z"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
 week:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4M9 10h6M9 14h6M9 18h3"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.1.7 3.5 2.8 3.5 5.7"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 smile:'<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.2 2 3.5 2 3.5-2 3.5-2M9 9.5h.01M15 9.5h.01"/>',
 drop:'<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
 blocks:'<rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><rect x="8" y="3" width="8" height="8" rx="1"/>',
 chat:'<path d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-5.5 4v-4H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5z"/>',
 meet:'<circle cx="12" cy="7" r="3"/><circle cx="5" cy="10" r="2.2"/><circle cx="19" cy="10" r="2.2"/><path d="M7 20c0-3 2.2-5 5-5s5 2 5 5M1.5 18c0-2 1.4-3.5 3.5-3.5M22.5 18c0-2-1.4-3.5-3.5-3.5"/>',
 aid:'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M9 6V4h6v2M12 10v6M9 13h6"/>',
 todo:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
 heart:'<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
 list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 check:'<path d="m5 12.5 4.5 4.5L19 7"/>',
 print:'<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>'};
function ic(n,sw){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(sw||2)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[n]+'</svg>';}

/* ---------- sections ---------- */
var CARE_TYPES=['Dry','Wet','BM','Accident','Clothes change','Meal / snack','Nap','Nurse / meds','Other'];
var SUB_TOPICS=['My daily schedule','Kids who need extra help','My duties (arrival, lunch, recess, bus)','Where things are','Who to ask','Fire drill','Tornado drill','Lockdown','Evacuation / reunification','Medical needs (who has what plan)','Go-bag & headcount'];
var TYPEC={'Holiday / No school':'#F6C6DA','Meeting':'#CBD3F3','Event':'#FCE3A3','Birthday':'#E2D2F4','Due':'#FBD3AE','Other':'#BFE6D8'};
var MOODS=['😀','🙂','😐','😕','😩'];
var S=[
 {id:'start',ini:'GS',rail:'Start',tile:'Start',title:'Getting Started',over:'Getting started',c:'#CDD3EE',d:'#3B4170',icon:'start'},
 {id:'calendar',ini:'CA',rail:'Calendar',tile:'Calendar',title:'Calendar',over:'Calendar',sub:'Every date that matters — any month, any year',c:'#FCE3A3',d:'#7A5C0E',icon:'cal',
  tabs:[['month','Month view'],['upcoming','Upcoming'],['past','Past dates']],
  fields:[{k:'date',l:'Date',t:'date',req:1,half:1,def:'today'},{k:'time',l:'Time',t:'time',half:1,opt:1},{k:'what',l:'What',t:'text',req:1,ph:'Picture day, staff meeting, Ava\u2019s birthday…'},
   {k:'type',l:'Type',t:'pick',opts:['Holiday / No school','Meeting','Event','Birthday','Due','Other']},{k:'notes',l:'Notes',t:'long',opt:1}],
  title_:function(f){return f.what;},meta:function(f){return [fmtT(f.time),f.notes&&first(f.notes,70)].filter(Boolean).join(' · ');},tag:function(f){return f.type;},side:function(f){return fmtD(f.date);}},
 {id:'weekly',ini:'WP',rail:'Weekly',tile:'Weekly Plan',title:'Weekly Plan',over:'Weekly plan',sub:'One week at a time — tap a day to plan it',c:'#CFE5C6',d:'#3E6B35',icon:'week',
  fields:[{k:'weekOf',l:'Week of (Monday)',t:'date',req:1,half:1},{k:'day',l:'Day',t:'select',half:1,req:1,opts:['Monday','Tuesday','Wednesday','Thursday','Friday']},{k:'theme',l:'Theme / letter',t:'text',ph:'Fall leaves · Letter L'},
   {k:'plan',l:'Plan',t:'long',ph:'Circle, centers, small groups, specials…'},{k:'notes',l:'Notes',t:'long',opt:1}]},
 {id:'schedule',ini:'MS',rail:'Schedule',tile:'My Schedule',title:'My Schedule',over:'My schedule',sub:'My day, block by block',c:'#F9CDB8',d:'#94492A',icon:'clock',
  tabs:[['today','Today'],['all','Every block']],
  fields:[{k:'start',l:'Starts',t:'time',req:1,half:1},{k:'end',l:'Ends',t:'time',half:1,opt:1},{k:'what',l:'What I do',t:'text',req:1,ph:'Arrival & breakfast, circle, centers…'},{k:'where',l:'Where',t:'text',opt:1,ph:'Room 4, cafeteria, playground'},
   {k:'kids',l:'Kids I am with',t:'kids',opt:1},{k:'days',l:'Days',t:'days',opt:1,hint:'Leave all off for every day'},{k:'notes',l:'Notes',t:'long',opt:1}],
  title_:function(f){return f.what;},meta:function(f){return [f.where,(f.kids||[]).join(', ')].filter(Boolean).join(' · ');},side:function(f){return fmtT(f.start)+(f.end?' – '+fmtT(f.end):'');},tag:function(f){return f.days&&f.days.length&&f.days.length<5?f.days.join(' '):'';}},
 {id:'students',ini:'SN',rail:'Students',tile:'Students',title:'Student Notes',over:'Student notes',sub:'One profile per child — first names only',c:'#F7C6BA',d:'#7A3A2C',icon:'users',
  fields:[{k:'name',l:'First name',t:'text',req:1,half:1,ph:'First name only'},{k:'bday',l:'Birthday',t:'date',half:1,opt:1},{k:'pickup',l:'Grown-ups & pickup',t:'long',opt:1},{k:'care',l:'Allergies / care',t:'long',opt:1},
   {k:'loves',l:'Strengths & loves',t:'long',opt:1},{k:'helps',l:'What helps them',t:'long',opt:1},{k:'goals',l:'Goals I support',t:'long',opt:1},{k:'notes',l:'Notes',t:'long',opt:1}],
  title_:function(f){return f.name;},meta:function(f){return [f.bday&&('Birthday '+fmtMD(f.bday)),f.care&&('Care: '+first(f.care,50)),!f.care&&f.helps&&('Helps: '+first(f.helps,50))].filter(Boolean).join(' · ');}},
 {id:'iep',ini:'IE',rail:'IEP',tile:'IEP Notes',title:'Goals & IEP Notes',over:'IEP notes',sub:'Quick, dated notes on the goals you support',c:'#E2D2F4',d:'#5E3A85',icon:'target',childFilter:1,
  fields:[{k:'date',l:'Date',t:'date',req:1,def:'today'},{k:'child',l:'Child',t:'child',req:1},{k:'goal',l:'Goal',t:'text',req:1,ph:'Uses 2-word phrases to request'},{k:'saw',l:'What I saw',t:'long'},{k:'progress',l:'Progress',t:'pick',opts:['Not yet','Emerging','Getting there','Got it!']}],
  title_:function(f){return f.child+' — '+f.goal;},meta:function(f){return first(f.saw,80);},tag:function(f){return f.progress;},side:function(f){return fmtD(f.date);}},
 {id:'behavior',ini:'BH',rail:'Behavior',tile:'Behavior',title:'Behavior (ABC Log)',over:'Behavior',sub:'Before, behavior, after — facts only',c:'#F6C6DA',d:'#8E3560',icon:'smile',childFilter:1,
  fields:[{k:'date',l:'Date',t:'date',req:1,half:1,def:'today'},{k:'time',l:'Time',t:'time',half:1,def:'now'},{k:'child',l:'Child',t:'child',req:1},{k:'a',l:'Before (A)',t:'long',ph:'What was happening right before?'},{k:'b',l:'Behavior (B)',t:'long',req:1,ph:'What did the child do? Facts only.'},{k:'c',l:'After (C)',t:'long',ph:'What happened right after?'},{k:'notes',l:'Notes',t:'long',opt:1}],
  title_:function(f){return f.child+' — '+first(f.b,60);},meta:function(f){return f.a?'Before: '+first(f.a,70):'';},side:function(f){return fmtD(f.date)+(f.time?' · '+fmtT(f.time):'');}},
 {id:'care',ini:'CL',rail:'Care',tile:'Care Log',title:'Toileting & Care Log',over:'Care log',sub:'Toileting, meals, naps and care — dated and timed',c:'#FBD3AE',d:'#8F4F1A',icon:'drop',childFilter:1,
  fields:[{k:'date',l:'Date',t:'date',req:1,half:1,def:'today'},{k:'time',l:'Time',t:'time',half:1,def:'now'},{k:'child',l:'Child',t:'child',req:1},{k:'type',l:'Type',t:'pick',req:1,opts:CARE_TYPES},{k:'by',l:'Changed / helped by',t:'text',opt:1},{k:'notes',l:'Notes',t:'long',opt:1}],
  title_:function(f){return f.child+' — '+f.type;},meta:function(f){return [f.by&&('By '+f.by),first(f.notes,70)].filter(Boolean).join(' · ');},side:function(f){return fmtD(f.date)+(f.time?' · '+fmtT(f.time):'');}},
 {id:'centers',ini:'CE',rail:'Centers',tile:'Centers',title:'Centers & Themes',over:'Centers',sub:'Plan centers and check off prep',c:'#DDEBB8',d:'#4E6A1F',icon:'blocks',checkKey:'prepped',
  fields:[{k:'weekOf',l:'Week of (Monday)',t:'date',req:1,half:1},{k:'theme',l:'Theme',t:'text',half:1,opt:1},{k:'center',l:'Center',t:'pick',req:1,opts:['Art','Blocks','Dramatic play','Library','Sensory','Writing','Math','Science','Small group','Other']},
   {k:'activity',l:'Activity',t:'long',req:1},{k:'materials',l:'Materials',t:'long',opt:1},{k:'prepped',l:'Prepped',t:'check'}],
  title_:function(f){return f.center+' — '+first(f.activity,60);},meta:function(f){return f.materials?'Materials: '+first(f.materials,70):'';},tag:function(f){return f.theme;}},
 {id:'comm',ini:'PC',rail:'Comm.',tile:'Comm. Log',title:'Communication Log',over:'Parent & communication',sub:'Lead teacher, parents, nurse, office',c:'#BFE6D8',d:'#2C6B55',icon:'chat',childFilter:1,checkKey:'done',
  tabs:[['all','All'],['open','Needs follow-up']],
  fields:[{k:'date',l:'Date',t:'date',req:1,half:1,def:'today'},{k:'how',l:'How',t:'select',half:1,opts:['In person','Note home','Email','Phone','Seesaw / app']},{k:'with',l:'With',t:'pick',req:1,opts:['Lead teacher','Parent','Nurse','Office / admin','Therapist','Other']},
   {k:'child',l:'Child',t:'child',opt:1},{k:'about',l:'About',t:'long',req:1},{k:'follow',l:'Follow-up',t:'long',opt:1},{k:'done',l:'Follow-up done',t:'check'}],
  title_:function(f){return f.with+(f.child?' — '+f.child:'');},meta:function(f){return first(f.about,80);},tag:function(f){return f.how;},side:function(f){return fmtD(f.date);}},
 {id:'meetings',ini:'ME',rail:'Meetings',tile:'Meetings',title:'Meetings',over:'Meetings',sub:'Staff, team, IEP and trainings',c:'#CBD3F3',d:'#3D4A92',icon:'meet',checkKey:'done',
  fields:[{k:'date',l:'Date',t:'date',req:1,half:1,def:'today'},{k:'type',l:'Type',t:'select',half:1,opts:['Staff','Team / PLC','IEP','Training / PD','Other']},{k:'title',l:'Meeting',t:'text',opt:1,ph:'e.g. Preschool team meeting'},
   {k:'points',l:'Key points',t:'long'},{k:'dates',l:'Dates to remember',t:'long',opt:1},{k:'todos',l:'My to-dos',t:'long',opt:1},{k:'done',l:'All done',t:'check'}],
  title_:function(f){return f.title||(f.type?f.type+' meeting':'Meeting');},meta:function(f){return first(f.points,80);},tag:function(f){return f.type;},side:function(f){return fmtD(f.date);}},
 {id:'sub',ini:'SE',rail:'Sub',tile:'Sub & Emergency',title:'Sub & Emergency',over:'Sub & emergency',sub:'Everything a sub needs for your role, ready before you need it',c:'#F4C2C9',d:'#8C3341',icon:'aid',
  fields:[{k:'topic',l:'Topic',t:'text',req:1},{k:'details',l:'Details',t:'long',ph:'Write it the way you would explain it to a sub.'}],
  title_:function(f){return f.topic;},meta:function(f){return f.details?first(f.details,90):'Tap to fill in';}},
 {id:'todo',ini:'TD',rail:'To-Do',tile:'To-Do',title:'To-Do & Supplies',over:'To-do',sub:'Check it off and it moves to Done',c:'#C6E2F5',d:'#2A6283',icon:'todo',checkKey:'done',
  tabs:[['open','To do'],['done','Done']],
  fields:[{k:'item',l:'Item',t:'text',req:1,ph:'Laminate name tags, get glue sticks…'},{k:'kind',l:'Kind',t:'pick',opts:['To-do','Supply to get','Prep','Copies']},{k:'due',l:'Due',t:'date',opt:1},{k:'done',l:'Done',t:'check'}],
  title_:function(f){return f.item;},meta:function(f){return '';},tag:function(f){return f.kind&&f.kind!=='To-do'?f.kind:'';},side:function(f){return f.due?'Due '+fmtD(f.due):'';}},
 {id:'well',ini:'WB',rail:'Well.',tile:'Wellbeing',title:'Wellbeing',over:'Wellbeing',sub:'Three good things and a mood, on the days you can',c:'#C9EBD2',d:'#2F6E3C',icon:'heart',
  fields:[{k:'date',l:'Date',t:'date',req:1,def:'today'},{k:'mood',l:'Mood',t:'mood'},{k:'g1',l:'Good thing 1',t:'text'},{k:'g2',l:'Good thing 2',t:'text',opt:1},{k:'g3',l:'Good thing 3',t:'text',opt:1},
   {k:'drain',l:'What drained me',t:'long',opt:1},{k:'no',l:'I will say no to',t:'long',opt:1}],
  title_:function(f){return fmtLong(f.date);},meta:function(f){return [f.g1,f.g2,f.g3].filter(Boolean).join(' · ');}},
 {id:'index',ini:'IX',rail:'Index',tile:'Index',title:'Index',over:'Every page',sub:'Tap any entry to jump straight to that page',c:'#D9CFF2',d:'#5B4B8A',icon:'list'}
];
var SM={};S.forEach(function(s){SM[s.id]=s;});
var HOME={id:'home',ini:'',rail:'Home',title:'Teacher Dashboard',over:'Home',sub:'Your command center — tap any tile to jump in',c:'#BFE3D6',d:'#2C6B55',icon:'grid'};
var RAIL=['start','calendar','weekly','schedule','students','iep','behavior','care','centers','comm','meetings','sub','todo','well','index'];
var TILES=['start','students','centers','iep','calendar','care','comm','meetings','weekly','behavior','schedule','todo','sub','well','index'];
function rowColor(c){return mix(c,'#ffffff',.22);}
function mix(a,b,t){var x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16);function ch(s){return Math.round(((x>>s)&255)*(1-t)+((y>>s)&255)*t);}return '#'+((1<<24)+(ch(16)<<16)+(ch(8)<<8)+ch(0)).toString(16).slice(1);}
function vars(s){return '--c:'+s.c+';--d:'+s.d+';--row:'+rowColor(s.c)+';';}

/* ---------- local store + sync ---------- */
var DB={},OUT=[],UI={};
try{DB=JSON.parse(localStorage.getItem(LSDB)||'{}')||{};}catch(e){DB={};}
try{OUT=JSON.parse(localStorage.getItem(LSOUT)||'[]')||[];}catch(e){OUT=[];}
try{UI=JSON.parse(localStorage.getItem(LSUI)||'{}')||{};}catch(e){UI={};}
function persist(){try{localStorage.setItem(LSDB,JSON.stringify(DB));localStorage.setItem(LSOUT,JSON.stringify(OUT));}catch(e){}}
function saveUI(){try{localStorage.setItem(LSUI,JSON.stringify(UI));}catch(e){}}
function mine(d){return d&&typeof d.id==='string'&&d.id.indexOf('prek_')===0&&d.kind==='prek';}
function api(fn,args){return fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({k:K,fn:fn,args:args||[]})})
 .then(function(r){return r.json();}).then(function(j){if(!j.ok){if(j.e==='locked'){locked=true;render();}throw j.e;}return j.r;});}
var locked=false,loaded=false,flushing=false,retryT=null,loadingP=null;
function setSync(s){var el=$('#sync');if(!el)return;el.className='sync'+(s==='busy'?' busy':s==='off'?' off':'');
 el.querySelector('span').textContent=s==='busy'?'saving…':s==='off'?'offline – will retry':s==='load'?'syncing…':'saved';if(s==='load')el.classList.add('busy');}
function applyOp(o){if(o.op==='put')DB[o.item.id]=o.item;else delete DB[o.id];}
function save(doc,quiet){doc.kind='prek';if(!doc.created)doc.created=Date.now();doc.updated=Date.now();var c=JSON.parse(JSON.stringify(doc));
 applyOp({op:'put',item:c});OUT=OUT.filter(function(o,i){return (i===0&&flushing)||!(o.op==='put'&&o.item.id===c.id);});OUT.push({op:'put',item:c});persist();if(!quiet)render();flush();return c;}
function removeDoc(id){applyOp({op:'del',id:id});OUT=OUT.filter(function(o,i){return (i===0&&flushing)||!(o.op==='put'&&o.item.id===id);});OUT.push({op:'del',id:id});persist();render();flush();}
function flush(){if(flushing||!K||locked)return;if(!OUT.length){setSync('ok');return;}flushing=true;setSync('busy');var o=OUT[0];
 var p=o.op==='put'?api('put',[COL,o.item]):api('del',[COL,o.id]);
 p.then(function(){OUT.shift();persist();flushing=false;flush();})
  .catch(function(e){flushing=false;setSync('off');clearTimeout(retryT);retryT=setTimeout(flush,15000);console.warn('save failed',e);});}
function load(){if(!K)return Promise.resolve();if(loadingP)return loadingP;setSync('load');
 loadingP=api('list',[COL]).then(function(r){var n={};(r||[]).forEach(function(d){if(mine(d))n[d.id]=d;});DB=n;OUT.forEach(applyOp);persist();loaded=true;locked=false;loadingP=null;
  if(!$('#sheet.on'))render();setSync(OUT.length?'busy':'ok');flush();})
 .catch(function(e){loadingP=null;setSync('off');if(e!=='locked')toast('Showing your saved copy — I’ll sync when I can');});return loadingP;}
window.addEventListener('online',flush);
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&K&&!flushing&&!OUT.length&&!$('#sheet.on'))load();});

function docs(sec){var a=[];for(var id in DB){var d=DB[id];if(d.sec===sec&&!d.hidden)a.push(d);}return a;}
function students(){return docs('students').map(function(d){return d.f.name;}).filter(Boolean).sort(function(a,b){return a.localeCompare(b);});}
function dashDoc(){return DB.prek_dash||{id:'prek_dash',sec:'dash',f:{}};}

/* ---------- routing ---------- */
function route(){var h=(location.hash||'').replace(/^#\/?/,'').split('/');return {sec:h[0]||'home',sub:h[1]||'',arg:decodeURIComponent(h[2]||'')};}
function go(h){if(location.hash==='#'+h)render();else location.hash=h;}
window.addEventListener('hashchange',function(){closeSheet(true);render();window.scrollTo(0,0);});

/* ---------- rail ---------- */
function rail(cur){var h='<a class="rl'+(cur==='home'?' on':'')+'" href="#home" style="'+vars({c:'#D9CFF2',d:'#5B4B8A'})+'" aria-label="Home dashboard"><span class="ci">'+ic('home')+'</span><b>Home</b></a>';
 RAIL.forEach(function(id){var s=SM[id];h+='<a class="rl'+(cur===id?' on':'')+'" href="#'+id+'" style="'+vars(s)+'" title="'+esc(s.title)+'"><span class="ci">'+s.ini+'</span><b>'+esc(s.rail)+'</b></a>';});
 var r=$('#rail');r.innerHTML=h;var on=$('.rl.on',r);if(on&&window.innerWidth<=700){var x=on.offsetLeft-r.clientWidth/2+on.offsetWidth/2;r.scrollLeft=Math.max(0,x);}}

function banner(s,subOverride,pill){var p=pill||'<a class="pill" href="#home">'+ic('home')+'<span class="pl">Dashboard</span></a>';
 return '<header class="banner"><div class="badge">'+(s.id==='home'?ic('grid'):s.ini)+'</div><div class="btxt"><div class="over">'+esc(s.over)+'</div><h1>'+esc(s.title)+'</h1><p>'+esc(subOverride||s.sub||'')+'</p></div>'+p+'</header>';}

/* ---------- render ---------- */
var _tNote=null;
function render(){var r=route(),pg=$('#page');
 if(!K||locked){rail('home');pg.setAttribute('style',vars(HOME));pg.className='';pg.innerHTML=lockView();bindLock();return;}
 var s=r.sec==='home'?HOME:SM[r.sec];if(!s){s=HOME;r.sec='home';}
 rail(r.sec);pg.setAttribute('style',vars(s));pg.className=r.sec==='home'?'':'sec';
 var keepFocus=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('.note');
 if(r.sec==='home'){if(keepFocus)return;pg.innerHTML=dashboard();return;}
 if(r.sec==='index'){pg.innerHTML=banner(s)+'<section class="card">'+indexView()+'</section>';return;}
 pg.innerHTML=banner(s,subLine(s,r))+'<section class="card">'+secView(s,r)+'</section>';
 document.title=s.title+' · Pre-K Planner';}

function subLine(s,r){if(s.id==='start')return '5 pages in this section — tap any to open it';
 var n=docs(s.id).length;if(s.id==='sub')return s.sub;if(!n)return s.sub;return s.sub+' · '+n+(n===1?' entry':' entries');}

function lockView(){return banner(HOME,'Open your install link once to unlock this device','')+
 '<section class="card"><div class="lock"><h1>Welcome, Kenzi 🍎</h1><p>This planner is private. Open the install link Hark sent you once on this device, or type your planner code below.</p>'+
 '<div class="fld" style="text-align:left;margin:14px 0"><span>Planner code</span><input type="text" id="lockin" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="planner code"></div>'+
 '<button class="btn pri" id="lockbtn" style="width:100%">Unlock</button></div></section>';}
function bindLock(){var b=$('#lockbtn');if(!b)return;var g=function(){var v=$('#lockin').value.trim();if(v){K=v;localStorage.setItem(LSK,v);locked=false;render();load();}};b.onclick=g;$('#lockin').onkeydown=function(e){if(e.key==='Enter')g();};}

/* ---------- dashboard ---------- */
function tileCount(id){var a;switch(id){
 case 'students':a=docs('students').length;return a?a+(a===1?' child':' children'):'';
 case 'todo':a=docs('todo').filter(function(d){return !d.f.done;}).length;return a?a+' open':'';
 case 'calendar':var t=today(),e=addDays(t,7);a=docs('calendar').filter(function(d){return d.f.date>=t&&d.f.date<=e;}).length;return a?a+' this week':'';
 case 'comm':a=docs('comm').filter(function(d){return d.f.follow&&!d.f.done;}).length;return a?a+' to follow up':'';
 case 'care':a=docs('care').filter(function(d){return d.f.date===today();}).length;return a?a+' today':'';
 case 'behavior':a=docs('behavior').filter(function(d){return d.f.date===today();}).length;return a?a+' today':'';
 case 'centers':a=docs('centers').filter(function(d){return d.f.weekOf===monday()&&!d.f.prepped;}).length;return a?a+' to prep':'';
 }return '';}
function dashboard(){var D=dashDoc().f||{},t3=D.top||[{},{},{}];
 var h=banner(HOME,null,'<a class="pill" href="#index">'+ic('list')+'<span class="pl">Index</span></a>')+'<div class="dash"><div class="tiles">';
 TILES.forEach(function(id){var s=SM[id],c=tileCount(id);h+='<a class="tile" href="#'+id+'" style="'+vars(s)+'"><span class="ic">'+ic(s.icon)+'</span><b>'+esc(s.tile)+'</b>'+(c?'<span class="cnt">'+esc(c)+'</span>':'')+'<i class="td"></i></a>';});
 h+='</div><div class="notes">'+
  '<div class="note"><span class="nl">This School Year</span><input type="text" data-note="year" placeholder="2026 – 2027" value="'+esc(D.year)+'"><input type="text" data-note="klass" placeholder="Grade / class · room" value="'+esc(D.klass)+'"></div>'+
  '<div class="note"><span class="nl">Today\u2019s Top 3 Priorities</span>';
 for(var i=0;i<3;i++){var x=t3[i]||{};h+='<div class="t3'+(x.done?' done':'')+'"><button class="ck'+(x.done?' on':'')+'" data-top="'+i+'" aria-label="Done">'+ic('check',3)+'</button><input type="text" data-note="top'+i+'" placeholder="'+(i+1)+'." value="'+esc(x.t)+'"></div>';}
 h+='</div><div class="note"><label for="n-focus">Weekly Focus</label><textarea id="n-focus" data-note="focus" rows="2" placeholder="This week I\u2019m focusing on…">'+esc(D.focus)+'</textarea></div>'+
  '<div class="note"><label for="n-rem">Important Reminders</label><textarea id="n-rem" data-note="reminders" rows="3" placeholder="Picture day forms, fire drill Thursday…">'+esc(D.reminders)+'</textarea></div>'+
  '<div class="note quote"><label for="n-q">Teacher Inspiration</label><textarea id="n-q" data-note="quote" rows="2">'+esc(D.quote==null?'\u201CThe best way to predict the future is to create it.\u201D':D.quote)+'</textarea></div>'+
  '</div></div>';
 return h;}
function noteSaveSoon(){clearTimeout(_tNote);_tNote=setTimeout(noteSave,700);}
function noteSave(){clearTimeout(_tNote);var d=dashDoc(),f=d.f=d.f||{},top=[];
 $$('[data-note]').forEach(function(el){var k=el.getAttribute('data-note');if(/^top\d$/.test(k))return;f[k]=el.value;});
 for(var i=0;i<3;i++){var el=$('[data-note=top'+i+']');var old=(f.top||[])[i]||{};top.push({t:el?el.value:(old.t||''),done:!!old.done});}
 f.top=top;save(d,true);}

/* ---------- index ---------- */
function pagesOf(s){var P=[];function p(l,h){P.push([l,h]);}
 switch(s.id){
 case 'start':START.forEach(function(x,i){p(x[0],'start/p/'+i);});break;
 case 'calendar':p('Month view','calendar/month');p('Upcoming dates','calendar/upcoming');p('Past dates','calendar/past');p('Add a date','calendar/new');break;
 case 'weekly':p('This week','weekly');p('Next week','weekly/w/'+addDays(monday(),7));p('Add a day plan','weekly/new');break;
 case 'schedule':p('Today','schedule/today');p('Every block','schedule/all');p('Add a time block','schedule/new');break;
 case 'students':docs('students').sort(byName).forEach(function(d){p(d.f.name,'students/e/'+d.id);});p('Add a student','students/new');break;
 case 'sub':subTopics().forEach(function(d){p(d.f.topic,'sub/e/'+d.id);});p('Add a topic','sub/new');p('Print for a sub','sub/print');break;
 case 'todo':p('To do','todo/open');p('Done','todo/done');p('Add a to-do','todo/new');break;
 case 'comm':p('All notes','comm/all');p('Needs follow-up','comm/open');p('Log a conversation','comm/new');break;
 case 'care':p('Care log','care');CARE_TYPES.slice(0,4).forEach(function(t){p('Quick log: '+t,'care/quick/'+encodeURIComponent(t));});break;
 case 'iep':p('All IEP notes','iep');p('Add an IEP note','iep/new');break;
 case 'behavior':p('ABC log','behavior');p('Add a behavior entry','behavior/new');break;
 case 'centers':p('All centers','centers');p('Plan a center','centers/new');break;
 case 'meetings':p('All meetings','meetings');p('Add meeting notes','meetings/new');break;
 case 'well':p('My check-ins','well');p('Check in today','well/new');break;
 }return P;}
function byName(a,b){return String(a.f.name||'').localeCompare(String(b.f.name||''));}
function indexView(){var h='<div class="idx">';RAIL.filter(function(id){return id!=='index';}).forEach(function(id){var s=SM[id];
 h+='<div class="ib" style="'+vars(s)+'"><a class="ih" href="#'+id+'"><i class="dot"></i>'+esc(s.title)+'</a><ul>';
 pagesOf(s).forEach(function(x){h+='<li><a href="#'+x[1]+'">'+esc(x[0])+'</a></li>';});h+='</ul></div>';});return h+'</div>';}

/* ---------- section views ---------- */
function rowHtml(s,d,opts){opts=opts||{};var f=d.f||{},ck=s.checkKey,t=(s.title_?s.title_(f):'')||'(untitled)',m=s.meta?s.meta(f):'',tg=s.tag?s.tag(f):'',sd=s.side?s.side(f):'';
 var lead=ck?'<button class="ck'+(f[ck]?' on':'')+'" data-tog="'+d.id+'" aria-label="Mark done">'+ic('check',3)+'</button>':
  opts.av?'<span class="av">'+esc((f.name||'?').charAt(0).toUpperCase())+'</span>':opts.mood?'<span class="mood">'+(f.mood||'🌿')+'</span>':'<i class="dot"></i>';
 return '<div class="row'+(ck&&f[ck]?' done':'')+(opts.now?' now':'')+'" data-edit="'+d.id+'" role="button" tabindex="0">'+lead+'<span class="rt"><b>'+esc(t)+(tg?'<span class="tag">'+esc(tg)+'</span>':'')+'</b>'+(m?'<small>'+esc(m)+'</small>':'')+(sd?'<small class="ms">'+esc(sd)+'</small>':'')+'</span>'+(sd?'<span class="side">'+esc(sd)+'</span>':'')+'<span class="chev">›</span></div>';}
function addBtn(s,label,preset){return '<button class="add" data-new="'+s.id+'"'+(preset?' data-preset="'+esc(JSON.stringify(preset))+'"':'')+'>'+ic('plus',2.5)+esc(label||'Add')+'</button>';}
function tabsHtml(s,cur){if(!s.tabs)return '';return '<div class="tabs">'+s.tabs.map(function(t){return '<button class="'+(t[0]===cur?'on':'')+'" data-go="'+s.id+'/'+t[0]+'">'+esc(t[1])+'</button>';}).join('')+'</div>';}
function emptyHtml(t,sub){return '<div class="empty"><b>'+esc(t)+'</b>'+esc(sub||'')+'</div>';}
function childChips(s){var st=students();if(!st.length)return '';var cur=UI['cf_'+s.id]||'';if(cur&&st.indexOf(cur)<0)cur='';
 return '<div class="chips"><button class="chip'+(!cur?' on':'')+'" data-cf="'+s.id+'|">All kids</button>'+st.map(function(n){return '<button class="chip'+(cur===n?' on':'')+'" data-cf="'+s.id+'|'+esc(n)+'">'+esc(n)+'</button>';}).join('')+'</div>';}
function byDateDesc(a,b){var x=(b.f.date||b.f.weekOf||'')+(b.f.time||''),y=(a.f.date||a.f.weekOf||'')+(a.f.time||'');return x<y?-1:x>y?1:(b.created||0)-(a.created||0);}

function secView(s,r){var sub=r.sub;
 if(sub==='new'||sub==='quick'||sub==='e'||sub==='print'){var act=sub,arg=r.arg;setTimeout(function(){
   if(act==='new')openForm(s.id,null,{});else if(act==='quick')openForm(s.id,null,{type:arg});else if(act==='e')openForm(s.id,arg);else if(act==='print')printSub();
   try{history.replaceState(null,'','#'+s.id);}catch(e){}},30);sub='';}
 switch(s.id){
 case 'start':return startView(r);
 case 'calendar':return calView(s,sub||UI.calTab||'month',r);
 case 'weekly':return weekView(s,sub==='w'?r.arg:'');
 case 'schedule':return schedView(s,sub||'today');
 case 'students':return studentsView(s);
 case 'sub':return subView(s);
 case 'todo':return todoView(s,sub||'open');
 case 'well':return listView(s,docs(s.id).sort(byDateDesc),'Add a check-in',{mood:1},'No check-ins yet','Tap “Check in” on any day — a mood and one good thing is plenty.');
 case 'centers':return centersView(s);
 case 'comm':return commView(s,sub||'all');
 default:return listView(s,filt(s,docs(s.id)).sort(byDateDesc),null,null,'Nothing here yet','Tap “Add” to make your first entry.');}}
function filt(s,a){var cf=UI['cf_'+s.id];if(s.childFilter&&cf&&students().indexOf(cf)>=0)a=a.filter(function(d){return d.f.child===cf||(d.f.kids||[]).indexOf(cf)>=0;});return a;}
function listView(s,arr,label,opts,et,es){var h='<div class="bar">'+addBtn(s,label||'Add')+'<span class="grow"></span>'+(s.id==='care'?'':'')+'</div>';
 if(s.id==='care'){h='<div class="bar">'+addBtn(s,'Add')+'<span class="hint">Quick log:</span>'+['Dry','Wet','BM','Accident','Meal / snack','Nap'].map(function(t){return '<button class="chip" data-new="care" data-preset="'+esc(JSON.stringify({type:t}))+'">'+esc(t)+'</button>';}).join('')+'</div>';}
 if(s.childFilter)h+=childChips(s);
 if(!arr.length)return h+emptyHtml(et,es);
 return h+arr.map(function(d){return rowHtml(s,d,opts);}).join('');}

var START=[
 ['Welcome','<h3>Welcome to your Pre-K Para Planner</h3><p>Everything for your day in one place: your schedule, the kids you support, care and behavior logs, notes for the lead teacher and parents, and a sub binder that is ready before you need it.</p><p>It is undated, so it works every school year.</p>'],
 ['How to use','<h3>How to use it</h3><ol><li>Tap a tile on the <b>Dashboard</b>, or a circle on the side (on your phone, the strip at the top).</li><li>Tap <b>+ Add</b> in any section to make an entry. Tap any row to change it or delete it.</li><li>Add your kids in <b>Students</b> first. Their names then show up as buttons in IEP Notes, Behavior, Care Log and Communication.</li><li>Type straight into the notes on the Dashboard. They save on their own.</li></ol>'],
 ['Add to Home Screen','<h3>Put it on your Home Screen</h3><p><b>iPhone:</b> open your install link in Safari, tap the Share button, then <b>Add to Home Screen</b>. It opens like an app, called “Pre-K Planner”.</p><p><b>Mac:</b> in Safari choose File → <b>Add to Dock</b>, or just bookmark the page.</p><p>Your phone and Mac stay in sync: what you add on one shows up on the other.</p>'],
 ['Privacy & first names','<h3>Keep it private</h3><p>Use <b>first names only</b> for students, and keep medical or IEP details brief and factual. The planner needs your private code to open, and your entries are saved in your own planner storage, not in the page itself.</p><p>Follow your school\u2019s rules for what you write down.</p>'],
 ['Sync & backup','__sync__']];
function startView(r){var i=r.sub==='p'?+r.arg:-1;
 if(i>=0&&START[i]){var c=START[i][1];if(c==='__sync__')c=syncInfo();return '<div class="bar"><button class="ghost" data-go="start">‹ All pages</button></div><div class="info">'+c+'</div>';}
 return START.map(function(x,i){return '<a class="row" href="#start/p/'+i+'"><i class="dot"></i><span class="rt"><b>'+esc(x[0])+'</b></span><span class="chev">›</span></a>';}).join('');}
function syncInfo(){var n=Object.keys(DB).length;return '<h3>Sync & backup</h3><p>'+n+' saved item'+(n===1?'':'s')+' on this device. '+(OUT.length?OUT.length+' change(s) waiting to upload.':'Everything is uploaded.')+'</p>'+
 '<p><button class="btn pri" data-act="syncnow">Sync now</button> &nbsp;<button class="btn" data-act="export">Download a copy</button></p>';}

/* calendar */
function calView(s,tab,r){if(tab!=='month'&&tab!=='upcoming'&&tab!=='past')tab='month';UI.calTab=tab;saveUI();
 var h='<div class="bar">'+tabsHtml(s,tab)+'<span class="grow"></span>'+addBtn(s,'Add a date',UI.calSel?{date:UI.calSel}:null)+'</div>',all=docs('calendar');
 if(tab!=='month'){var t=today(),a=all.filter(function(d){return tab==='upcoming'?d.f.date>=t:d.f.date<t;}).sort(function(x,y){var p=(x.f.date+(x.f.time||'')),q=(y.f.date+(y.f.time||''));return tab==='upcoming'?(p<q?-1:1):(p<q?1:-1);});
  if(!a.length)return h+emptyHtml(tab==='upcoming'?'Nothing coming up':'No past dates','Add picture day, holidays, birthdays and meetings.');
  var lm='';a.forEach(function(d){var m=d.f.date.slice(0,7);if(m!==lm){lm=m;var pdm=pd(d.f.date);h+='<div class="grp">'+MON[pdm.getMonth()]+' '+pdm.getFullYear()+'</div>';}h+=rowHtml(s,d);});return h;}
 var ym=UI.calYM||today().slice(0,7),y=+ym.slice(0,4),m=+ym.slice(5,7)-1,f1=new Date(y,m,1),st=new Date(y,m,1-f1.getDay()),t0=today();
 var by={};all.forEach(function(d){(by[d.f.date]=by[d.f.date]||[]).push(d);});
 h+='<div class="wnav"><button data-cal="-1" aria-label="Previous month">‹</button><b>'+MON[m]+' '+y+'</b><button data-cal="1" aria-label="Next month">›</button><button class="today" data-cal="0">Today</button></div>';
 h+='<div class="month">'+DOW.map(function(x){return '<div class="dow">'+x+'</div>';}).join('');
 for(var i=0;i<42;i++){var d=new Date(st.getFullYear(),st.getMonth(),st.getDate()+i),k=iso(d),ev=(by[k]||[]).sort(function(a,b){return (a.f.time||'')<(b.f.time||'')?-1:1;});
  if(i===35&&d.getMonth()!==m)break;
  h+='<button class="day'+(d.getMonth()!==m?' out':'')+(k===t0?' td':'')+(k===UI.calSel?' sel':'')+'" data-day="'+k+'"><span class="n">'+d.getDate()+'</span>'+
   ev.slice(0,2).map(function(e){return '<span class="ev" style="background:'+(TYPEC[e.f.type]||'')+'">'+esc(e.f.what)+'</span>';}).join('')+(ev.length>2?'<span class="more">+'+(ev.length-2)+' more</span>':'')+
   (ev.length?'<span class="dots">'+ev.slice(0,3).map(function(e){return '<i style="background:'+(TYPEC[e.f.type]?mix(TYPEC[e.f.type],'#000000',.35):'')+'"></i>';}).join('')+'</span>':'')+'</button>';}
 h+='</div>';var sel=UI.calSel;
 if(sel){var de=(by[sel]||[]);h+='<div class="daylist"><div class="grp">'+esc(fmtLong(sel))+'</div>'+(de.length?de.map(function(d){return rowHtml(s,d);}).join(''):'<div class="hint">Nothing on this day yet.</div>')+'<div>'+addBtn(s,'Add to '+fmtMD(sel),{date:sel})+'</div></div>';}
 else h+='<div class="hint">Tap a day to see it or add to it.</div>';
 return h;}

/* weekly */
var DAYS5=['Monday','Tuesday','Wednesday','Thursday','Friday'];
function weekView(s,wk){var w=monday(wk||UI.wk||today());UI.wk=w;saveUI();var a=docs('weekly').filter(function(d){return d.f.weekOf===w;});
 var fri=addDays(w,4),h='<div class="bar"><div class="wnav"><button data-wk="-7" aria-label="Previous week">‹</button><b>Week of '+fmtMD(w)+' – '+fmtMD(fri)+'</b><button data-wk="7" aria-label="Next week">›</button>'+(w!==monday()?'<button class="today" data-wk="0">This week</button>':'')+'</div></div>';
 DAYS5.forEach(function(dn,i){var d=a.filter(function(x){return x.f.day===dn;})[0],dt=addDays(w,i),f=d?d.f:{};
  h+='<div class="row'+(dt===today()?' now':'')+'" '+(d?'data-edit="'+d.id+'"':'data-new="weekly" data-preset="'+esc(JSON.stringify({weekOf:w,day:dn}))+'"')+' role="button" tabindex="0"><i class="dot"></i><span class="rt"><b>'+dn+(f.theme?'<span class="tag">'+esc(f.theme)+'</span>':'')+'</b><small>'+esc(d?(first(f.plan,110)||'—'):'Tap to plan this day')+'</small></span><span class="side">'+fmtMD(dt)+'</span><span class="chev">›</span></div>';});
 return h;}

/* schedule */
function schedView(s,tab){if(tab!=='today'&&tab!=='all')tab='today';var a=docs('schedule').sort(function(x,y){return (x.f.start||'')<(y.f.start||'')?-1:1;}),dn=DOW[new Date().getDay()],nt=nowTime();
 var h='<div class="bar">'+tabsHtml(s,tab)+'<span class="grow"></span>'+addBtn(s,'Add a block')+'</div>';
 if(tab==='today'){a=a.filter(function(d){var ds=d.f.days||[];return !ds.length||ds.indexOf(dn)>=0;});h+='<div class="grp">'+esc(fmtLong(today()))+'</div>';}
 if(!a.length)return h+emptyHtml(tab==='today'?'Nothing scheduled today':'No blocks yet','Add your day block by block: arrival, circle, centers, lunch, recess, nap, dismissal.');
 return h+a.map(function(d){var on=tab==='today'&&d.f.start<=nt&&(d.f.end?nt<d.f.end:false);return rowHtml(s,d,{now:on});}).join('');}

/* students */
function studentsView(s){var a=docs('students').sort(byName),h='<div class="bar">'+addBtn(s,'Add a student')+'<span class="grow"></span><span class="hint">First names only</span></div>';
 if(!a.length)return h+emptyHtml('No students yet','Add each child you support. Their names fill the pickers in IEP Notes, Behavior, Care Log and Communication.');
 return h+a.map(function(d){return rowHtml(s,d,{av:1});}).join('');}

/* sub & emergency: built-in topics have fixed ids so phone and Mac never duplicate them */
function subTopics(){var out=[];SUB_TOPICS.forEach(function(t,i){var id='prek_sub_t'+(i+1),d=DB[id];if(d&&d.hidden)return;out.push(d||{id:id,sec:'sub',f:{topic:t,details:''},builtin:1});});
 docs('sub').forEach(function(d){if(!/^prek_sub_t\d+$/.test(d.id))out.push(d);});return out;}
function subView(s){var h='<div class="bar">'+addBtn(s,'Add a topic')+'<span class="grow"></span><button class="ghost" data-act="print">'+ic('print')+'Print for a sub</button></div>';
 return h+subTopics().map(function(d){return rowHtml(s,d);}).join('');}
function printSub(){var h='<h1>Sub & Emergency Plans</h1>';subTopics().forEach(function(d){h+='<h3>'+esc(d.f.topic)+'</h3><p>'+(d.f.details?esc(d.f.details):'—')+'</p>';});$('#printout').innerHTML=h;window.print();}

/* to-do */
function todoView(s,tab){if(tab!=='open'&&tab!=='done')tab='open';var all=docs('todo'),a=all.filter(function(d){return tab==='done'?!!d.f.done:!d.f.done;});
 a.sort(function(x,y){if(tab==='done')return (y.f.doneAt||y.updated||0)-(x.f.doneAt||x.updated||0);var p=x.f.due||'9999',q=y.f.due||'9999';return p<q?-1:p>q?1:(x.created||0)-(y.created||0);});
 var h='<div class="bar">'+tabsHtml(s,tab)+'<span class="grow"></span>'+(tab==='done'&&a.length?'<button class="ghost" data-act="cleardone">Clear done</button>':'')+addBtn(s,'Add a to-do')+'</div>';
 if(!a.length)return h+emptyHtml(tab==='done'?'Nothing checked off yet':'All caught up!',tab==='done'?'':'Add prep, copies and supplies to get.');
 return h+a.map(function(d){return rowHtml(s,d);}).join('');}

/* centers */
function centersView(s){var a=docs('centers').sort(byDateDesc),h='<div class="bar">'+addBtn(s,'Plan a center',{weekOf:monday()})+'</div>';
 if(!a.length)return h+emptyHtml('No centers planned yet','Plan each center for the week and check it off when it is prepped.');
 var lw='';a.forEach(function(d){if(d.f.weekOf!==lw){lw=d.f.weekOf;h+='<div class="grp">Week of '+esc(fmtMD(lw))+(lw===monday()?' · this week':'')+'</div>';}h+=rowHtml(s,d);});return h;}

/* communication */
function commView(s,tab){if(tab!=='all'&&tab!=='open')tab='all';var a=filt(s,docs('comm'));if(tab==='open')a=a.filter(function(d){return d.f.follow&&!d.f.done;});a.sort(byDateDesc);
 var h='<div class="bar">'+tabsHtml(s,tab)+'<span class="grow"></span>'+addBtn(s,'Log a conversation')+'</div>'+childChips(s);
 if(!a.length)return h+emptyHtml(tab==='open'?'No follow-ups waiting':'No conversations logged yet','Jot down notes home, calls and chats with the lead teacher.');
 return h+a.map(function(d){return rowHtml(s,d);}).join('');}

/* ---------- forms ---------- */
var FORM=null;
function defVal(fl){if(fl.def==='today')return today();if(fl.def==='now')return nowTime();if(fl.t==='kids'||fl.t==='days')return [];if(fl.t==='check')return false;return '';}
function openForm(secId,id,preset){var s=SM[secId];if(!s||!s.fields)return;var doc=id?(DB[id]||(secId==='sub'?subTopics().filter(function(d){return d.id===id;})[0]:null)):null;
 if(id&&!doc){toast('That entry was removed');return;}
 var f={};s.fields.forEach(function(fl){f[fl.k]=doc&&doc.f[fl.k]!=null?doc.f[fl.k]:defVal(fl);});
 if(!doc){if(s.id==='weekly'&&!preset.weekOf)f.weekOf=UI.wk||monday();if(s.id==='weekly'&&!preset.day){var di=(new Date().getDay()+6)%7;f.day=DAYS5[Math.min(di,4)];}
  if(s.id==='centers'&&!preset.weekOf)f.weekOf=monday();if(s.childFilter&&UI['cf_'+s.id])f.child=UI['cf_'+s.id];
  for(var k in preset)f[k]=preset[k];}
 FORM={s:s,id:doc?doc.id:null,doc:doc,f:f};
 var title=doc?(s.id==='students'?f.name:s.id==='sub'?f.topic:'Edit · '+s.title):(s.id==='students'?'New student':'New · '+s.title);
 var h='<div class="sh-h" style="'+vars(s)+'"><div class="badge">'+s.ini+'</div><h2>'+esc(title)+'</h2><button class="x" data-act="close" aria-label="Close">×</button></div><div class="sh-b" style="'+vars(s)+'">';
 if(doc&&s.id==='students')h+=kidLinks(f.name);
 var fl=s.fields,i=0;while(i<fl.length){if(fl[i].half&&fl[i+1]&&fl[i+1].half){h+='<div class="two">'+fieldHtml(fl[i],f)+fieldHtml(fl[i+1],f)+'</div>';i+=2;}else{h+=fieldHtml(fl[i],f);i++;}}
 h+='</div><div class="sh-f" style="'+vars(s)+'">'+(doc?'<button class="btn del" data-act="delete">Delete</button>':'')+'<span class="grow"></span><button class="btn" data-act="close">Cancel</button><button class="btn pri" data-act="save">Save</button></div>';
 var sh=$('#sheet');sh.setAttribute('style',vars(s));sh.innerHTML=h;sh.classList.add('on');sh.setAttribute('aria-hidden','false');$('#shade').classList.add('on');document.body.style.overflow='hidden';document.body.classList.add('sheeton');
 if(!doc&&window.innerWidth>700){var fi=$('.sh-b input[type=text],.sh-b textarea',sh);if(fi)setTimeout(function(){fi.focus();},60);}}
function kidLinks(n){var c={iep:0,behavior:0,care:0,comm:0};['iep','behavior','care','comm'].forEach(function(k){c[k]=docs(k).filter(function(d){return d.f.child===n;}).length;});
 return '<div class="chips">'+['iep','behavior','care','comm'].map(function(k){return '<button class="chip" data-kid="'+k+'|'+esc(n)+'">'+esc(SM[k].tile)+' · '+c[k]+'</button>';}).join('')+'</div>';}
function fieldHtml(fl,f){var v=f[fl.k],lab='<span>'+esc(fl.l)+(fl.opt?' <em>(optional)</em>':'')+'</span>',id='f_'+fl.k,h='';
 switch(fl.t){
 case 'text':h='<label class="fld" data-f="'+fl.k+'">'+lab+'<input type="text" id="'+id+'" value="'+esc(v)+'" placeholder="'+esc(fl.ph||'')+'"'+(fl.k==='name'?' autocapitalize="words" autocomplete="off"':'')+'></label>';break;
 case 'long':h='<label class="fld" data-f="'+fl.k+'">'+lab+'<textarea id="'+id+'" rows="3" placeholder="'+esc(fl.ph||'')+'">'+esc(v)+'</textarea></label>';break;
 case 'date':h='<label class="fld" data-f="'+fl.k+'">'+lab+'<input type="date" id="'+id+'" value="'+esc(v)+'"></label>';break;
 case 'time':h='<label class="fld" data-f="'+fl.k+'">'+lab+'<input type="time" id="'+id+'" value="'+esc(v)+'"></label>';break;
 case 'select':h='<label class="fld" data-f="'+fl.k+'">'+lab+'<select id="'+id+'"><option value="">—</option>'+fl.opts.map(function(o){return '<option'+(o===v?' selected':'')+'>'+esc(o)+'</option>';}).join('')+(v&&fl.opts.indexOf(v)<0?'<option selected>'+esc(v)+'</option>':'')+'</select></label>';break;
 case 'pick':h='<div class="fld" data-f="'+fl.k+'">'+lab+'<div class="pick" data-pick="'+fl.k+'">'+fl.opts.map(function(o){return '<button type="button" class="'+(o===v?'on':'')+'" data-val="'+esc(o)+'">'+esc(o)+'</button>';}).join('')+'</div></div>';break;
 case 'mood':h='<div class="fld" data-f="'+fl.k+'">'+lab+'<div class="pick moods" data-pick="'+fl.k+'">'+MOODS.map(function(o){return '<button type="button" class="'+(o===v?'on':'')+'" data-val="'+o+'">'+o+'</button>';}).join('')+'</div></div>';break;
 case 'days':h='<div class="fld" data-f="'+fl.k+'">'+lab+'<div class="pick" data-multi="'+fl.k+'">'+['Mon','Tue','Wed','Thu','Fri'].map(function(o){return '<button type="button" class="'+((v||[]).indexOf(o)>=0?'on':'')+'" data-val="'+o+'">'+o+'</button>';}).join('')+'</div>'+(fl.hint?'<div class="hint">'+esc(fl.hint)+'</div>':'')+'</div>';break;
 case 'child':case 'kids':var st=students();if(v&&fl.t==='child'&&st.indexOf(v)<0)st.push(v);if(fl.t==='kids')(v||[]).forEach(function(n){if(st.indexOf(n)<0)st.push(n);});
  if(!st.length){h='<label class="fld" data-f="'+fl.k+'">'+lab+'<input type="text" id="'+id+'" data-kidtext="'+fl.t+'" value="'+esc(fl.t==='kids'?(v||[]).join(', '):v)+'" placeholder="First name"><div class="hint">Tip: add your kids in Students and their names show up here as buttons.</div></label>';break;}
  h='<div class="fld" data-f="'+fl.k+'">'+lab+'<div class="pick" '+(fl.t==='kids'?'data-multi':'data-pick')+'="'+fl.k+'">'+(fl.t==='kids'?['Whole class','Small group'].concat(st):st.concat(fl.k==='child'&&!fl.req?[]:[])).map(function(n){var on=fl.t==='kids'?(v||[]).indexOf(n)>=0:n===v;return '<button type="button" class="'+(on?'on':'')+'" data-val="'+esc(n)+'">'+esc(n)+'</button>';}).join('')+'</div></div>';break;
 case 'check':h='<div class="fld" data-f="'+fl.k+'"><button type="button" class="cbox" data-cbox="'+fl.k+'"><span class="ck'+(v?' on':'')+'">'+ic('check',3)+'</span>'+esc(fl.l)+'</button></div>';break;}
 return h;}
function readForm(){var s=FORM.s,f=FORM.f,sh=$('#sheet');s.fields.forEach(function(fl){var el=$('#f_'+fl.k,sh);
 if(el){var v=el.value;if(el.getAttribute('data-kidtext')==='kids')v=v.split(',').map(function(x){return x.trim();}).filter(Boolean);else if(typeof v==='string'&&fl.t!=='long')v=v.trim();f[fl.k]=v;}});return f;}
function saveForm(){var s=FORM.s,f=readForm(),bad=[];$$('.fld.err',$('#sheet')).forEach(function(e){e.classList.remove('err');});
 s.fields.forEach(function(fl){var v=f[fl.k];if(fl.req&&(v==null||v===''||(Array.isArray(v)&&!v.length)))bad.push(fl);});
 if(bad.length){bad.forEach(function(fl){var e=$('[data-f="'+fl.k+'"]',$('#sheet'));if(e)e.classList.add('err');});toast('Please fill in: '+bad.map(function(x){return x.l;}).join(', '));return;}
 if(s.id==='weekly'||s.id==='centers')f.weekOf=monday(f.weekOf);
 if(s.id==='students'){var dup=docs('students').filter(function(d){return d.id!==FORM.id&&String(d.f.name).toLowerCase()===String(f.name).toLowerCase();});if(dup.length){toast('There is already a student named '+f.name);return;}}
 if(s.id==='weekly'){var ex=docs('weekly').filter(function(d){return d.id!==FORM.id&&d.f.weekOf===f.weekOf&&d.f.day===f.day;})[0];if(ex){toast(f.day+' already has a plan that week — opening it');var keep=f;closeSheet();openForm('weekly',ex.id);return;}}
 if(s.checkKey&&f[s.checkKey]&&!(FORM.doc&&FORM.doc.f[s.checkKey]))f.doneAt=Date.now();
 var doc=FORM.doc?JSON.parse(JSON.stringify(FORM.doc)):{id:'prek_'+s.id+'_'+uid(),sec:s.id};delete doc.builtin;doc.f=f;
 var isNew=!FORM.doc||FORM.doc.builtin;var renamed=s.id==='students'&&FORM.doc&&FORM.doc.f.name!==f.name?[FORM.doc.f.name,f.name]:null;
 closeSheet();save(doc);if(renamed)renameKid(renamed[0],renamed[1]);toast(isNew?'Saved ✓':'Updated ✓');}
function renameKid(a,b){['iep','behavior','care','comm','schedule'].forEach(function(k){docs(k).forEach(function(d){var ch=false;if(d.f.child===a){d.f.child=b;ch=true;}if(d.f.kids&&d.f.kids.indexOf(a)>=0){d.f.kids=d.f.kids.map(function(x){return x===a?b:x;});ch=true;}if(ch)save(d,true);});});render();}
function deleteForm(){var d=FORM.doc,s=FORM.s;if(!d)return;var what=s.id==='students'?d.f.name:s.id==='sub'?d.f.topic:'this entry';
 if(!confirm('Delete '+what+'?'))return;closeSheet();
 if(s.id==='sub'&&/^prek_sub_t\d+$/.test(d.id)){var old=DB[d.id]?JSON.parse(JSON.stringify(DB[d.id])):null;save({id:d.id,sec:'sub',hidden:true,f:{topic:d.f.topic,details:''}});
  toast('Deleted',function(){if(old)save(old);else removeDoc(d.id);});return;}
 var copy=JSON.parse(JSON.stringify(d));removeDoc(d.id);toast('Deleted',function(){save(copy);});}
function closeSheet(nore){var sh=$('#sheet');if(!sh.classList.contains('on'))return;sh.classList.remove('on');sh.setAttribute('aria-hidden','true');$('#shade').classList.remove('on');document.body.style.overflow='';document.body.classList.remove('sheeton');FORM=null;if(document.activeElement)document.activeElement.blur();}

/* ---------- toast ---------- */
var _tt=null;function toast(msg,undo){var t=$('#toast');t.innerHTML='<span>'+esc(msg)+'</span>'+(undo?'<button>Undo</button>':'');t.classList.add('on');clearTimeout(_tt);
 if(undo)t.querySelector('button').onclick=function(){t.classList.remove('on');undo();};_tt=setTimeout(function(){t.classList.remove('on');},undo?6000:2600);}

/* ---------- events ---------- */
document.addEventListener('click',function(e){var t=e.target,el;
 if((el=t.closest('[data-tog]'))){e.stopPropagation();var d=DB[el.getAttribute('data-tog')];if(!d)return;var s=SM[d.sec],k=s.checkKey;d=JSON.parse(JSON.stringify(d));d.f[k]=!d.f[k];if(d.f[k])d.f.doneAt=Date.now();save(d);
  if(s.id==='todo'&&d.f[k])toast('Done ✓ — moved to Done',function(){var x=JSON.parse(JSON.stringify(DB[d.id]));x.f[k]=false;save(x);});return;}
 if((el=t.closest('[data-top]'))){var i=+el.getAttribute('data-top'),dd=dashDoc();dd.f=dd.f||{};noteSave();dd=dashDoc();var tp=dd.f.top||[{},{},{}];tp[i]=tp[i]||{};tp[i].done=!tp[i].done;dd.f.top=tp;save(dd,true);
  el.classList.toggle('on',!!tp[i].done);el.parentNode.classList.toggle('done',!!tp[i].done);return;}
 if((el=t.closest('[data-new]'))){var pr={};try{pr=JSON.parse(el.getAttribute('data-preset')||'{}');}catch(x){}openForm(el.getAttribute('data-new'),null,pr);return;}
 if((el=t.closest('[data-edit]'))){var dd2=DB[el.getAttribute('data-edit')];openForm(dd2?dd2.sec:'sub',el.getAttribute('data-edit'));return;}
 if((el=t.closest('[data-go]'))){go(el.getAttribute('data-go'));return;}
 if((el=t.closest('[data-cf]'))){var p=el.getAttribute('data-cf').split('|');UI['cf_'+p[0]]=p[1];saveUI();render();return;}
 if((el=t.closest('[data-kid]'))){var q=el.getAttribute('data-kid').split('|');UI['cf_'+q[0]]=q[1];saveUI();closeSheet();go(q[0]);return;}
 if((el=t.closest('[data-cal]'))){var n=+el.getAttribute('data-cal');if(!n){UI.calYM=today().slice(0,7);UI.calSel=today();}else{var ym=UI.calYM||today().slice(0,7),dt=new Date(+ym.slice(0,4),+ym.slice(5,7)-1+n,1);UI.calYM=iso(dt).slice(0,7);UI.calSel='';}saveUI();render();return;}
 if((el=t.closest('[data-day]'))){var k2=el.getAttribute('data-day');UI.calSel=UI.calSel===k2?'':k2;if(k2.slice(0,7)!==(UI.calYM||today().slice(0,7)))UI.calYM=k2.slice(0,7);saveUI();render();return;}
 if((el=t.closest('[data-wk]'))){var w=+el.getAttribute('data-wk');UI.wk=w?addDays(UI.wk||monday(),w):monday();saveUI();if(route().sub==='w')go('weekly');else render();return;}
 if((el=t.closest('[data-pick]'))&&t.closest('button')){var b=t.closest('button'),on=b.classList.contains('on');$$('button',el).forEach(function(x){x.classList.remove('on');});var key=el.getAttribute('data-pick');
  if(!on)b.classList.add('on');FORM.f[key]=on?'':b.getAttribute('data-val');return;}
 if((el=t.closest('[data-multi]'))&&t.closest('button')){var b2=t.closest('button'),k3=el.getAttribute('data-multi');b2.classList.toggle('on');FORM.f[k3]=$$('button.on',el).map(function(x){return x.getAttribute('data-val');});return;}
 if((el=t.closest('[data-cbox]'))){var k4=el.getAttribute('data-cbox');FORM.f[k4]=!FORM.f[k4];el.querySelector('.ck').classList.toggle('on',FORM.f[k4]);return;}
 if((el=t.closest('[data-act]'))){var a=el.getAttribute('data-act');
  if(a==='close')closeSheet();else if(a==='save')saveForm();else if(a==='delete')deleteForm();else if(a==='print')printSub();
  else if(a==='cleardone'){var gone=docs('todo').filter(function(d){return d.f.done;});if(!gone.length||!confirm('Clear '+gone.length+' done item'+(gone.length===1?'':'s')+'?'))return;var cp=JSON.parse(JSON.stringify(gone));gone.forEach(function(d){removeDoc(d.id);});toast('Cleared '+cp.length,function(){cp.forEach(function(d){save(d,true);});render();});}
  else if(a==='syncnow'){flush();load().then(function(){toast('Synced ✓');});}
  else if(a==='export'){var blob=new Blob([JSON.stringify(Object.keys(DB).map(function(k){return DB[k];}),null,1)],{type:'application/json'}),u=URL.createObjectURL(blob),ln=document.createElement('a');ln.href=u;ln.download='prek-planner-backup-'+today()+'.json';document.body.appendChild(ln);ln.click();setTimeout(function(){URL.revokeObjectURL(u);ln.remove();},500);}
  return;}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&FORM){closeSheet();return;}
 if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.row[role=button]')){e.preventDefault();e.target.click();}
 if(e.key==='Enter'&&FORM&&e.target.matches('.sh-b input')){e.preventDefault();saveForm();}});
$('#shade').addEventListener('click',function(){closeSheet();});
$('#sync').addEventListener('click',function(){flush();load();});
document.addEventListener('input',function(e){if(e.target.closest&&e.target.closest('[data-note]'))noteSaveSoon();});
document.addEventListener('focusout',function(e){if(e.target.closest&&e.target.closest('[data-note]'))setTimeout(function(){if(_tNote)noteSave();},0);});
window.addEventListener('pagehide',function(){if(_tNote)noteSave();});

/* ---------- boot ---------- */
render();if(K)load();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(function(){});
window.PREK={DB:function(){return DB;},OUT:function(){return OUT;},load:load,flush:flush,save:save,removeDoc:removeDoc};
})();
