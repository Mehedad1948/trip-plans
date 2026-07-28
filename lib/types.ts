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

export interface TripMember {
  id: number;
  userId: number;
  slug: string;
  displayName: string;
  role: string;
}

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
}

export interface PackingItem {
  id: number;
  label: string;
  isPacked: boolean;
  assignedMemberId: number | null;
}

export interface PackingCategory {
  id: number;
  name: string;
  items: PackingItem[];
}

export interface ChatMessage {
  id: number;
  body: string;
  createdAt: string;
  author: TripMember;
}

export interface ExpenseParticipant {
  memberId: number;
  displayName: string;
  shareAmount: number;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  createdAt: string;
  payer: TripMember;
  recordedBy: TripMember;
  participants: ExpenseParticipant[];
}

export interface MemberBalance {
  member: TripMember;
  paid: number;
  owed: number;
  balance: number;
}

export interface Settlement {
  from: TripMember;
  to: TripMember;
  amount: number;
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
  slug: string;
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
  members: TripMember[];
  days: TripDay[];
  locations: Location[];
  foods: Food[];
  packing: PackingCategory[];
  messages: ChatMessage[];
  expenses: Expense[];
  balances: MemberBalance[];
  settlements: Settlement[];
  safety: SafetyTip[];
  emergency: EmergencyContact[];
}
