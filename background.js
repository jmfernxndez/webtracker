let currentTabId = null;
let currentDomain = null;
let startTime = null;

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function getTodayKey() {
  const today = new Date();
  return today.toISOString().slice(0, 10); // YYYY-MM-DD
}

function saveTime(domain, seconds) {
  const key = getTodayKey();
  chrome.storage.local.get([key], (data) => {
    const dayData = data[key] || {};
    dayData[domain] = (dayData[domain] || 0) + seconds;
    chrome.storage.local.set({ [key]: dayData }, clearOldDays);
  });
}

function handleTabChange(tabId, url) {
  const now = Date.now();
  if (currentDomain && startTime) {
    const elapsed = Math.floor((now - startTime) / 1000);
    if (elapsed > 0) saveTime(currentDomain, elapsed);
  }
  currentTabId = tabId;
  currentDomain = getDomain(url);
  startTime = now;
}

// Cuando el usuario cambia de pestaña activa
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.active && tab.url && !tab.url.startsWith('chrome://')) {
      handleTabChange(tab.id, tab.url);
    }
  });
});

// Cuando la URL de la pestaña activa cambia
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url && !changeInfo.url.startsWith('chrome://')) {
    handleTabChange(tabId, changeInfo.url);
  }
});

// Cuando el usuario cambia el foco de la ventana
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Usuario fuera de Chrome
    if (currentDomain && startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed > 0) saveTime(currentDomain, elapsed);
    }
    currentTabId = null;
    currentDomain = null;
    startTime = null;
  } else {
    chrome.tabs.query({ active: true, windowId }, (tabs) => {
      if (tabs[0] && tabs[0].active && tabs[0].url && !tabs[0].url.startsWith('chrome://')) {
        handleTabChange(tabs[0].id, tabs[0].url);
      }
    });
  }
});

// Cuando se cierra la pestaña activa
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === currentTabId && currentDomain && startTime) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    if (elapsed > 0) saveTime(currentDomain, elapsed);
    currentTabId = null;
    currentDomain = null;
    startTime = null;
  }
});

chrome.runtime.onStartup.addListener(() => {
  currentTabId = null;
  currentDomain = null;
  startTime = null;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getCurrent") {
    if (currentDomain && startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      sendResponse({ domain: currentDomain, elapsed });
    } else {
      sendResponse({});
    }
    return true;
  }
});

function clearOldDays() {
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  chrome.storage.local.get(null, (data) => {
    Object.keys(data).forEach(key => {
      // Solo limpiar claves con formato de fecha
      if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        const date = new Date(key);
        if (getWeekNumber(date) !== currentWeek || date.getFullYear() !== now.getFullYear()) {
          chrome.storage.local.remove(key);
        }
      }
    });
  });
}

// Devuelve el número de semana del año
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

chrome.tabs.onHighlighted.addListener((highlightInfo) => {
  chrome.tabs.query({ highlighted: true, windowId: highlightInfo.windowId }, (tabs) => {
    const tab = tabs[0];
    if (tab && tab.active && tab.url && !tab.url.startsWith('chrome://')) {
      handleTabChange(tab.id, tab.url);
    }
  });
});

function updateBadge() {
  if (currentDomain && startTime) {
    const todayKey = getTodayKey();
    chrome.storage.local.get([todayKey], (data) => {
      let total = 0;
      if (data[todayKey] && data[todayKey][currentDomain]) {
        total = data[todayKey][currentDomain];
      }
      // Suma el tiempo en memoria
      total += Math.floor((Date.now() - startTime) / 1000);

      let text = "";
      if (total < 60) {
        text = `${total}s`;
      } else if (total < 3600) {
        text = `${Math.floor(total / 60)}m`;
      } else {
        text = `${Math.floor(total / 3600)}h`;
      }
      chrome.action.setBadgeText({ text });
      chrome.action.setBadgeBackgroundColor({ color: "#1976d2" });
    });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// Actualiza el badge cada segundo
setInterval(updateBadge, 1000);

// También actualiza el badge cuando cambia el tab, foco, etc.
["onActivated", "onUpdated", "onHighlighted", "onFocusChanged"].forEach(event => {
  chrome.tabs[event]?.addListener(updateBadge);
});