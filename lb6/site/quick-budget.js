const fullBudget = document.querySelector('#budget');
const disclosure = document.querySelector('.filter-disclosure');
const compact = matchMedia('(max-width: 700px)');
const quickLabel = document.createElement('label');
quickLabel.className = 'quick-budget';
quickLabel.textContent = 'Бюджет до, USD';
const quickBudget = fullBudget.cloneNode(true);
quickBudget.removeAttribute('id');
quickLabel.append(quickBudget);
disclosure.before(quickLabel);

function syncLayout() {
  disclosure.open = !compact.matches;
}
syncLayout();
compact.addEventListener('change', syncLayout);
quickBudget.addEventListener('input', () => {
  fullBudget.value = quickBudget.value;
  fullBudget.dispatchEvent(new Event('input', { bubbles: true }));
});
fullBudget.addEventListener('input', () => {
  quickBudget.value = fullBudget.value;
});
fullBudget.form.addEventListener('reset', () => {
  requestAnimationFrame(() => { quickBudget.value = fullBudget.value; });
});
