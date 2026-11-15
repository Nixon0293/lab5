(function(){
 'use strict';
 const form=document.querySelector('#customsForm'),q=id=>document.getElementById(id),core=window.CustomsCore;
 const fmt=(v,d=2)=>new Intl.NumberFormat('ru-BY',{maximumFractionDigits:d,minimumFractionDigits:d}).format(v);
 const outputs=['total','dutyByn','dutyEur','recyclingOut','feeOut','otherOut'];
 let rateSource='НБРБ',rateDate='2026-11-15',usdDate='2026-11-15',controller;
 function invalidate(message){q('customsError').textContent=message;outputs.forEach(id=>q(id).textContent='—');q('totalByn').textContent='Расшифровка ниже — в BYN.';q('formula').textContent='Заполните корректные данные для расчёта.';document.querySelector('.customs-result').classList.add('is-invalid');}
 function calculate(){
  if(!form.checkValidity()){invalidate('Проверьте даты и положительные значения полей. Объём двигателя укажите целым числом в см³.');return;}
  if(q('engine').value==='other'){invalidate('Для электромобилей и гибридов нужен отдельный расчёт с учётом типа силовой установки и условий ввоза. Свяжитесь с Дмитрием.');return;}
  try{
   const age=core.ages(q('made').value,q('importDate').value);
   const value=+q('customsValue').value,cc=+q('cc').value,rate=+q('eurRate').value;
   if(rateDate!==q('importDate').value||usdDate!==q('importDate').value)throw new Error('Получите курс НБРБ на дату оформления или введите подтверждённый курс вручную.');
   const duty=core.duty({age:age.dutyAge,cc,value});
   const dutyByn=core.money(duty.amount*rate),recycling=+q('recyclingFee').value,fee=+q('customsFee').value,other=+q('otherFees').value,total=core.money(dutyByn+recycling+fee+other);
   q('total').textContent=fmt(core.money(total/+q('usdRate').value));q('totalByn').textContent='Эквивалент: '+fmt(total)+' BYN · 1 USD = '+q('usdRate').value+' BYN';q('dutyByn').textContent=fmt(dutyByn)+' BYN';q('dutyEur').textContent=fmt(duty.amount)+' €';q('recyclingOut').textContent=fmt(recycling)+' BYN';q('feeOut').textContent=fmt(fee)+' BYN';q('otherOut').textContent=fmt(other)+' BYN';
   q('formula').textContent=duty.percent?'Максимум из '+fmt(value)+' € × '+Math.round(duty.percent*100)+'% и '+fmt(cc,0)+' см³ × '+fmt(duty.perCC,1)+' €/см³ = '+fmt(duty.amount)+' €':fmt(cc,0)+' см³ × '+fmt(duty.perCC,1)+' €/см³ = '+fmt(duty.amount)+' €';
   q('dutyBar').style.flex=String(dutyByn/Math.max(total,1));q('recycleBar').style.flex=String(recycling/Math.max(total,1));q('feesBar').style.flex=String((fee+other)/Math.max(total,1));
   q('customsError').textContent=q('importDate').value!=='2026-11-15'?'Сборы заданы по состоянию на 15.11.2026. Для выбранной даты уточните их размер и измените поля при необходимости.':'';
   document.querySelector('.customs-result').classList.remove('is-invalid');
  }catch(error){invalidate(error.message);}
 }
 function setRecycling(){try{q('recyclingFee').value=core.ages(q('made').value,q('importDate').value).recycling;}catch{}}
 form.addEventListener('submit',e=>{e.preventDefault();calculate();if(!form.checkValidity())form.reportValidity();});
 form.addEventListener('input',e=>{
  if(e.target.id==='made'||e.target.id==='importDate')setRecycling();
  if(e.target.id==='importDate'){q('eurRate').value='';q('usdRate').value='';rateDate='';usdDate='';q('usdRateStatus').textContent='Введите курс USD на выбранную дату или получите его из НБРБ.';q('rateStatus').textContent='Получите курс на выбранную дату или введите его вручную.';}
  if(e.target.id==='usdRate'){usdDate=q('importDate').value;q('usdRateStatus').textContent='Ручной ввод · 1 USD = '+q('usdRate').value+' BYN';}
  if(e.target.id==='eurRate'){rateSource='Ручной ввод';rateDate=q('importDate').value;q('rateStatus').textContent='Ручной ввод · 1 EUR = '+q('eurRate').value+' BYN';}
  calculate();
 });
 form.addEventListener('change',calculate);
 q('refreshRate').addEventListener('click',async()=>{
  const date=q('importDate').value,button=q('refreshRate');if(!date)return;
  controller?.abort();controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
  button.disabled=true;q('rateStatus').textContent='Получаю официальный курс НБРБ…';
  try{const response=await fetch('https://api.nbrb.by/exrates/rates/EUR?parammode=2&ondate='+encodeURIComponent(date),{signal:controller.signal});if(!response.ok)throw new Error();const data=await response.json();if(!Number.isFinite(data.Cur_OfficialRate)||!(data.Cur_Scale>0)||!data.Date?.startsWith(date))throw new Error();const usdResponse=await fetch('https://api.nbrb.by/exrates/rates/USD?parammode=2&ondate='+encodeURIComponent(date),{signal:controller.signal});if(!usdResponse.ok)throw new Error();const dollar=await usdResponse.json();if(!Number.isFinite(dollar.Cur_OfficialRate)||!(dollar.Cur_Scale>0)||!dollar.Date?.startsWith(date))throw new Error();if(date!==q('importDate').value)return;q('usdRate').value=(dollar.Cur_OfficialRate/dollar.Cur_Scale).toFixed(4);usdDate=date;q('usdRateStatus').textContent='НБРБ, '+date.split('-').reverse().join('.')+' · 1 USD = '+q('usdRate').value+' BYN';q('eurRate').value=(data.Cur_OfficialRate/data.Cur_Scale).toFixed(4);rateDate=date;rateSource='НБРБ';q('rateStatus').textContent='НБРБ, '+date.split('-').reverse().join('.')+' · 1 EUR = '+q('eurRate').value+' BYN';calculate();}
  catch{q('rateStatus').textContent='Не удалось получить курс. Проверьте его на сайте НБРБ и введите вручную.';}
  finally{clearTimeout(timer);button.disabled=false;}
 });
 calculate();
})();
