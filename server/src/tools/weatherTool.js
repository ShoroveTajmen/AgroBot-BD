// Weather tool - OpenWeatherMap API (Free tier: 1,000 calls/day)
// API key stored in .env as OPENWEATHER_API_KEY

const DISTRICT_COORDS = {
  dhaka:      { lat: 23.8103, lon: 90.4125 },
  chittagong: { lat: 22.3569, lon: 91.7832 },
  rajshahi:   { lat: 24.3745, lon: 88.6042 },
  khulna:     { lat: 22.8456, lon: 89.5403 },
  barisal:    { lat: 22.7010, lon: 90.3535 },
  sylhet:     { lat: 24.8949, lon: 91.8687 },
  rangpur:    { lat: 25.7439, lon: 89.2752 },
  mymensingh: { lat: 24.7471, lon: 90.4203 },
};

const MOCK_DATA = {
  dhaka:      { temperature: 32, humidity: 75, rainfall: 12, condition: 'Humid' },
  chittagong: { temperature: 30, humidity: 80, rainfall: 15, condition: 'Humid' },
  rajshahi:   { temperature: 35, humidity: 60, rainfall: 5,  condition: 'Warm'  },
  khulna:     { temperature: 31, humidity: 78, rainfall: 10, condition: 'Humid' },
  barisal:    { temperature: 33, humidity: 82, rainfall: 18, condition: 'Humid' },
  sylhet:     { temperature: 29, humidity: 85, rainfall: 25, condition: 'Humid' },
  rangpur:    { temperature: 34, humidity: 65, rainfall: 8,  condition: 'Warm'  },
  mymensingh: { temperature: 32, humidity: 77, rainfall: 12, condition: 'Humid' },
};

export const weatherTool = {
  async getWeather(location) {
    console.log(`  → Weather Tool: Getting weather for "${location}"`);

    const normalizedLocation = location.toLowerCase().trim();
    const apiKey = process.env.OPENWEATHER_API_KEY;

    // ── Real API ──────────────────────────────────────────────────────────────
    if (apiKey) {
      try {
        const coords = DISTRICT_COORDS[normalizedLocation];
        const url = coords
          ? `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`
          : `https://api.openweathermap.org/data/2.5/weather?q=${location},BD&appid=${apiKey}&units=metric`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();

        const temperature = Math.round(data.main.temp);
        const humidity    = data.main.humidity;
        const rainfall    = Math.round((data.rain?.['1h'] ?? data.rain?.['3h'] ?? 0) * 10) / 10;
        const condition   = this.mapCondition(data.weather[0].main, humidity);
        const weather     = { temperature, humidity, rainfall, condition };

        console.log(`    ✓ Real weather: ${temperature}°C, ${humidity}% humidity [OpenWeatherMap]`);

        return {
          location,
          temperature,
          humidity,
          rainfall,
          condition,
          description: data.weather[0].description,
          source: 'OpenWeatherMap',
          message: this.generateWeatherImpactMessage(weather)
        };
      } catch (error) {
        console.warn(`    ⚠ API failed: ${error.message} — using mock data`);
      }
    } else {
      console.log('    ℹ No OPENWEATHER_API_KEY — using mock data');
    }

    // ── Fallback mock ─────────────────────────────────────────────────────────
    const mock = MOCK_DATA[normalizedLocation];
    if (mock) {
      console.log(`    ✓ Mock weather: ${mock.temperature}°C, ${mock.humidity}%`);
      return {
        location,
        temperature: mock.temperature,
        humidity:    mock.humidity,
        rainfall:    mock.rainfall,
        condition:   mock.condition,
        source:      'mock',
        message:     this.generateWeatherImpactMessage(mock)
      };
    }

    return {
      location,
      temperature: 30,
      humidity:    70,
      rainfall:    10,
      condition:   'Unknown',
      source:      'mock',
      message:     'Weather data not available for this location. General humidity levels may affect disease spread.'
    };
  },

  mapCondition(owmMain, humidity) {
    const map = {
      Thunderstorm: 'Stormy',
      Drizzle:      'Rainy',
      Rain:         'Rainy',
      Snow:         'Cold',
      Clear:        humidity > 70 ? 'Humid' : 'Warm',
      Clouds:       humidity > 70 ? 'Humid' : 'Cloudy',
      Mist:         'Humid',
      Fog:          'Humid',
      Haze:         'Humid',
    };
    return map[owmMain] || 'Moderate';
  },

  generateWeatherImpactMessage(weather) {
    const impacts = [];
    if (weather.humidity > 70)    impacts.push('High humidity may promote fungal disease spread');
    if (weather.rainfall > 15)    impacts.push('Recent rainfall may increase disease risk');
    if (weather.temperature > 33) impacts.push('Warm temperatures may accelerate pest reproduction');
    if (weather.temperature < 25) impacts.push('Cooler conditions may favor certain fungal diseases');
    return impacts.length > 0
      ? impacts.join('. ') + '.'
      : 'Weather conditions are moderate and may not significantly affect disease development.';
  }
};
