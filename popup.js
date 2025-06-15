function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    h > 0 ? `${h}h` : "",
    m > 0 ? `${m}m` : "",
    s > 0 ? `${s}s` : ""
  ].filter(Boolean).join(" ");
}

function getWeekDates() {
  const now = new Date();
  const day = now.getDay() || 7; // Lunes=1 ... Domingo=7
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  return Array.from({length: 7}, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function getDayName(dateStr) {
  const dias = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];
  const d = new Date(dateStr);
  return dias[(d.getDay() + 6) % 7]; // Lunes=0
}

function updateStats() {
  const weekDates = getWeekDates();
  chrome.storage.local.get(weekDates, (data) => {
    // Pedir al background el dominio y tiempo actual en memoria
    chrome.runtime.sendMessage({ type: "getCurrent" }, (current) => {
      // Construir lista de todos los dominios de la semana
      const allDomains = new Set();
      weekDates.forEach(dateKey => {
        const stats = data[dateKey] || {};
        Object.keys(stats).forEach(domain => allDomains.add(domain));
      });
      // Añadir el dominio actual si no está
      if (current && current.domain) {
        allDomains.add(current.domain);
      }

      // Crear cabecera de días
      const thead = document.querySelector("#stats thead");
      thead.innerHTML = "<tr><th>Domain</th>" +
        weekDates.map(getDayName).map(d => `<th>${d}</th>`).join("") +
        "</tr>";

      // Crear filas por dominio
      const tbody = document.querySelector("#stats tbody");
      tbody.innerHTML = "";
      Array.from(allDomains).sort().forEach(domain => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${domain}</td>` +
          weekDates.map(dateKey => {
            let seconds = (data[dateKey] && data[dateKey][domain]) || 0;
            // Sumar tiempo en memoria si es el dominio y día actual
            const todayKey = new Date().toISOString().slice(0, 10);
            if (
              current &&
              current.domain === domain &&
              dateKey === todayKey
            ) {
              seconds += current.elapsed;
            }
            return `<td>${seconds > 0 ? formatTime(seconds) : ""}</td>`;
          }).join("");
        tbody.appendChild(row);
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateStats();
  setInterval(updateStats, 1000);
});

document.getElementById('clearData').addEventListener('click', () => {
  chrome.storage.local.clear(() => {
    document.getElementById('status').textContent = '¡Datos borrados!';
    setTimeout(() => {
      document.getElementById('status').textContent = '';
    }, 2000);
    updateStats();
  });
});