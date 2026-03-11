const axios = require('axios');

const geocodeAddress = async (address) => {
  if (!address) {
    return null;
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const response = await axios.get(nominatimUrl, {
      headers: {
        'User-Agent': 'ShramikSeva/1.0 (shramik-seva-app@gmail.com)',
      },
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return {
        type: 'Point',
        coordinates: [parseFloat(lon), parseFloat(lat)],
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error during geocoding:', error.message);
    return null;
  }
};

module.exports = {
  geocodeAddress,
};
