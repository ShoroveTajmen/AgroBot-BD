// Weather tool - placeholder for API integration
// In production, integrate with a weather API like OpenWeatherMap

export const weatherTool = {
  async getWeather(location) {
    // For MVP, return mock weather data based on location
    // In production, call a real weather API
    
    const mockWeatherData = {
      dhaka: { temperature: 32, humidity: 75, rainfall: 12, condition: 'Humid' },
      chittagong: { temperature: 30, humidity: 80, rainfall: 15, condition: 'Humid' },
      rajshahi: { temperature: 35, humidity: 60, rainfall: 5, condition: 'Warm' },
      khulna: { temperature: 31, humidity: 78, rainfall: 10, condition: 'Humid' },
      barisal: { temperature: 33, humidity: 82, rainfall: 18, condition: 'Humid' },
      sylhet: { temperature: 29, humidity: 85, rainfall: 25, condition: 'Humid' },
      rangpur: { temperature: 34, humidity: 65, rainfall: 8, condition: 'Warm' },
      mymensingh: { temperature: 32, humidity: 77, rainfall: 12, condition: 'Humid' }
    };

    const normalizedLocation = location.toLowerCase().trim();
    const weather = mockWeatherData[normalizedLocation];

    if (weather) {
      return {
        location: location,
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfall,
        condition: weather.condition,
        message: this.generateWeatherImpactMessage(weather)
      };
    }

    // Default weather data if location not found
    return {
      location: location,
      temperature: 30,
      humidity: 70,
      rainfall: 10,
      condition: 'Unknown',
      message: 'Weather data not available for this location. General humidity levels may affect disease spread.'
    };
  },

  generateWeatherImpactMessage(weather) {
    const impacts = [];
    
    if (weather.humidity > 70) {
      impacts.push('High humidity may promote fungal disease spread');
    }
    
    if (weather.rainfall > 15) {
      impacts.push('Recent rainfall may increase disease risk');
    }
    
    if (weather.temperature > 33) {
      impacts.push('Warm temperatures may accelerate pest reproduction');
    }
    
    if (weather.temperature < 25) {
      impacts.push('Cooler conditions may favor certain fungal diseases');
    }
    
    if (impacts.length === 0) {
      return 'Weather conditions are moderate and may not significantly affect disease development.';
    }
    
    return impacts.join('. ') + '.';
  }
};
