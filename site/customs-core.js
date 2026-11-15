/* Rates: EEC Council Decision 107, Appendix 2, Table 2, paragraph 3.
   Pure calculation shared by the page and boundary checks. EUR amounts. */
(function(root,factory){const core=factory();if(typeof module==='object'&&module.exports)module.exports=core;else root.CustomsCore=core;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const bounds=[1000,1500,1800,2300,3000,Infinity];
 const mid=[1.5,1.7,2.5,2.7,3,3.6],old=[3,3.2,3.5,4.8,5,5.7];
 const priceBounds=[8500,16700,42300,84500,169000,Infinity],minimums=[2.5,3.5,5.5,7.5,15,20];
 const money=value=>Math.round((value+Number.EPSILON)*100)/100;
 function duty({age,cc,value}){
  if(!Number.isFinite(cc)||!Number.isInteger(cc)||cc<100||cc>10000||!Number.isFinite(value)||value<=0||value>5000000||!['new','mid','old'].includes(age))throw new Error('Проверьте объём двигателя и таможенную стоимость.');
  if(age==='new'){const i=priceBounds.findIndex(b=>value<=b),percent=i===0?.54:.48;return {amount:money(Math.max(value*percent,cc*minimums[i])),perCC:minimums[i],percent};}
  const rate=(age==='mid'?mid:old)[bounds.findIndex(b=>cc<=b)];return {amount:money(cc*rate),perCC:rate,percent:0};
 }
 function anniversary(date,years){const [y,m,d]=date.split('-').map(Number);const last=new Date(Date.UTC(y+years,m,0)).getUTCDate();return Date.UTC(y+years,m-1,Math.min(d,last));}
 function ages(made,imported){const release=Date.parse(made+'T00:00:00Z'),arrival=Date.parse(imported+'T00:00:00Z');if(!Number.isFinite(release)||!Number.isFinite(arrival)||release>arrival)throw new Error('Дата выпуска должна быть не позже даты оформления.');const three=anniversary(made,3),five=anniversary(made,5);return {dutyAge:arrival<=three?'new':arrival<=five?'mid':'old',recycling:arrival<three?624.92:1282.02};}
 return {duty,ages,money};
});
