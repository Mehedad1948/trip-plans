export interface Activity {
  id: number;
  time: string;
  title: string;
  description: string;
  location: string;
  category: string;
  duration: string;
}

export interface TripDay {
  id: number;
  dayNumber: number;
  weekday: string;
  title: string;
  overnightCity: string;
  summary: string;
  drivingDistance: number;
  drivingDuration: string;
  activities: Activity[];
}

export interface Location {
  id: number;
  name: string;
  province: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  imageTitle: string;
  imageUrl: string;
}

export interface Food {
  id: number;
  name: string;
  city: string;
  description: string;
}

export interface PackingCategory {
  id: number;
  name: string;
  items: Array<{ id: number; label: string }>;
}

export interface SafetyTip {
  id: number;
  title: string;
  description: string;
  level: string;
}

export interface EmergencyContact {
  id: number;
  name: string;
  number: string;
}

export interface TripPlan {
  id: number;
  title: string;
  description: string;
  startLocation: string;
  endLocation: string;
  durationDays: number;
  route: string;
  totalDistance: number;
  totalDriveDuration: string;
  bestSeason: string;
  heroImage: string;
  metadata: {
    travelStyle?: string;
    pace?: string;
    vehicle?: string;
  };
  days: TripDay[];
  locations: Location[];
  foods: Food[];
  packing: PackingCategory[];
  safety: SafetyTip[];
  emergency: EmergencyContact[];
}
