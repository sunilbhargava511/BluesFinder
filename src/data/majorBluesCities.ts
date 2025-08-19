export interface MajorBluesCity {
  name: string;
  zipcode: string;
  coordinates: { lat: number; lng: number };
  radius: number;
  description: string;
  bluesVenues: string[];
}

export const MAJOR_BLUES_CITIES: MajorBluesCity[] = [
  {
    name: "Chicago",
    zipcode: "60601",
    coordinates: { lat: 41.8781, lng: -87.6298 },
    radius: 40,
    description: "The birthplace of electric blues",
    bluesVenues: ["Buddy Guy's Legends", "Kingston Mines", "Rosa's Lounge", "BLUES Chicago"]
  },
  {
    name: "Memphis",
    zipcode: "38103",
    coordinates: { lat: 35.1495, lng: -90.0490 },
    radius: 30,
    description: "Home of Beale Street blues",
    bluesVenues: ["B.B. King's Blues Club", "Rum Boogie Cafe", "Blues City Cafe"]
  },
  {
    name: "New Orleans",
    zipcode: "70112",
    coordinates: { lat: 29.9511, lng: -90.0715 },
    radius: 25,
    description: "The cradle of jazz and blues",
    bluesVenues: ["House of Blues", "Preservation Hall", "Tipitina's"]
  },
  {
    name: "Nashville",
    zipcode: "37201",
    coordinates: { lat: 36.1627, lng: -86.7816 },
    radius: 35,
    description: "Music City with rich blues heritage",
    bluesVenues: ["B.B. King's Blues Club", "The Bluegrass Inn", "3rd & Lindsley"]
  },
  {
    name: "Austin",
    zipcode: "78701",
    coordinates: { lat: 30.2672, lng: -97.7431 },
    radius: 30,
    description: "Live Music Capital with thriving blues scene",
    bluesVenues: ["Antone's", "The Continental Club", "Stevie Ray Vaughan Memorial"]
  },
  {
    name: "Atlanta",
    zipcode: "30309",
    coordinates: { lat: 33.7490, lng: -84.3880 },
    radius: 40,
    description: "Southern blues and soul music hub",
    bluesVenues: ["Blind Willie's", "The Tabernacle", "Center Stage"]
  },
  {
    name: "St. Louis",
    zipcode: "63101",
    coordinates: { lat: 38.6270, lng: -90.1994 },
    radius: 30,
    description: "Gateway to the blues",
    bluesVenues: ["BB's Jazz, Blues & Soups", "The Pageant", "Broadway Oyster Bar"]
  },
  {
    name: "Detroit",
    zipcode: "48201",
    coordinates: { lat: 42.3314, lng: -83.0458 },
    radius: 35,
    description: "Motor City blues and Motown",
    bluesVenues: ["Cliff Bell's", "The Majestic Theatre", "Baker's Keyboard Lounge"]
  },
  {
    name: "San Francisco",
    zipcode: "94102",
    coordinates: { lat: 37.7749, lng: -122.4194 },
    radius: 50,
    description: "West Coast blues scene",
    bluesVenues: ["The Fillmore", "Biscuits and Blues", "Warfield"]
  },
  {
    name: "Los Angeles",
    zipcode: "90028",
    coordinates: { lat: 34.0522, lng: -118.2437 },
    radius: 60,
    description: "Hollywood blues and entertainment",
    bluesVenues: ["House of Blues", "The Troubadour", "Whisky a Go Go"]
  },
  {
    name: "New York City",
    zipcode: "10001",
    coordinates: { lat: 40.7128, lng: -74.0060 },
    radius: 40,
    description: "Big Apple blues and jazz scene",
    bluesVenues: ["Blue Note", "B.B. King Blues Club & Grill", "Terra Blues"]
  },
  {
    name: "Kansas City",
    zipcode: "64108",
    coordinates: { lat: 39.0997, lng: -94.5786 },
    radius: 30,
    description: "Historic jazz and blues crossroads",
    bluesVenues: ["The Blue Room", "The Phoenix", "Knuckleheads Saloon"]
  },
  {
    name: "Denver",
    zipcode: "80202",
    coordinates: { lat: 39.7392, lng: -104.9903 },
    radius: 35,
    description: "Rocky Mountain blues scene",
    bluesVenues: ["Cervantes' Masterpiece Ballroom", "The Fillmore Auditorium", "Bluebird Theater"]
  },
  {
    name: "Dallas",
    zipcode: "75201",
    coordinates: { lat: 32.7767, lng: -96.7970 },
    radius: 45,
    description: "Texas blues tradition",
    bluesVenues: ["House of Blues", "Deep Ellum venues", "Billy Bob's Texas"]
  },
  {
    name: "Seattle",
    zipcode: "98101",
    coordinates: { lat: 47.6062, lng: -122.3321 },
    radius: 35,
    description: "Pacific Northwest music scene",
    bluesVenues: ["The Crocodile", "Dimitriou's Jazz Alley", "Tractor Tavern"]
  }
];

export function findNearestBluesCity(userCoordinates: { lat: number; lng: number }): MajorBluesCity {
  let nearestCity = MAJOR_BLUES_CITIES[0];
  let shortestDistance = Infinity;

  for (const city of MAJOR_BLUES_CITIES) {
    const distance = calculateDistance(
      userCoordinates,
      city.coordinates
    );
    
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestCity = city;
    }
  }

  return nearestCity;
}

// Haversine formula for distance calculation
function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLon = toRadians(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}