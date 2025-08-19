import React, { useState, useEffect } from 'react';
import { MapPin, Target, Settings } from 'lucide-react';

interface LocationSetupProps {
  onLocationSet: (location: UserLocation) => void;
  currentTheme: any;
}

export interface UserLocation {
  zipcode?: string;
  coordinates?: { lat: number; lng: number };
  radius: number;
  city?: string;
  state?: string;
}

const LocationSetup: React.FC<LocationSetupProps> = ({ onLocationSet, currentTheme }) => {
  const [zipcode, setZipcode] = useState('');
  const [radius, setRadius] = useState(25);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load saved location from localStorage
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setZipcode(location.zipcode || '');
        setRadius(location.radius || 25);
        onLocationSet(location);
      } catch (e) {
        console.error('Error loading saved location:', e);
      }
    }
  }, [onLocationSet]);

  const saveLocation = (location: UserLocation) => {
    localStorage.setItem('userLocation', JSON.stringify(location));
    onLocationSet(location);
  };

  const handleZipcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!zipcode.match(/^\d{5}$/)) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }

    try {
      // Validate zipcode by trying to geocode it
      const response = await fetch(
        `https://api.zippopotam.us/us/${zipcode}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const location: UserLocation = {
          zipcode,
          radius,
          city: data.places[0]['place name'],
          state: data.places[0]['state abbreviation'],
          coordinates: {
            lat: parseFloat(data.places[0]['latitude']),
            lng: parseFloat(data.places[0]['longitude'])
          }
        };
        saveLocation(location);
      } else {
        setError('Invalid ZIP code. Please try again.');
      }
    } catch (err) {
      setError('Unable to validate ZIP code. Please check your internet connection.');
    }
  };

  const handleGeolocation = () => {
    setIsGettingLocation(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get zipcode/city
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const location: UserLocation = {
              coordinates: { lat: latitude, lng: longitude },
              radius,
              zipcode: data.postcode || '',
              city: data.city || data.locality || '',
              state: data.principalSubdivision || ''
            };
            setZipcode(location.zipcode || '');
            saveLocation(location);
          } else {
            const location: UserLocation = {
              coordinates: { lat: latitude, lng: longitude },
              radius
            };
            saveLocation(location);
          }
        } catch (err) {
          setError('Unable to get location details');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setError('Unable to get your location. Please enter your ZIP code manually.');
        setIsGettingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const radiusOptions = [5, 10, 25, 50, 100];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin size={20} style={{ color: currentTheme.secondary }} />
          Your Location
        </h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>

      {showSettings && (
        <div className="bg-black bg-opacity-30 rounded-lg p-4 space-y-4">
          <form onSubmit={handleZipcodeSubmit} className="space-y-3">
            <div>
              <label className="block text-sm opacity-75 mb-1">ZIP Code</label>
              <input
                type="text"
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value)}
                placeholder="Enter 5-digit ZIP code"
                className="w-full px-3 py-2 bg-white bg-opacity-10 rounded border border-white border-opacity-20 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2"
                style={{ focusRing: currentTheme.secondary }}
                maxLength={5}
                pattern="\d{5}"
              />
            </div>

            <div>
              <label className="block text-sm opacity-75 mb-1">
                Search Radius: {radius} miles
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: currentTheme.secondary }}
              />
              <div className="flex justify-between text-xs opacity-60 mt-1">
                {radiusOptions.map(r => (
                  <span key={r}>{r}mi</span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded font-semibold transition-all hover:scale-105"
                style={{ 
                  backgroundColor: currentTheme.secondary, 
                  color: currentTheme.accent 
                }}
                disabled={!zipcode}
              >
                Set Location
              </button>
              
              <button
                type="button"
                onClick={handleGeolocation}
                disabled={isGettingLocation}
                className="px-4 py-2 rounded border border-white border-opacity-30 hover:bg-white hover:bg-opacity-10 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Target size={16} />
                {isGettingLocation ? 'Getting...' : 'Auto'}
              </button>
            </div>
          </form>

          {error && (
            <div className="text-red-400 text-sm bg-red-500 bg-opacity-20 rounded px-3 py-2">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSetup;