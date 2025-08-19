import React, { useState } from 'react';
import { Music, MapPin, Calendar, Bell, User, Home, Map, Users, Search } from 'lucide-react';

const BluesNearbyHome = () => {
  const [theme, setTheme] = useState('bbking');
  
  const themes = {
    bbking: {
      name: 'B.B. King',
      primary: '#6B46C1',
      secondary: '#FFD700',
      accent: '#1F2937',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      fontStyle: 'font-serif',
      watermark: '♪',
      tagline: 'The Thrill Is On'
    },
    buddyguy: {
      name: 'Buddy Guy',
      primary: '#DC2626',
      secondary: '#F59E0B',
      accent: '#111827',
      background: 'linear-gradient(135deg, #2D1B69 0%, #0F172A 100%)',
      fontStyle: 'font-sans',
      watermark: '🎸',
      tagline: 'Damn Right, I\'ve Got The Blues'
    },
    muddywaters: {
      name: 'Muddy Waters',
      primary: '#92400E',
      secondary: '#FCD34D',
      accent: '#1F2937',
      background: 'linear-gradient(135deg, #3E2723 0%, #1A1A1A 100%)',
      fontStyle: 'font-serif',
      watermark: '♫',
      tagline: 'Chicago Blues Legend'
    },
    susantedeschi: {
      name: 'Susan Tedeschi',
      primary: '#0891B2',
      secondary: '#FB923C',
      accent: '#1E293B',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0c1f3d 100%)',
      fontStyle: 'font-sans',
      watermark: '♪',
      tagline: 'Modern Blues Soul'
    }
  };
  
  const currentTheme = themes[theme as keyof typeof themes];
  
  const tonightShows = [
    {
      id: 1,
      artist: "Chicago Blues All-Stars",
      venue: "Buddy Guy's Legends",
      time: "8:00 PM",
      distance: "2.3 mi",
      style: "Chicago Blues",
      image: "🎤"
    },
    {
      id: 2,
      artist: "Sarah Johnson Trio",
      venue: "Kingston Mines",
      time: "9:30 PM",
      distance: "3.1 mi",
      style: "Contemporary Blues",
      image: "🎸"
    }
  ];
  
  const recommendedShows = [
    { artist: "Johnny Williams Band", date: "Fri 8/23", venue: "Rosa's Lounge", distance: "4.2 mi" },
    { artist: "Blues Heritage Ensemble", date: "Sat 8/24", venue: "BLUES Chicago", distance: "1.8 mi" },
    { artist: "Delta Soul Review", date: "Sun 8/25", venue: "House of Blues", distance: "2.7 mi" }
  ];
  
  const localArtists = [
    { name: "Marcus King Jr.", instrument: "Guitar", nextShow: "Aug 28" },
    { name: "Ruby Washington", instrument: "Vocals", nextShow: "Sep 2" },
    { name: "Tommy 'Blues' Mitchell", instrument: "Harmonica", nextShow: "Aug 30" },
    { name: "The Chicago Horns", instrument: "Brass Section", nextShow: "Sep 5" }
  ];

  return (
    <div className="min-h-screen text-white" style={{ background: currentTheme.background }}>
      <div className="fixed inset-0 flex items-center justify-center opacity-5 text-white text-[20rem] select-none pointer-events-none">
        {currentTheme.watermark}
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center p-4 bg-black bg-opacity-30 backdrop-blur">
          <div className="flex items-center gap-2">
            <MapPin size={20} style={{ color: currentTheme.secondary }} />
            <span className="text-sm">Chicago - South Side</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell size={24} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </div>
            <User size={24} />
          </div>
        </div>
        
        <div className="p-4 bg-black bg-opacity-20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm opacity-75">Your Blues Theme</h3>
            <span className="text-xs opacity-50">{currentTheme.tagline}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(themes).map(([key, artistTheme]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  theme === key 
                    ? 'ring-2 ring-white' 
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{ 
                  backgroundColor: artistTheme.primary,
                  color: 'white'
                }}
              >
                {artistTheme.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4">
          <div 
            className="rounded-xl p-6 shadow-2xl"
            style={{ 
              backgroundColor: currentTheme.primary,
              borderLeft: `4px solid ${currentTheme.secondary}`
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className={`text-2xl font-bold ${currentTheme.fontStyle}`}>Tonight's Featured Blues</h2>
              <span className="text-3xl">🎺</span>
            </div>
            <h3 className="text-xl mb-2">{tonightShows[0].artist}</h3>
            <div className="flex items-center gap-4 text-sm opacity-90">
              <span className="flex items-center gap-1">
                <MapPin size={16} /> {tonightShows[0].venue}
              </span>
              <span>{tonightShows[0].time}</span>
              <span className="bg-black bg-opacity-20 px-2 py-1 rounded">{tonightShows[0].distance}</span>
            </div>
            <button 
              className="mt-4 px-6 py-2 rounded-full font-semibold transition-all hover:scale-105"
              style={{ backgroundColor: currentTheme.secondary, color: currentTheme.accent }}
            >
              Get Tickets
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className={`text-lg font-bold mb-3 ${currentTheme.fontStyle}`} style={{ color: currentTheme.secondary }}>
            Because You Love {currentTheme.name}
          </h3>
          <div className="space-y-2">
            {recommendedShows.map((show, index) => (
              <div 
                key={index}
                className="bg-black bg-opacity-30 rounded-lg p-3 backdrop-blur border border-white border-opacity-10"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{show.artist}</h4>
                    <div className="text-sm opacity-75 flex items-center gap-3">
                      <span>{show.date}</span>
                      <span>{show.venue}</span>
                    </div>
                  </div>
                  <span 
                    className="text-sm px-2 py-1 rounded"
                    style={{ backgroundColor: currentTheme.primary + '40' }}
                  >
                    {show.distance}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className={`text-lg font-bold mb-3 ${currentTheme.fontStyle}`} style={{ color: currentTheme.secondary }}>
            Discover Local Blues
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {localArtists.map((artist, index) => (
              <div 
                key={index}
                className="bg-black bg-opacity-30 rounded-lg p-3 backdrop-blur border border-white border-opacity-10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-2xl">
                    🎵
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{artist.name}</h4>
                    <p className="text-xs opacity-75">{artist.instrument}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs opacity-75">Next: {artist.nextShow}</span>
                  <button 
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ 
                      backgroundColor: currentTheme.secondary + '30',
                      color: currentTheme.secondary 
                    }}
                  >
                    Follow
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-90 backdrop-blur border-t border-white border-opacity-10">
          <div className="flex justify-around items-center py-3">
            <button className="flex flex-col items-center gap-1" style={{ color: currentTheme.secondary }}>
              <Home size={24} />
              <span className="text-xs">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 opacity-60">
              <Map size={24} />
              <span className="text-xs">Map</span>
            </button>
            <button className="flex flex-col items-center gap-1 opacity-60">
              <Calendar size={24} />
              <span className="text-xs">Calendar</span>
            </button>
            <button className="flex flex-col items-center gap-1 opacity-60">
              <Music size={24} />
              <span className="text-xs">Artists</span>
            </button>
            <button className="flex flex-col items-center gap-1 opacity-60">
              <Bell size={24} />
              <span className="text-xs">Alerts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BluesNearbyHome;