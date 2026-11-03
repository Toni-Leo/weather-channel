import { useState, useEffect } from "react";
import "./App.css";

// Weather code -> icon + description
const CODES = {
  0: ["☀️", "Clear sky"],
  1: ["🌤️", "Mostly clear"],
  2: ["⛅", "Partly cloudy"],
  3: ["☁️", "Overcast"],
  45: ["🌫️", "Fog"],
  48: ["🌫️", "Fog"],
  51: ["🌦️", "Light drizzle"],
  53: ["🌦️", "Drizzle"],
  55: ["🌦️", "Heavy drizzle"],
  61: ["🌧️", "Light rain"],
  63: ["🌧️", "Rain"],
  65: ["🌧️", "Heavy rain"],
  80: ["🌦️", "Rain showers"],
  81: ["🌧️", "Rain showers"],
  82: ["⛈️", "Violent showers"],
  95: ["⛈️", "Thunderstorm"],
  96: ["⛈️", "Thunderstorm with hail"],
  99: ["⛈️", "Thunderstorm with hail"],
};

const info = (code) => CODES[code] || ["🌡️", "Unknown"];

export default function App() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("C");

  const temp = (c) =>
    unit === "C" ? `${Math.round(c)}°C` : `${Math.round((c * 9) / 5 + 32)}°F`;

  async function getWeather(city) {
    setLoading(true);
    setError("");
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
      );
      const geo = await geoRes.json();
      if (!geo.results) throw new Error("City not found. Check the spelling.");

      const { latitude, longitude, name, country } = geo.results[0];

      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not load weather data.");
      const data = await res.json();

      setWeather({ name, country, current: data.current, daily: data.daily });
    } catch (err) {
      setWeather(null);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Load Lagos when the app opens
  useEffect(() => {
    getWeather("Lagos");
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) getWeather(query.trim());
  };

  return (
    <div className="app">
      <div className="panel">
        <h1>Weather</h1>

        <form className="search" onSubmit={onSubmit}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a city..."
            aria-label="City name"
          />
          <button type="submit">Search</button>
        </form>

        <div className="units">
          <button className={unit === "C" ? "active" : ""} onClick={() => setUnit("C")}>°C</button>
          <button className={unit === "F" ? "active" : ""} onClick={() => setUnit("F")}>°F</button>
        </div>

        {loading && <p className="status">Loading...</p>}
        {error && <p className="status error">{error}</p>}

        {weather && !loading && (
          <>
            <div className="current">
              <h2>{weather.name}, {weather.country}</h2>
              <div className="icon">{info(weather.current.weather_code)[0]}</div>
              <div className="big-temp">{temp(weather.current.temperature_2m)}</div>
              <p>{info(weather.current.weather_code)[1]}</p>

              <div className="details">
                <div>
                  <span>Feels like</span>
                  <strong>{temp(weather.current.apparent_temperature)}</strong>
                </div>
                <div>
                  <span>Humidity</span>
                  <strong>{weather.current.relative_humidity_2m}%</strong>
                </div>
                <div>
                  <span>Wind</span>
                  <strong>{Math.round(weather.current.wind_speed_10m)} km/h</strong>
                </div>
              </div>
            </div>

            <h3>5-day forecast</h3>
            <div className="forecast">
              {weather.daily.time.slice(0, 5).map((day, i) => (
                <div className="day" key={day}>
                  <span>
                    {new Date(day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <div className="day-icon">{info(weather.daily.weather_code[i])[0]}</div>
                  <strong>{temp(weather.daily.temperature_2m_max[i])}</strong>
                  <small>{temp(weather.daily.temperature_2m_min[i])}</small>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}