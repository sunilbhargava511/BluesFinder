export interface Coordinates {
  lat: number;
  lng: number;
}

export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates,
  unit: 'miles' | 'km' = 'miles'
): number {
  const R = unit === 'miles' ? 3959 : 6371; // Earth's radius in miles or km
  
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLon = toRadians(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function formatDistance(distance: number, unit: 'miles' | 'km' = 'miles'): string {
  const unitLabel = unit === 'miles' ? 'mi' : 'km';
  return `${distance} ${unitLabel}`;
}

export async function getCoordinatesFromZipcode(zipcode: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipcode}`);
    if (response.ok) {
      const data = await response.json();
      return {
        lat: parseFloat(data.places[0]['latitude']),
        lng: parseFloat(data.places[0]['longitude'])
      };
    }
  } catch (error) {
    console.error('Error geocoding zipcode:', error);
  }
  return null;
}