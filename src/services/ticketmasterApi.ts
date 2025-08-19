const TICKETMASTER_API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY;
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

export interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  images: Array<{ url: string; width: number; height: number }>;
  sales: {
    public: {
      startDateTime: string;
      endDateTime: string;
    };
  };
  dates: {
    start: {
      localDate: string;
      localTime: string;
      dateTime: string;
    };
  };
  classifications: Array<{
    primary: boolean;
    segment: { id: string; name: string };
    genre: { id: string; name: string };
    subGenre: { id: string; name: string };
  }>;
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  _embedded: {
    venues: Array<{
      id: string;
      name: string;
      type: string;
      url: string;
      locale: string;
      postalCode: string;
      timezone: string;
      city: { name: string };
      state: { name: string; stateCode: string };
      country: { name: string; countryCode: string };
      address: { line1: string };
      location: { longitude: string; latitude: string };
    }>;
    attractions?: Array<{
      id: string;
      name: string;
      type: string;
      url: string;
      images: Array<{ url: string; width: number; height: number }>;
      classifications: Array<{
        primary: boolean;
        segment: { id: string; name: string };
        genre: { id: string; name: string };
        subGenre: { id: string; name: string };
      }>;
    }>;
  };
}

export interface TicketmasterResponse {
  _embedded?: {
    events: TicketmasterEvent[];
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface SearchParams {
  postalCode?: string;
  latlong?: string;
  radius?: string;
  unit?: 'miles' | 'km';
  classificationName?: string;
  genreId?: string;
  startDateTime?: string;
  endDateTime?: string;
  sort?: string;
  size?: number;
  page?: number;
}

export class TicketmasterApiService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(endpoint: string, params: SearchParams): string {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private async makeRequest(endpoint: string, params: SearchParams): Promise<any> {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.data;
    }

    const searchParams = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      ...Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      ),
    });

    const url = `${BASE_URL}/${endpoint}?${searchParams}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the response
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('Ticketmaster API error:', error);
      throw error;
    }
  }

  async searchBluesEvents(params: SearchParams): Promise<TicketmasterResponse> {
    // Add blues-specific filtering
    const bluesParams: SearchParams = {
      ...params,
      classificationName: 'music',
      genreId: 'KnvZfZ7vAvd', // Blues genre ID
      sort: 'date,asc',
      size: params.size || 20,
    };

    return this.makeRequest('events.json', bluesParams);
  }

  async searchEventsByLocation(
    postalCode: string, 
    radiusMiles: number = 25,
    startDate?: string,
    endDate?: string
  ): Promise<TicketmasterResponse> {
    const params: SearchParams = {
      postalCode,
      radius: radiusMiles.toString(),
      unit: 'miles',
      startDateTime: startDate,
      endDateTime: endDate,
    };

    return this.searchBluesEvents(params);
  }

  async searchEventsByCoordinates(
    latitude: number,
    longitude: number,
    radiusMiles: number = 25,
    startDate?: string,
    endDate?: string
  ): Promise<TicketmasterResponse> {
    const params: SearchParams = {
      latlong: `${latitude},${longitude}`,
      radius: radiusMiles.toString(),
      unit: 'miles',
      startDateTime: startDate,
      endDateTime: endDate,
    };

    return this.searchBluesEvents(params);
  }

  // Helper method to get date ranges
  static getDateRange(period: 'tonight' | 'week' | 'month' | 'custom', customStart?: string, customEnd?: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'tonight':
        const tonight = new Date(today);
        const tomorrowMorning = new Date(today);
        tomorrowMorning.setDate(tonight.getDate() + 1);
        return {
          start: tonight.toISOString(),
          end: tomorrowMorning.toISOString(),
        };
      
      case 'week':
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        return {
          start: today.toISOString(),
          end: weekEnd.toISOString(),
        };
      
      case 'month':
        const monthEnd = new Date(today);
        monthEnd.setMonth(today.getMonth() + 1);
        return {
          start: today.toISOString(),
          end: monthEnd.toISOString(),
        };
      
      case 'custom':
        return {
          start: customStart,
          end: customEnd,
        };
      
      default:
        return {
          start: today.toISOString(),
          end: undefined,
        };
    }
  }
}

export const ticketmasterApi = new TicketmasterApiService();