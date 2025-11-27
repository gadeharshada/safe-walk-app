export interface Incident {
  id: number;
  type: 'Crime' | 'Accident' | 'Lighting' | 'Harassment' | 'Other';
  severity: 'high' | 'medium' | 'low';
  name: string;
  location: string;
  lat: number;
  lng: number;
  timestamp: string;
  description: string;
}

export interface Route {
  id: number;
  name: string;
  start: string;
  end: string;
  distance: string; // Changed to string for formatted "3.2 km"
  duration: string; // Changed to string for formatted "15 min"
  safetyScore: number;
  lighting: number;
  traffic: number;
  crowd: number;
  incidents: number;
  color: string;
  description: string;
  coordinates: [number, number][]; // [lat, lng]
}

export interface Contact {
  id: number;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  verified: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  userType: string;
  emergencyContacts: Contact[];
}

export interface AppSettings {
  minSafetyScore: number;
  avoidUnlitAreas: boolean;
  avoidCrowds: boolean;
  travelMode: 'walking' | 'bike' | 'car' | 'transit';
  notifications: {
    push: boolean;
    sms: boolean;
    email: boolean;
  }
}

export type Page = 'landing' | 'login' | 'signup' | 'map' | 'safety_hub' | 'offline' | 'contacts' | 'profile' | 'settings';