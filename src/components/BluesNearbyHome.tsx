import { useState, useEffect } from 'react';
import { Music, MapPin, Calendar, Bell, User, Home, Map, Loader, RefreshCw } from 'lucide-react';
import LocationSetup, { UserLocation } from './LocationSetup';
import { ticketmasterApi, TicketmasterEvent, TicketmasterApiService } from '../services/ticketmasterApi';
import { calculateDistance, formatDistance, Coordinates } from '../utils/distance';
import ApiUsageModal from './ApiUsageModal';
import ApiUsageIndicator from './ApiUsageIndicator';

interface BluesEvent {
  id: string;
  artist: string;
  venue: string;
  time: string;
  date: string;
  distance: string;
  style: string;
  image: string;
  ticketUrl?: string;
  priceRange?: string;
  address?: string;
  city?: string;
  state?: string;
}

const BluesNearbyHome = () => {
  const [theme, setTheme] = useState('bbking');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [events, setEvents] = useState<BluesEvent[]>([]);
  const [todayEvents, setTodayEvents] = useState<BluesEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [dateFilter, setDateFilter] = useState<'tonight' | 'week' | 'month'>('week');
  
  // API usage tracking
  const [apiUsageModal, setApiUsageModal] = useState<{
    isOpen: boolean;
    type: 'confirmation' | 'warning' | 'error';
    title: string;
    message: string;
    usageStats: any;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'confirmation',
    title: '',
    message: '',
    usageStats: null
  });
  const [usageStats, setUsageStats] = useState(ticketmasterApi.getRateLimiter().getUsageStats());
  const [pendingSearch, setPendingSearch] = useState<(() => Promise<void>) | null>(null);
  
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

  const transformTicketmasterEvent = (event: TicketmasterEvent, userCoords?: Coordinates): BluesEvent => {
    const venue = event._embedded.venues[0];
    const venueCoords: Coordinates = {
      lat: parseFloat(venue.location.latitude),
      lng: parseFloat(venue.location.longitude)
    };
    
    const distance = userCoords 
      ? formatDistance(calculateDistance(userCoords, venueCoords))
      : 'Unknown';

    const eventDate = new Date(event.dates.start.dateTime || `${event.dates.start.localDate}T${event.dates.start.localTime || '20:00'}`);
    const timeStr = event.dates.start.localTime || eventDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });

    const priceRange = event.priceRanges?.[0] 
      ? `$${event.priceRanges[0].min} - $${event.priceRanges[0].max}`
      : undefined;

    // Get artist name from attractions or event name
    const artist = event._embedded.attractions?.[0]?.name || event.name;

    // Determine blues subgenre/style
    const subGenre = event.classifications[0]?.subGenre?.name || 'Contemporary Blues';

    return {
      id: event.id,
      artist,
      venue: venue.name,
      time: timeStr,
      date: eventDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'numeric', 
        day: 'numeric' 
      }),
      distance,
      style: subGenre,
      image: '🎤', // Could use event.images[0]?.url for real images
      ticketUrl: event.url,
      priceRange,
      address: venue.address?.line1,
      city: venue.city?.name,
      state: venue.state?.stateCode
    };
  };

  const executeSearch = async (location: UserLocation, period: 'tonight' | 'week' | 'month' = 'week') => {
    if (!location) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { start, end } = TicketmasterApiService.getDateRange(period);
      let apiResponse;
      
      if (location.zipcode) {
        apiResponse = await ticketmasterApi.searchEventsByLocation(
          location.zipcode,
          location.radius,
          start,
          end
        );
      } else if (location.coordinates) {
        apiResponse = await ticketmasterApi.searchEventsByCoordinates(
          location.coordinates.lat,
          location.coordinates.lng,
          location.radius,
          start,
          end
        );
      } else {
        throw new Error('No location data available');
      }

      // Update usage stats
      setUsageStats(apiResponse.rateLimitInfo.usageStats);

      // Handle rate limiting
      if (!apiResponse.rateLimitInfo.allowed) {
        const reason = apiResponse.rateLimitInfo.reason || '';
        
        // Don't show modal for network/fetch errors - just set error message
        if (reason.includes('Failed to fetch') || reason.includes('ERR_INSUFFICIENT_RESOURCES') || reason.includes('API Error')) {
          console.log('Network error detected, not showing modal:', reason);
          setHasNetworkError(true);
          setConsecutiveErrors(prev => prev + 1);
          setError('Unable to connect to Ticketmaster API. Please check your internet connection and try again.');
          return;
        }
        
        if (apiResponse.rateLimitInfo.requiresConfirmation) {
          // Show confirmation modal
          setApiUsageModal({
            isOpen: true,
            type: 'confirmation',
            title: 'API Usage Confirmation',
            message: reason || 'Continue with API request?',
            usageStats: apiResponse.rateLimitInfo.usageStats,
            onConfirm: () => {
              ticketmasterApi.getRateLimiter().confirmContinue();
              setApiUsageModal({ ...apiUsageModal, isOpen: false });
              executeSearch(location, period); // Retry the search
            }
          });
          return;
        } else {
          // Show error/warning modal only for rate limiting, not network errors
          setApiUsageModal({
            isOpen: true,
            type: reason.includes('limit') ? 'error' : 'warning',
            title: 'API Usage Limit',
            message: reason || 'API request blocked',
            usageStats: apiResponse.rateLimitInfo.usageStats
          });
          setError(reason || 'API request blocked');
          return;
        }
      }

      // Process successful response
      setHasNetworkError(false); // Reset network error flag on successful API call
      setConsecutiveErrors(0); // Reset error counter on success
      const response = apiResponse.data;
      if (response?._embedded?.events) {
        const transformedEvents = response._embedded.events.map(event => 
          transformTicketmasterEvent(event, location.coordinates)
        );
        
        setEvents(transformedEvents);
        
        // Filter for today's events
        const today = new Date().toDateString();
        const todaysEvents = transformedEvents.filter(event => 
          new Date(event.date).toDateString() === today
        );
        setTodayEvents(todaysEvents);
      } else {
        setEvents([]);
        setTodayEvents([]);
      }
    } catch (err) {
      console.error('Error searching events:', err);
      setHasNetworkError(true);
      setConsecutiveErrors(prev => prev + 1);
      setError('Unable to load blues events. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const searchEvents = (location: UserLocation, period: 'tonight' | 'week' | 'month' = 'week') => {
    executeSearch(location, period);
  };

  useEffect(() => {
    if (userLocation && !hasNetworkError && consecutiveErrors < 3) {
      searchEvents(userLocation, dateFilter);
    } else if (consecutiveErrors >= 3) {
      console.log('🛑 Stopping auto-retry after 3 consecutive errors');
      setError('Multiple connection failures. Please click refresh to try again.');
    }
  }, [userLocation, dateFilter, hasNetworkError, consecutiveErrors]);

  const handleLocationSet = (location: UserLocation) => {
    setUserLocation(location);
  };

  const handleRefresh = () => {
    if (userLocation) {
      setHasNetworkError(false); // Reset network error flag on manual retry
      setConsecutiveErrors(0); // Reset error counter on manual retry
      setError(null);
      searchEvents(userLocation, dateFilter);
    }
  };

  const featuredEvent = todayEvents[0] || events[0];
  const recommendedEvents = events.slice(0, 3);

  return (
    <div className="min-h-screen text-white" style={{ background: currentTheme.background }}>
      <div className="fixed inset-0 flex items-center justify-center opacity-5 text-white text-[20rem] select-none pointer-events-none">
        {currentTheme.watermark}
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center p-4 bg-black bg-opacity-30 backdrop-blur">
          <div className="flex items-center gap-2">
            <MapPin size={20} style={{ color: currentTheme.secondary }} />
            <span className="text-sm">
              {userLocation?.city && userLocation?.state 
                ? `${userLocation.city}, ${userLocation.state}`
                : userLocation?.zipcode || 'Set Location'
              }
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ApiUsageIndicator
              usageStats={usageStats}
              usageLevel={ticketmasterApi.getRateLimiter().getUsageLevel()}
              currentTheme={currentTheme}
              onClick={() => setApiUsageModal({
                isOpen: true,
                type: 'warning',
                title: 'API Usage Stats',
                message: `You've made ${usageStats.sessionCount} API calls this session.`,
                usageStats
              })}
            />
            <button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="hover:bg-white hover:bg-opacity-10 p-1 rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <div className="relative">
              <Bell size={24} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {events.length > 99 ? '99+' : events.length}
              </span>
            </div>
            <User size={24} />
          </div>
        </div>
        
        <div className="p-4 bg-black bg-opacity-20">
          <LocationSetup onLocationSet={handleLocationSet} currentTheme={currentTheme} />
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

        {/* Date Filter */}
        <div className="p-4">
          <div className="flex gap-2 mb-4">
            {['tonight', 'week', 'month'].map((period) => (
              <button
                key={period}
                onClick={() => setDateFilter(period as any)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  dateFilter === period
                    ? 'ring-2 ring-white'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: dateFilter === period ? currentTheme.primary : 'rgba(255,255,255,0.1)'
                }}
              >
                {period === 'tonight' ? 'Tonight' : `This ${period}`}
              </button>
            ))}
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="p-4 flex items-center justify-center">
            <Loader className="animate-spin" size={24} />
            <span className="ml-2">Finding blues events near you...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4">
            <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg p-3">
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Featured Event */}
        {featuredEvent && !isLoading && (
          <div className="p-4">
            <div 
              className="rounded-xl p-6 shadow-2xl"
              style={{ 
                backgroundColor: currentTheme.primary,
                borderLeft: `4px solid ${currentTheme.secondary}`
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className={`text-2xl font-bold ${currentTheme.fontStyle}`}>
                  {dateFilter === 'tonight' ? "Tonight's Featured Blues" : "Featured Blues Event"}
                </h2>
                <span className="text-3xl">🎺</span>
              </div>
              <h3 className="text-xl mb-2">{featuredEvent.artist}</h3>
              <div className="flex items-center gap-4 text-sm opacity-90 mb-2">
                <span className="flex items-center gap-1">
                  <MapPin size={16} /> {featuredEvent.venue}
                </span>
                <span>{featuredEvent.date} at {featuredEvent.time}</span>
                <span className="bg-black bg-opacity-20 px-2 py-1 rounded">{featuredEvent.distance}</span>
              </div>
              {featuredEvent.priceRange && (
                <div className="text-sm opacity-75 mb-3">
                  Tickets: {featuredEvent.priceRange}
                </div>
              )}
              <button 
                onClick={() => featuredEvent.ticketUrl && window.open(featuredEvent.ticketUrl, '_blank')}
                className="px-6 py-2 rounded-full font-semibold transition-all hover:scale-105"
                style={{ backgroundColor: currentTheme.secondary, color: currentTheme.accent }}
                disabled={!featuredEvent.ticketUrl}
              >
                Get Tickets
              </button>
            </div>
          </div>
        )}
        
        {/* Recommended Shows */}
        {recommendedEvents.length > 0 && !isLoading && (
          <div className="p-4">
            <h3 className={`text-lg font-bold mb-3 ${currentTheme.fontStyle}`} style={{ color: currentTheme.secondary }}>
              Because You Love {currentTheme.name}
            </h3>
            <div className="space-y-2">
              {recommendedEvents.map((event) => (
                <div 
                  key={event.id}
                  className="bg-black bg-opacity-30 rounded-lg p-3 backdrop-blur border border-white border-opacity-10"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{event.artist}</h4>
                      <div className="text-sm opacity-75 flex items-center gap-3">
                        <span>{event.date}</span>
                        <span>{event.venue}</span>
                        {event.city && event.state && (
                          <span>{event.city}, {event.state}</span>
                        )}
                      </div>
                      {event.priceRange && (
                        <div className="text-xs opacity-60 mt-1">{event.priceRange}</div>
                      )}
                    </div>
                    <span 
                      className="text-sm px-2 py-1 rounded"
                      style={{ backgroundColor: currentTheme.primary + '40' }}
                    >
                      {event.distance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Events Message */}
        {!isLoading && events.length === 0 && userLocation && (
          <div className="p-4">
            <div className="bg-black bg-opacity-30 rounded-lg p-6 text-center">
              <Music size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Blues Events Found</h3>
              <p className="text-sm opacity-75 mb-4">
                No blues concerts found within {userLocation.radius} miles of your location for the selected time period.
              </p>
              <button
                onClick={() => setDateFilter('month')}
                className="px-4 py-2 rounded-full"
                style={{ backgroundColor: currentTheme.secondary, color: currentTheme.accent }}
              >
                Try Next Month
              </button>
            </div>
          </div>
        )}
        
        {/* Bottom Navigation */}
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

        {/* Bottom padding for fixed navigation */}
        <div className="h-20"></div>
      </div>

      {/* API Usage Modal */}
      <ApiUsageModal
        isOpen={apiUsageModal.isOpen}
        onClose={() => {
          console.log('Force closing modal');
          setApiUsageModal({ 
            isOpen: false, 
            type: 'confirmation', 
            title: '', 
            message: '', 
            usageStats: null 
          });
        }}
        onConfirm={apiUsageModal.onConfirm || (() => {
          console.log('Force closing modal via confirm');
          setApiUsageModal({ 
            isOpen: false, 
            type: 'confirmation', 
            title: '', 
            message: '', 
            usageStats: null 
          });
        })}
        onCancel={() => {
          console.log('Force closing modal via cancel');
          setApiUsageModal({ 
            isOpen: false, 
            type: 'confirmation', 
            title: '', 
            message: '', 
            usageStats: null 
          });
        }}
        type={apiUsageModal.type}
        title={apiUsageModal.title}
        message={apiUsageModal.message}
        usageStats={apiUsageModal.usageStats || usageStats}
        currentTheme={currentTheme}
      />
    </div>
  );
};

export default BluesNearbyHome;