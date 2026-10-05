(function(){
"use strict";
var KEY="RAWGAME_DIAG_V1", out=document.getElementById("out"), meta=document.getElementById("meta");
function read(){
  var d=null;
  try{d=JSON.parse(sessionStorage.getItem(KEY)||"null")}catch(e){}
  if(!d)try{d=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
  return d;
}
function load(){
  var d=read();
  if(!d){out.textContent="لا يوجد تقرير محفوظ.";meta.textContent="No diagnostic snapshot";return null}
  var ev=d.events||[], first=ev[0], last=ev[ev.length-1];
  meta.textContent="build="+(d.buildVersion||"?")+" · attempt="+(d.attemptId||"?")+" · events="+ev.length+
    (d.firmware?" · fw="+d.firmware:"")+
    (last&&last.ms!=null?" · last="+last.ms+"ms":"");
  out.textContent=JSON.stringify(d,null,2);return d;
}
document.getElementById("refresh").onclick=load;
document.getElementById("copy").onclick=function(){
  var text=out.textContent||"";
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text);return}}catch(e){}
  try{var ta=document.createElement("textarea");ta.value=text;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta)}catch(e){}
};
document.getElementById("clear").onclick=function(){try{sessionStorage.removeItem(KEY)}catch(e){}try{localStorage.removeItem(KEY)}catch(e){}load()};
document.getElementById("download").onclick=function(){var d=load();if(!d)return;var a=document.createElement("a");a.href="data:text/plain;charset=utf-8,"+encodeURIComponent(out.textContent);a.download="PS4-STABILITY-DIAGNOSTIC.txt";a.click()};
load();
})();
