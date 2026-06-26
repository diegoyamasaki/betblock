const toggleEl = document.getElementById('toggleEnabled');
const statusBanner = document.getElementById('statusBanner');
const statusText = document.getElementById('statusText');
const countPage = document.getElementById('countPage');
const countTotal = document.getElementById('countTotal');

async function getStorage(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

async function setStorage(data) {
  return new Promise(resolve => chrome.storage.local.set(data, resolve));
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function init() {
  const { enabled = true, totalBlocked = 0 } = await getStorage(['enabled', 'totalBlocked']);

  toggleEl.checked = enabled;
  updateUI(enabled);
  countTotal.textContent = totalBlocked;

  const tab = await getActiveTab();
  if (tab?.id) {
    chrome.runtime.sendMessage({ type: 'GET_PAGE_COUNT', tabId: tab.id })
      .then(res => { countPage.textContent = res?.count ?? 0; })
      .catch(() => {});
  }
}

function updateUI(enabled) {
  if (enabled) {
    statusBanner.classList.remove('disabled');
    statusText.textContent = 'Ativo — protegendo você';
  } else {
    statusBanner.classList.add('disabled');
    statusText.textContent = 'Desativado';
  }
}

toggleEl.addEventListener('change', async () => {
  const enabled = toggleEl.checked;
  await setStorage({ enabled });
  updateUI(enabled);

  await chrome.declarativeNetRequest.updateEnabledRulesets(
    enabled
      ? { enableRulesetIds: ['bet_rules'], disableRulesetIds: [] }
      : { enableRulesetIds: [], disableRulesetIds: ['bet_rules'] }
  );
});

document.getElementById('linkReport').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({
    url: 'https://github.com/SEU_USUARIO/betblock/issues/new?template=site_nao_coberto.md',
  });
});

init();
