const API_KEY = "57c7c0ad48e8283397b562de2f03ca5a";
const latitude = 49.24, longitude = -122.98;

function toCelsius(kelvin) {
  return kelvin - 273.15;
}

async function getWeatherDetails(lat, lon) {
  const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  try {
    const res = await fetch(WEATHER_API_URL);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();

    // Group forecast items by date (YYYY-MM-DD)
    const byDate = {};
    for (const item of data.list) {
      const date = item.dt_txt.split(" ")[0];
      byDate[date] = byDate[date] || [];
      byDate[date].push(item);
    }

    const dates = Object.keys(byDate).slice(0, 3); // first 5 distinct days
    const summaries = [];

    for (const date of dates) {
      const items = byDate[date];

      // Find min/max temp (Kelvin)
      let minK = Infinity, maxK = -Infinity;
      let minHumidity = Infinity, maxHumidity = -Infinity;
      let totalPrecip = 0

      for (const it of items) {
        const t = it.main.temp;
        const h = it.main.humidity;
        if (t < minK) minK = t;
        if (t > maxK) maxK = t;
        if (h < minHumidity) minHumidity = h;
        if (h > maxHumidity) maxHumidity = h;
         // Aggregate precipitation (rain + snow in mm)
        if (it.rain && it.rain['3h']) totalPrecip += it.rain['3h'];
        if (it.snow && it.snow['3h']) totalPrecip += it.snow['3h'];
      }

      // Choose "current" sample: prefer 12:00:00 if present, otherwise nearest to middle, else first
      let current = items.find(i => i.dt_txt.includes("12:00:00"));
      if (!current) {
        const midIndex = Math.floor(items.length / 2);
        current = items[midIndex] || items[0];
      }

      const currentC = toCelsius(current.main.temp);
      const minC = toCelsius(minK);
      const maxC = toCelsius(maxK);

      summaries.push({
        date,
        temp: {
          minC: Number(minC.toFixed(1)),
          maxC: Number(maxC.toFixed(1)),
          currentC: Number(currentC.toFixed(1)),
        },
        humidity: {
          min: Math.round(minHumidity),
          max: Math.round(maxHumidity),
          current: Math.round(current.main.humidity)
        },
        wind: {
          speed: Number((current.wind.speed || 0).toFixed(2)),
          deg: current.wind.deg || 0
        },
        precipitation: {
            totalMm: Number(totalPrecip.toFixed(1))
        }
      });
    }

    // Build readable numeric-only text
    // const header = "5-Day Numeric Forecast (min/max/current temps, humidity, wind)\n\n";
    const lines = summaries.map(s => {
      return [
        // s.date,
        `${s.temp.currentC}`,
        `${s.temp.minC}`,
        `${s.temp.maxC}`,
        `${s.humidity.current}`,
        // `${s.humidity.min}`,
        // `${s.humidity.max}`,
        `${s.wind.speed}`,
        `${s.wind.deg}`,
        `${s.precipitation.totalMm}`
      ].join(",");
    });
    const content = lines.join("\n");

    if (typeof document === "undefined") {
      // Node: write to forecast.txt
      try {
        const fs = require && require("fs");
        await fs.promises.writeFile("forecast.txt", content, "utf8");
      } catch (e) {
        const fs = await import("fs");
        await fs.promises.writeFile("forecast.txt", content, "utf8");
      }
      console.log("Saved forecast.txt");
      console.log(content);
    } else {
      // Browser: offer a download link with plain numeric text
      let container = document.getElementById("five-day-forecast");
      if (!container) {
        container = document.createElement("div");
        container.id = "five-day-forecast";
        container.style.fontFamily = "Arial, sans-serif";
        container.style.margin = "12px";
        document.body.appendChild(container);
      } else {
        container.innerHTML = "";
      }

      const pre = document.createElement("pre");
      pre.textContent = content;
      pre.style.whiteSpace = "pre-wrap";
      pre.style.fontFamily = "monospace";
      container.appendChild(pre);

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "forecast.txt";
      a.textContent = "Download forecast.txt";
      a.style.display = "inline-block";
      a.style.marginTop = "12px";
      container.appendChild(a);
    }

    return summaries;
  } catch (err) {
    console.error("Failed to fetch weather:", err);
    return [];
  }
}

getWeatherDetails(latitude, longitude);