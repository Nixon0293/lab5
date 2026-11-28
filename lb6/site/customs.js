(function () {
  'use strict';

  const field = id => document.getElementById(id);
  const form = field('customsForm');
  const result = field('customsResult');
  const discuss = field('discussResult');
  const refresh = field('refreshRate');
  const inputs = [...form.querySelectorAll('input')];
  const amountIds = ['total', 'dutyByn', 'dutyEur', 'recyclingOut', 'feeOut', 'otherOut'];
  const barIds = ['dutyBar', 'recycleBar', 'feesBar', 'otherBar'];
  const dateOfFees = '2026-11-15';
  const rateDates = { eurRate: dateOfFees, usdRate: dateOfFees };
  const telegram = 'https://t.me/dmittrixx';
  const formats = [0, 1, 2].map(digits => new Intl.NumberFormat('ru-BY', {
    minimumFractionDigits: digits, maximumFractionDigits: digits
  }));
  const fmt = (value, digits = 2) => formats[digits].format(value);
  const dateLabel = iso => iso.split('-').reverse().join('.');
  const core = window.CustomsCore;
  let activeRequest;

  function invalidate(message) {
    result.classList.add('is-invalid');
    for (const id of barIds) field(id).style.flexGrow = '0';
    for (const id of amountIds) field(id).textContent = '—';
    field('customsError').textContent = message;
    field('totalByn').textContent = 'Расчёт пока недоступен.';
    field('formula').textContent = message;
    discuss.href = telegram;
    discuss.textContent = 'Задать вопрос в Telegram ↗';
    field('draftHint').hidden = true;
  }

  function calculate() {
    const made = field('made').value;
    const imported = field('importDate').value;
    const cc = field('cc').valueAsNumber;
    const value = field('customsValue').valueAsNumber;
    const euros = field('eurRate').valueAsNumber;
    const dollars = field('usdRate').valueAsNumber;
    const invalid = inputs.filter(input => !input.validity.valid);
    inputs.forEach(input => input.setAttribute('aria-invalid', String(invalid.includes(input))));

    try {
      if (field('engine').value === 'other') {
        throw new Error('Для электромобилей и гибридов нужен индивидуальный расчёт. Напишите Дмитрию, чтобы уточнить условия ввоза.');
      }
      if (invalid.length) {
        const input = invalid[0];
        const label = input.labels[0].firstChild.textContent.trim();
        throw new Error('Проверьте поле «' + label + '». ' + input.validationMessage);
      }
      const age = core.ages(made, imported);
      if (rateDates.eurRate !== imported || rateDates.usdRate !== imported) {
        throw new Error('Получите курсы НБРБ на дату оформления или введите их вручную.');
      }
      const duty = core.duty({ age: age.dutyAge, cc, value });
      const amounts = [
        core.money(duty.amount * euros), field('recyclingFee').valueAsNumber,
        field('customsFee').valueAsNumber, field('otherFees').valueAsNumber
      ];
      const total = core.money(amounts.reduce((sum, amount) => sum + amount, 0));
      const usd = fmt(core.money(total / dollars));
      const amountsOut = ['dutyByn', 'recyclingOut', 'feeOut', 'otherOut'];

      amounts.forEach((amount, index) => {
        field(amountsOut[index]).textContent = fmt(amount) + ' BYN';
        field(barIds[index]).style.flex = String(amount / total);
      });
      field('dutyEur').textContent = fmt(duty.amount) + ' €';
      field('total').textContent = usd;
      field('totalByn').textContent = fmt(total) + ' BYN · 1 USD = ' + field('usdRate').value.replace('.', ',') + ' BYN';
      const perVolume = fmt(cc, 0) + ' см³ × ' + fmt(duty.perCC, 1) + ' €/см³';
      const percent = fmt(value) + ' € × ' + Math.round(duty.percent * 100) + '%';
      field('formula').textContent = (duty.percent ? 'Максимум из ' + percent + ' и ' : '') +
        perVolume + ' = ' + fmt(duty.amount) + ' €';
      field('customsError').textContent = imported === dateOfFees ? '' :
        'Сборы указаны на 15.11.2026. Уточните их размер на выбранную дату.';
      const draft = 'Здравствуйте, Дмитрий! Хочу уточнить расчёт ввоза автомобиля.\n' +
        'Дата выпуска — ' + dateLabel(made) + ', оформление — ' + dateLabel(imported) + '.\n' +
        'Двигатель — бензин / дизель, ' + fmt(cc, 0) + ' см³. Таможенная стоимость — ' + fmt(value) + ' €.\n' +
        'Предварительные платежи — ' + usd + ' USD (' + fmt(total) + ' BYN).';
      discuss.href = telegram + '?text=' + encodeURIComponent(draft);
      discuss.textContent = 'Обсудить расчёт в Telegram ↗';
      field('draftHint').hidden = false;
      result.classList.remove('is-invalid');
      return true;
    } catch (error) {
      invalidate(error.message);
      return false;
    }
  }

  function cancelRequest() {
    activeRequest?.abort();
    activeRequest = null;
    refresh.disabled = false;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (calculate()) result.focus();
  });

  form.addEventListener('input', event => {
    const id = event.target.id;
    const imported = field('importDate').value;
    if (id === 'made' || id === 'importDate') {
      try { field('recyclingFee').value = core.ages(field('made').value, imported).recycling; } catch {}
    }
    if (id === 'importDate') {
      cancelRequest();
      form.querySelector('.customs-advanced').open = true;
      for (const key of Object.keys(rateDates)) {
        field(key).value = '';
        rateDates[key] = '';
      }
      field('rateStatus').textContent = 'Введите курс EUR на выбранную дату или получите его из НБРБ.';
      field('usdRateStatus').textContent = 'Введите курс USD на выбранную дату или получите его из НБРБ.';
    }
    if (id === 'eurRate' || id === 'usdRate') {
      cancelRequest();
      rateDates[id] = imported;
      field(id === 'eurRate' ? 'rateStatus' : 'usdRateStatus').textContent = 'Ручной ввод на ' + dateLabel(imported);
      if (field('rateStatus').textContent.startsWith('Получаю')) field('rateStatus').textContent = 'Проверьте курс EUR на выбранную дату.';
    }
    calculate();
  });

  async function fetchRate(currency, date, signal) {
    const response = await fetch('https://api.nbrb.by/exrates/rates/' + currency +
      '?parammode=2&ondate=' + encodeURIComponent(date), { signal });
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (!Number.isFinite(data.Cur_OfficialRate) || data.Cur_OfficialRate <= 0 ||
        !(data.Cur_Scale > 0) || !data.Date?.startsWith(date)) throw new Error();
    return (data.Cur_OfficialRate / data.Cur_Scale).toFixed(4);
  }

  refresh.addEventListener('click', async () => {
    const date = field('importDate').value;
    if (!date) return;
    cancelRequest();
    const request = new AbortController();
    activeRequest = request;
    const timer = setTimeout(() => request.abort(), 10000);
    refresh.disabled = true;
    field('rateStatus').textContent = 'Получаю официальные курсы НБРБ…';
    try {
      const currencies = ['EUR', 'USD'];
      const rates = await Promise.all(currencies.map(currency => fetchRate(currency, date, request.signal)));
      if (request !== activeRequest) return;
      currencies.forEach((currency, index) => {
        const id = currency.toLowerCase() + 'Rate';
        field(id).value = rates[index];
        rateDates[id] = date;
        field(index ? 'usdRateStatus' : 'rateStatus').textContent = 'НБРБ, ' + dateLabel(date) +
          ' · 1 ' + currency + ' = ' + rates[index].replace('.', ',') + ' BYN';
      });
      calculate();
    } catch {
      if (request === activeRequest) field('rateStatus').textContent =
        'Не удалось получить курсы. Проверьте их на сайте НБРБ и введите вручную.';
    } finally {
      clearTimeout(timer);
      if (request === activeRequest) cancelRequest();
    }
  });

  calculate();
})();
