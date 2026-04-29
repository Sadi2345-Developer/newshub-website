import { useEffect, useState, useCallback } from "react";
import "./App.css";

// --- HELPER FUNCTIONS (App se bahar taake koi error na aaye) ---

const getWeatherIcon = (code) => {
  if (code === 0) return "bi-sun-fill icon-gradient-sun";
  if (code === 1 || code === 2) return "bi-cloud-sun-fill icon-gradient-cloud-sun";
  if (code === 3) return "bi-clouds-fill icon-gradient-cloud";
  if (code >= 45 && code <= 48) return "bi-cloud-haze-fill icon-gradient-fog";
  if (code >= 51 && code <= 65) return "bi-cloud-rain-fill icon-gradient-rain";
  if (code >= 80 && code <= 82) return "bi-cloud-showers-heavy icon-gradient-rain";
  if (code >= 71 && code <= 77 || code === 85 || code === 86) return "bi-cloud-snow-fill icon-gradient-snow";
  if (code >= 95) return "bi-cloud-lightning-rain-fill icon-gradient-thunder";
  return "bi-cloud-fill icon-gradient-cloud";
};

const getWeatherConditionText = (code) => {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
};

// --- MAIN COMPONENT ---

function App() {
  const [weather, setWeather] = useState(null);
  const [isLoading, setisLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [displayCity, setDisplayCity] = useState("Kuala Lumpur");

  // fetchWeather function wrapping helper functions calls
  const fetchWeather = useCallback(async (cityName) => {
    try {
      setisLoading(true);
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        alert("City not found!");
        setisLoading(false);
        return;
      }

      const { latitude, longitude, name } = geoData.results[0];
      setDisplayCity(name);

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset&timezone=auto`);
      const weatherData = await weatherRes.json();

      const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi`);
      const aqiData = await aqiRes.json();

      const current = weatherData.current;
      const daily = weatherData.daily;

      const newWeather = {
        current: {
          temp_c: Math.round(current.temperature_2m),
          condition: {
            text: getWeatherConditionText(current.weather_code),
            icon: getWeatherIcon(current.weather_code)
          },
          feelslike_c: Math.round(current.apparent_temperature),
          humidity: current.relative_humidity_2m,
          wind_kph: current.wind_speed_10m,
          pressure: current.surface_pressure,
          aqi: aqiData.current.us_aqi,
          uv: daily.uv_index_max[0],
          sunrise: daily.sunrise[0].split("T")[1],
          sunset: daily.sunset[0].split("T")[1],
        },
        forecast: daily.time.map((date, index) => ({
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          temp: Math.round(daily.temperature_2m_max[index]),
          icon: getWeatherIcon(daily.weather_code[index])
        }))
      };

      setWeather(newWeather);
      setisLoading(false);
    } catch (error) {
      console.error("Error fetching weather:", error);
      setisLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchWeather("Kuala Lumpur");
  }, [fetchWeather]);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchInput.trim() !== "") {
      fetchWeather(searchInput);
      setSearchInput("");
    }
  };

  const getAqiStatus = (aqi) => {
    if (aqi <= 50) return { text: "Good", class: "text-success" };
    if (aqi <= 100) return { text: "Moderate", class: "text-warning" };
    return { text: "Unhealthy", class: "text-danger" };
  };

  const getUvStatus = (uv) => {
    if (uv <= 2) return { text: "Low", class: "text-success" };
    if (uv <= 5) return { text: "Moderate", class: "text-warning" };
    return { text: "High", class: "text-danger" };
  };

  if (isLoading) {
    return (
      <div className="main-bg d-flex justify-content-center align-items-center">
        <h1 className="text-white">Loading Weather Data...</h1>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <section className="main-bg">
      <div className="container-fluid p-4">
        <div className="main-card p-3">
          <div className="row">
            {/* LEFT SIDE: Search and Current Weather Info */}
            <div className="col-12 col-xl-3 col-lg-4 col-md-5 left-card mt-3 mx-md-3">
              <div className="search-wrapper mb-4">
                <i className="bi bi-search search-icon"></i>
                <input
                  type="text"
                  className="form-control search-box"
                  placeholder="Search city..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearch}
                />
              </div>
              
              <div className="text-center my-4">
                <i className={`bi ${weather.current.condition.icon} main-weather-icon`} style={{ fontSize: '120px', lineHeight: '1' }}></i>
                <h1 className="deg mt-3 text-white">{weather.current.temp_c}°<span style={{fontSize: '40px'}}>C</span></h1>
              </div>

              <div className="d-flex justify-content-between divider text-white font-weight-bold">
                <span style={{fontSize: '18px', fontWeight: '500'}}>{displayCity}</span>
                <span style={{fontSize: '18px', fontWeight: '500'}}>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
              </div>

              <div className="mt-3 left-details">
                <div className="d-flex align-items-center mb-3 text-white">
                  <i className="bi bi-cloud-sun me-3"></i>
                  {weather.current.condition.text}
                </div>
                <div className="d-flex align-items-center mb-3 text-white">
                  <i className="bi bi-thermometer-half me-3"></i>
                  Feels like {weather.current.feelslike_c}°C
                </div>
              </div>

              <div className="weather-card2 mt-4 d-flex justify-content-between align-items-center p-3" style={{background: 'rgba(255,255,255,0.1)', borderRadius: '10px'}}>
                <div className="d-flex align-items-center">
                  <img src="/images/water.png" className="icon" alt="humidity" style={{width: '30px'}} />
                  <div className="ms-3">
                    <h6 className="text-white mb-0">{weather.current.humidity}%</h6>
                    <small className="text-white">Humidity</small>
                  </div>
                </div>

                <div className="d-flex align-items-center">
                  <img src="/images/wind.png" className="icon" alt="wind" style={{width: '30px'}} />
                  <div className="ms-3">
                    <h6 className="text-white mb-0">{weather.current.wind_kph}km/h</h6>
                    <small className="text-white">Wind Speed</small>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Forecast and Details */}
            <div className="col-12 col-xl-8 col-lg-7 col-md-6 p-md-4 mt-5 mt-md-0">
              <div className="tabs mb-4 text-white">
                <span className="me-3">Today</span>
                <span className="active" style={{borderBottom: '2px solid white', paddingBottom: '5px'}}>Week</span>
              </div>

              <div className="row text-center mb-5 g-3">
                {weather.forecast.map((day, index) => (
                  <div className="col-6 col-sm-4 col-md col-lg" key={index}>
                    <div className="weather-card p-3 text-white" style={{background: 'rgba(255,255,255,0.1)', borderRadius: '10px'}}>
                      <p className="mb-1">{day.day}</p>
                      <i className={`bi ${day.icon} weather-icon`} style={{ fontSize: '40px', margin: '10px 0', display: 'block' }}></i>
                      <p className="mb-0 fw-bold">{day.temp}°</p>
                    </div>
                  </div>
                ))}
              </div>

              <h5 className="section-title text-white mb-4">Today's Overview</h5>

              <div className="row mb-4 g-4">
                <div className="col-md-4">
                  <div className="overview-card p-3 text-white" style={{background: 'rgba(255,255,255,0.1)', borderRadius: '10px'}}>
                    <p className="text-muted mb-2">Air Quality Index</p>
                    <h2 className="mb-2">{weather.current.aqi}</h2>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`${getAqiStatus(weather.current.aqi).class} status-text fw-bold`}>
                        {getAqiStatus(weather.current.aqi).text}
                      </span>
                      <img src="./images/t1.png" alt="air" className="status-icon" style={{width: '30px'}} />
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="overview-card p-3 text-white" style={{background: 'rgba(255,255,255,0.1)', borderRadius: '10px'}}>
                    <p className="text-muted mb-2">UV Index</p>
                    <h2 className="mb-2">{weather.current.uv}</h2>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`${getUvStatus(weather.current.uv).class} status-text fw-bold`}>
                        {getUvStatus(weather.current.uv).text}
                      </span>
                      <img src="./images/t2.png" alt="uv" className="status-icon" style={{width: '30px'}} />
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="overview-card p-3 text-white" style={{background: 'rgba(255,255,255,0.1)', borderRadius: '10px'}}>
                    <p className="text-muted mb-2">Pressure (hpa)</p>
                    <h2 className="mb-2">{weather.current.pressure}</h2>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="status-text text-white fw-bold">Normal</span>
                      <img src="./images/t3.png" alt="pressure" className="status-icon" style={{width: '30px'}} />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- RESTORED PARTS START HERE --- */}
              <div className="row g-4 mt-2">
                <div className="col-lg-8">
                  <div className="graph-card p-3 text-white" style={{background: 'rgba(255,255,255,0.1)', borderRadius: '10px'}}>
                    <p style={{color: '#A0A5AF', marginBottom: '15px'}}>Precipitation</p>
                    <img
                      src="/images/Precipitation.png"
                      className="precipitation-img img-fluid"
                      alt="precipitation-graph"
                      style={{borderRadius: '5px'}}
                    />
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="sun-card p-3 text-white" style={{background: 'rgba(255,255,255,0.1)', borderRadius: '10px', height: '100%'}}>
                    <p className="mb-3">Sunrise & Sunset</p>
                    <div className="d-flex align-items-center mt-3">
                      <img src="/images/Icon.png" className="sun-icon" alt="sunrise" style={{width: '40px'}} />
                      <div className="ms-3">
                        <small className="text-muted">Sunrise</small>
                        <h6 className="mb-0">{weather.current.sunrise}</h6>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mt-4">
                      <img src="/images/Sunset.png" className="sun-icon" alt="sunset" style={{width: '40px'}} />
                      <div className="ms-3">
                        <small className="text-muted">Sunset</small>
                        <h6 className="mb-0">{weather.current.sunset}</h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* --- RESTORED PARTS END HERE --- */}
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default App;