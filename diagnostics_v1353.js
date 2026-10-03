(function () {
  "use strict";
  var KEY = "ps4-stability-diagnostic-v4";
  var HISTORY_KEY = "ps4-stability-diagnostic-history-v4";
  var params = new URLSearchParams(location.search);
  var noop = function () {};
  window.__PS4_DIAG_EVENT = noop;
  window.__PS4_DIAG_FIRMWARE = noop;
  window.__PS4_DIAG_FINISH = noop;
  window.__PS4_DIAG_REPORT = noop;
  var page = /(?:^|\/)jb(?:_v\d+)?\.html$/i.test(location.pathname) ? "execution" : (/(?:^|\/)diagnostics(?:_v\d+)?\.html$/i.test(location.pathname) ? "diagnostics" : "launcher");
  var storage = null;
  var persistence = "unavailable";
  try { storage = window.localStorage; storage.setItem(KEY, storage.getItem(KEY) || "{}"); persistence = "local"; } catch (e) {}
  if (!storage) try { storage = window.sessionStorage; storage.setItem(KEY, storage.getItem(KEY) || "{}"); persistence = "session"; } catch (e) {}
  function readReport(){if(!storage)return null;try{var v=JSON.parse(storage.getItem(KEY)||"null");return v&&v.schemaVersion===4?v:null}catch(e){return null}}
  function readHistory(){if(!storage)return [];try{var v=JSON.parse(storage.getItem(HISTORY_KEY)||"[]");return Array.isArray(v)?v:[]}catch(e){return []}}
  function saveHistory(v){if(!storage)return;try{storage.setItem(HISTORY_KEY,JSON.stringify(v.slice(0,8)))}catch(e){}}
  function hasActivation(v){var e=v&&Array.isArray(v.events)?v.events:[];return e.some(function(x){return x&&/^(activation\.(manual|auto|diagnostic)|execution\.module-booted)$/.test(x.event||"")})}
  var old=readReport();
  var previousIncomplete=page==="launcher"&&hasActivation(old)&&!(old.result&&old.result.allDone&&old.result.jailbroken&&old.result.kpatched&&old.result.payloadRunning);
  if(page==="launcher"&&hasActivation(old)){var h=readHistory(),id=String(old.startedAt||"");h=h.filter(function(x){return x&&String(x.startedAt||"")!==id});h.unshift(old);saveHistory(h)}
  if(!old||page==="launcher"){old={schemaVersion:4,buildVersion:"13.5.3",startedAt:Date.now(),attemptId:String(Date.now())+"-"+Math.floor(Math.random()*100000),firmware:"unknown",appCacheSupported:!!window.applicationCache,persistence:persistence,events:[],result:null,storage:[]}}
  var report=old,flushTimer=null,storageSeq=0;
  window.__PS4_DIAG_PREVIOUS_INCOMPLETE=previousIncomplete;
  function flush(){if(flushTimer!==null){clearTimeout(flushTimer);flushTimer=null}if(!storage)return;try{storage.setItem(KEY,JSON.stringify(report))}catch(e){report.persistence="unavailable"}}
  function record(name,detail){name=String(name||"");if(!/^[A-Za-z0-9_.:-]{1,72}$/.test(name))return;var d=detail==null?"":String(detail);if(d.length>520)d=d.slice(0,520)+"…";var ev={ms:Math.max(0,Date.now()-report.startedAt),page:page,event:name};if(d)ev.detail=d;report.events.push(ev);if(report.events.length>360)report.events.splice(0,report.events.length-360);if(/FAIL|ERROR|THREW|REBOOT|MISS|TIMEOUT|ABORT|GIVEUP|NO-STORAGE|USB-REPORT|execution\.complete|activation\./i.test(name))flush();else if(flushTimer===null)flushTimer=setTimeout(flush,1000)}
  function firmware(v){v=String(v||"unknown");report.firmware=/^\d{1,2}\.\d{2}$/.test(v)?v:"unknown";flush()}
  function count(v){return typeof v==="number"&&isFinite(v)&&v>=0?Math.floor(v):0}
  function finish(result){result=result||{};report.result={allDone:!!result.allDone,jailbroken:!!result.jailbroken,kpatched:!!result.kpatched,payloadRunning:!!result.payloadRunning,passCount:count(result.passCount),failCount:count(result.failCount)};record("execution.complete",JSON.stringify(report.result));flush();}
  window.__PS4_DIAG_EVENT=record;window.__PS4_DIAG_FIRMWARE=firmware;window.__PS4_DIAG_FINISH=finish;
  window.__PS4_DIAG_SET_STORAGE=function(v){report.storage=Array.isArray(v)?v.slice(0,16):[];storageSeq++;record("storage.recorded","attempt="+storageSeq+" paths="+report.storage.length);flush()};window.__PS4_DIAG_REPORT=function(){return{schemaVersion:report.schemaVersion,buildVersion:report.buildVersion,startedAt:report.startedAt,attemptId:report.attemptId,firmware:report.firmware,appCacheSupported:report.appCacheSupported,persistence:report.persistence,events:report.events.slice(),result:report.result,storage:Array.isArray(report.storage)?report.storage.slice():[],history:readHistory()}}
  var ua=/PlayStation\s+4[\/ ](\d+)\.(\d+)/.exec(navigator.userAgent);if(ua){var minor=parseInt(ua[2],16);firmware(ua[1]+"."+(minor<16?"0":"")+minor.toString(16))}
  if(page!=="diagnostics"){record("page."+page+".start");record(navigator.onLine===false?"network.offline":"network.online");}
  if(page!=="diagnostics"){
    window.addEventListener("online",function(){record("network.online")},false);
    window.addEventListener("offline",function(){record("network.offline")},false);
    window.addEventListener("error",function(e){var d="message="+(e&&e.message||"");if(e&&e.filename)d+=" file="+e.filename;if(e&&e.lineno)d+=" line="+e.lineno;if(e&&e.colno)d+=" col="+e.colno;record("runtime.error",d)},false);
    window.addEventListener("unhandledrejection",function(e){var r=e&&e.reason;record("runtime.unhandled-rejection",r&&r.stack?r.stack:(r&&r.message?r.message:String(r||"unknown")))},false);
    window.addEventListener("pagehide",function(){record("page.hide");flush()},false);
    if(params.get("diag")==="1")record("diagnostic.view");
  }
})();
