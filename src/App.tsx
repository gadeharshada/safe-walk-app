
import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Map as MapIcon, Users, AlertTriangle, Settings, 
  LogOut, Menu, X, Navigation, ChevronRight, 
  Bell, CheckCircle, AlertCircle, PhoneCall, UserPlus,
  Moon, Sun, Volume2, Plus, Trash2, Loader2, MapPin, Flag, Eye,
  ArrowRight, CornerUpRight, Clock, Phone, Wifi, WifiOff, Download,
  BarChart3, Calendar, Zap, Car, Bike, Bus, Footprints, Sliders
} from 'lucide-react';
import { MOCK_INCIDENTS, MOCK_USER } from './mockData';
import type { Incident, Route, User, Page, AppSettings, Contact } from './types';

const TOMTOM_API_KEY = 'YhsCKeh4g9fRkS2YEta9Isj3KH3pkttI';

// --- Helper: TomTom API Calls ---

const getSuggestions = async (query: string) => {
  if (query.length < 3) return [];
  try {
    const response = await fetch(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${TOMTOM_API_KEY}&typeahead=true&limit=5`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Search failed", error);
    return [];
  }
};

const resolveAddressToCoords = async (query: string): Promise<{lat: number, lon: number, address: string} | null> => {
  try {
    const results = await getSuggestions(query);
    if (results && results.length > 0) {
      return {
        lat: results[0].position.lat,
        lon: results[0].position.lon,
        address: results[0].address.freeformAddress
      };
    }
    return null;
  } catch (e) {
    return null;
  }
};

const calculateRoute = async (start: [number, number], end: [number, number]): Promise<any | null> => {
  try {
    const response = await fetch(
      `https://api.tomtom.com/routing/1/calculateRoute/${start[0]},${start[1]}:${end[0]},${end[1]}/json?key=${TOMTOM_API_KEY}&instructionsType=text&routeRepresentation=polyline`
    );
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0];
    }
    return null;
  } catch (error) {
    console.error("Routing failed", error);
    return null;
  }
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// --- Reusable Components ---

// 1. Location Autocomplete Component
interface LocationSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (coords: [number, number] | null) => void;
  placeholder: string;
  icon: React.ReactNode;
}

const LocationSearchInput = ({ 
  value, 
  onChange, 
  onSelect, 
  placeholder, 
  icon 
}: LocationSearchInputProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length > 2) {
        setIsLoading(true);
        const results = await getSuggestions(value);
        setSuggestions(results);
        setIsLoading(false);
        setShowDropdown(true);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    };
    
    const timer = setTimeout(fetchSuggestions, 400); 
    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = (result: any) => {
    onChange(result.address.freeformAddress);
    onSelect([result.position.lat, result.position.lon]);
    setShowDropdown(false);
  };

  const handleClear = () => {
    onChange('');
    onSelect(null);
  };

  return (
    <div ref={wrapperRef} className="relative group w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-blue-500 z-10">
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : icon}
      </div>
      
      <input 
        type="text" 
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          onSelect(null); 
        }}
        onFocus={() => value.length > 2 && setShowDropdown(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full pl-10 pr-10 py-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none hover:border-blue-300 relative z-0" 
      />

      {value && (
        <button 
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition z-10"
        >
          <X size={14} />
        </button>
      )}
      
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-64 overflow-y-auto z-[100] animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5">
          {suggestions.map((item: any) => (
            <div 
              key={item.id}
              onClick={() => handleSelect(item)}
              className="p-3.5 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700 last:border-0 flex items-start gap-3 transition-colors"
            >
              <MapPin size={16} className="mt-0.5 text-slate-400 shrink-0" />
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm leading-tight">{item.address.freeformAddress}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.address.country}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 2. Map Component (Using Leaflet with TomTom Tiles)
const LeafletMap = ({ 
  incidents, 
  selectedRoute, 
  isNavigating 
}: { 
  incidents: Incident[], 
  selectedRoute: Route | null,
  isNavigating: boolean
}) => {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const routeLayerGroupRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const map = L.map(containerRef.current, {
      zoomControl: false 
    }).setView([40.7580, -73.9855], 13);

    L.tileLayer(`https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`, {
      attribution: '&copy; <a href="https://tomtom.com">TomTom</a>',
      maxZoom: 22
    }).addTo(map);

    if (!isNavigating) {
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    mapRef.current = map;
    
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map when data changes
  useEffect(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    // Clear previous incident markers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Remove old route layers
    if (routeLayerGroupRef.current) {
      map.removeLayer(routeLayerGroupRef.current);
      routeLayerGroupRef.current = null;
    }

    // Add Incident Markers
    incidents.forEach(inc => {
      const color = inc.severity === 'high' ? '#ef4444' : inc.severity === 'medium' ? '#f59e0b' : '#3b82f6';
      
      const marker = L.circleMarker([inc.lat, inc.lng], {
        radius: 8,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-3 min-w-[200px]">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full" style="background:${color}"></span>
            <strong class="block text-sm font-bold text-gray-900">${inc.type}</strong>
          </div>
          <span class="text-xs text-gray-500 block mb-2">${inc.timestamp}</span>
          <p class="text-xs text-gray-700 leading-relaxed">${inc.description}</p>
        </div>
      `);
    });

    // Add Route if selected
    if (selectedRoute && selectedRoute.coordinates.length > 0) {
      const group = L.layerGroup().addTo(map);
      routeLayerGroupRef.current = group;

      // 1. Route Border (Outline) for visibility
      L.polyline(selectedRoute.coordinates, {
        color: '#ffffff',
        weight: 10,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(group);

      // 2. Main Route Line
      L.polyline(selectedRoute.coordinates, {
        color: selectedRoute.color,
        weight: 6,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(group);
      
      if (isNavigating) {
        const startPoint = selectedRoute.coordinates[0];
        map.setView(startPoint, 18, { animate: true, duration: 1.5 });
      } else {
        const bounds = L.latLngBounds(selectedRoute.coordinates);
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      const startPoint = selectedRoute.coordinates[0];
      const endPoint = selectedRoute.coordinates[selectedRoute.coordinates.length - 1];

      L.marker(startPoint).addTo(group).bindPopup(`<div class="p-2 text-center"><b>Start</b><br>${selectedRoute.start}</div>`);
      L.marker(endPoint).addTo(group).bindPopup(`<div class="p-2 text-center"><b>Destination</b><br>${selectedRoute.end}</div>`);
    }

  }, [incidents, selectedRoute, isNavigating]);

  return <div ref={containerRef} className="w-full h-full z-0 outline-none" />;
};

const getSafetyColor = (score: number) => {
  if (score >= 80) return 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
  if (score >= 60) return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
  return 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
};

// --- View Components ---

interface LandingViewProps {
  setCurrentPage: (page: Page) => void;
}
const LandingView = ({ setCurrentPage }: LandingViewProps) => (
  <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans selection:bg-blue-100 transition-colors duration-300">
    <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-500">
        <Shield size={32} className="fill-blue-700 dark:fill-blue-500 text-white dark:text-slate-900" />
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">SafeWalk</span>
      </div>
      <div className="flex gap-4">
        <button onClick={() => setCurrentPage('login')} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:text-blue-700 dark:hover:text-blue-400 transition">Sign In</button>
        <button onClick={() => setCurrentPage('signup')} className="px-6 py-2.5 bg-blue-900 dark:bg-blue-600 text-white rounded-full font-medium hover:bg-blue-800 dark:hover:bg-blue-700 transition shadow-lg shadow-blue-900/20 dark:shadow-none hover:shadow-xl">Get Started</button>
      </div>
    </nav>

    <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 dark:bg-blue-900/40 rounded-full blur-[100px] opacity-40 -z-10 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-100 dark:bg-indigo-900/40 rounded-full blur-[100px] opacity-40 -z-10 animate-pulse delay-700"></div>

      <div className="max-w-4xl text-center animate-in zoom-in-95 duration-700 slide-in-from-bottom-8">
        <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-semibold mb-8 border border-blue-100 dark:border-blue-800 shadow-sm">
          <Shield size={14} /> #1 Rated Personal Safety App
        </span>
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-8 leading-tight tracking-tight">
          Navigate the world with <br className="hidden md:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400">absolute confidence.</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Real-time safety scores, community-driven incident reporting, and instant SOS alerts. SafeWalk empowers you to choose the safest path, day or night.
        </p>
        <div className="flex flex-col md:flex-row gap-5 justify-center">
            <button onClick={() => setCurrentPage('signup')} className="px-8 py-4 bg-blue-700 dark:bg-blue-600 text-white text-lg rounded-2xl font-bold hover:bg-blue-800 dark:hover:bg-blue-700 transition shadow-xl shadow-blue-200 dark:shadow-blue-900/20 flex items-center justify-center gap-2 transform hover:-translate-y-1">
              Start Your Safe Journey <ChevronRight />
            </button>
            <button className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-lg rounded-2xl font-bold hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2 shadow-sm">
              <PhoneCall size={20} /> Emergency Hotlines
            </button>
        </div>
      </div>
    </div>
  </div>
);

interface LoginViewProps {
  setCurrentPage: (page: Page) => void;
  setUser: (user: User) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}
const LoginView = ({ setCurrentPage, setUser, showToast }: LoginViewProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please fill in all fields.", "error");
      return;
    }
    if (!isValidEmail(email)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setUser(MOCK_USER); 
        setCurrentPage('map'); 
        showToast('Welcome back!', 'success');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-[80px] opacity-50"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-100 dark:bg-purple-900/20 rounded-full blur-[80px] opacity-50"></div>
       </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 dark:border-slate-800/50 animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 shadow-inner">
            <Shield size={40} className="fill-blue-600 dark:fill-blue-400 text-white dark:text-slate-900" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-2 text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8 font-medium">Sign in to access your safe routes</p>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" 
              className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white" 
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            New to SafeWalk? <button onClick={() => setCurrentPage('signup')} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Create account</button>
          </p>
          <button onClick={() => setCurrentPage('landing')} className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium hover:underline">Back to Home</button>
        </div>
      </div>
    </div>
  );
};

interface SignupViewProps {
  setCurrentPage: (page: Page) => void;
  setUser: (user: User) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}
const SignupView = ({ setCurrentPage, setUser, showToast }: SignupViewProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      showToast("All fields (Name, Email, Phone, Password) are compulsory.", "error");
      return;
    }
    if (!isValidEmail(email)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    if (phone.replace(/[^0-9]/g, '').length < 10) {
        showToast("Please enter a valid phone number (at least 10 digits).", "error");
        return;
    }
    if (password.length < 6) {
        showToast("Password must be at least 6 characters.", "error");
        return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setUser({ ...MOCK_USER, name: name, email: email }); 
        setCurrentPage('map');
        showToast('Account created successfully!', 'success');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-[80px] opacity-50"></div>
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-[80px] opacity-50"></div>
       </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 dark:border-slate-800/50 animate-in fade-in zoom-in-95 duration-500 relative z-10 my-10">
        <div className="flex justify-center mb-6">
           <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 shadow-inner">
            <UserPlus size={40} />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-2 text-slate-900 dark:text-white tracking-tight">Create Account</h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8 font-medium">Join the community keeping everyone safe</p>
        
        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">Full Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe" 
              className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">Email <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" 
              className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">Phone Number <span className="text-red-500">*</span></label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000" 
              className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">Password <span className="text-red-500">*</span></label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password" 
              className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white" 
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Sign Up"}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Already have an account? <button onClick={() => setCurrentPage('login')} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Sign in</button>
          </p>
          <button onClick={() => setCurrentPage('landing')} className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium hover:underline">Back to Home</button>
        </div>
      </div>
    </div>
  );
};

interface SafetyHubViewProps {
  incidents: Incident[];
  setIncidents: (incidents: Incident[]) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}
const SafetyHubView = ({ incidents, setIncidents, showToast }: SafetyHubViewProps) => {
  const [reportType, setReportType] = useState('Suspicious Activity');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      showToast("Please describe the incident.", "error");
      return;
    }
    setIsSubmitting(true);
    
    setTimeout(() => {
        const newIncident: Incident = {
          id: Date.now(),
          type: reportType as any,
          severity: 'medium',
          name: reportType,
          location: 'Current Location',
          lat: 40.7580 + (Math.random() * 0.01 - 0.005),
          lng: -73.9855 + (Math.random() * 0.01 - 0.005),
          timestamp: 'Just now',
          description: description
        };
        
        setIncidents([newIncident, ...incidents]);
        setIsSubmitting(false);
        setDescription('');
        showToast("Incident reported to the community.", "success");
    }, 1200);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <AlertTriangle className="text-red-600 fill-red-100 dark:fill-red-900/30" /> Safety Hub
            </h1>
            <p className="text-slate-500 dark:text-slate-400 ml-11 mt-1 font-medium">Community-powered incident reporting & alerts</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
            <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-100 dark:border-red-800">
                        <span className="text-red-600 dark:text-red-400 font-bold text-3xl block mb-1">{incidents.length}</span>
                        <span className="text-red-800 dark:text-red-300 text-xs font-bold uppercase tracking-wider">Active Alerts</span>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-3xl block mb-1">1.2k</span>
                        <span className="text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">Safe Users</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                        <Flag size={20} className="text-blue-500" /> Report Incident
                    </h2>
                    <form onSubmit={handleReportSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Type</label>
                            <select 
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-slate-700 dark:text-slate-200"
                            >
                                <option>Suspicious Activity</option>
                                <option>Lighting Issue</option>
                                <option>Harassment</option>
                                <option>Accident</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Description</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe what you saw..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition h-32 resize-none text-slate-700 dark:text-slate-200"
                            ></textarea>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Report"}
                        </button>
                    </form>
                </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-6 text-white relative overflow-hidden min-h-[200px] flex flex-col justify-end shadow-lg">
                    <div className="absolute inset-0 bg-[url('https://api.tomtom.com/map/1/staticimage?layer=basic&style=main&format=png&zoom=12&center=-73.9855,40.7580&width=400&height=300&key=YhsCKeh4g9fRkS2YEta9Isj3KH3pkttI')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    <div className="relative z-10">
                        <h3 className="font-bold text-xl mb-2">Safety Heatmap</h3>
                        <p className="text-sm text-slate-300 mb-4">Visualize high-risk zones based on historical data.</p>
                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-xl text-sm font-bold transition">View Full Map</button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                            <Eye size={20} className="text-blue-500" /> Live Community Feed
                        </h2>
                        <span className="text-xs font-medium px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Live
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-slate-900/30 max-h-[400px]">
                        {incidents.map(inc => (
                            <div key={inc.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition flex gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 
                                    ${inc.severity === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 
                                      inc.severity === 'medium' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                    {inc.type === 'Lighting' ? <Moon size={24} /> : 
                                     inc.type === 'Crime' ? <AlertTriangle size={24} /> :
                                     inc.type === 'Harassment' ? <Volume2 size={24} /> : <AlertCircle size={24} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-slate-800 dark:text-white">{inc.name}</h3>
                                        <span className="text-xs font-medium text-slate-400">{inc.timestamp}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">{inc.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        <MapPin size={12} /> {inc.location}
                                        <span className={`px-2 py-0.5 rounded-md ml-auto uppercase text-[10px] tracking-wide font-bold
                                            ${inc.severity === 'high' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 
                                              inc.severity === 'medium' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                            {inc.severity} Severity
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

interface OfflineViewProps {
  savedRoutes: Route[];
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setSelectedRoute: (route: Route) => void;
  setCurrentPage: (page: Page) => void;
}
const OfflineView = ({ savedRoutes, showToast, setSelectedRoute, setCurrentPage }: OfflineViewProps) => {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <WifiOff className="text-slate-400" /> Offline Mode
        </h1>
        <p className="text-slate-500 dark:text-slate-400 ml-10 mt-1">Access maps and routes without internet</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Status Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Offline Status</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                <CheckCircle size={20} /> Maps Installed
              </div>
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                <CheckCircle size={20} /> {savedRoutes.length} Routes Cached
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
              <button className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center justify-center gap-2">
                <Download size={18} /> Download Region Map
              </button>
              <p className="text-xs text-center text-slate-400 mt-2">Approx. 70MB for local area</p>
            </div>
          </div>
        </div>

        {/* Saved Routes */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Saved Routes</h2>
          <div className="space-y-4">
            {savedRoutes.length > 0 ? (
              savedRoutes.map(route => (
                <div key={route.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{route.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                      <span>{route.start}</span>
                      <ArrowRight size={14} />
                      <span>{route.end}</span>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs font-medium text-slate-400">
                      <span>{route.distance}</span>
                      <span>•</span>
                      <span>{route.duration}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedRoute(route);
                      setCurrentPage('map');
                      showToast("Loaded offline route", "success");
                    }}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-md shadow-blue-200 dark:shadow-none"
                  >
                    Navigate
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <WifiOff size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No saved routes yet</p>
                <p className="text-sm text-slate-400 mt-1">Plan a route on the map and click "Download"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SettingsViewProps {
  user: User | null;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  updateUser: (updates: Partial<User>) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}
const SettingsView = ({ user, settings, setSettings, updateUser, showToast }: SettingsViewProps) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, email: user.email });
    }
  }, [user]);

  const handleDiscard = () => {
    if (user) {
      setFormData({ name: user.name, email: user.email });
      showToast("Changes discarded", "info");
    }
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast("Name and Email cannot be empty", "error");
      return;
    }
    updateUser({ name: formData.name, email: formData.email });
    showToast("Profile updated successfully", "success");
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="text-slate-400" /> Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 ml-10 mt-1">Manage your profile and safety preferences</p>
      </div>

      <div className="space-y-8">
        {/* Profile Settings */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
            <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm">01</span> 
            Profile Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" 
              />
            </div>
          </div>
          <div className="mt-6">
             <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Preferred Travel Mode</label>
             <div className="grid grid-cols-4 gap-4">
                {['walking', 'bike', 'car', 'transit'].map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setSettings({...settings, travelMode: mode as any})}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${settings.travelMode === mode ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        {mode === 'walking' && <Footprints size={20} />}
                        {mode === 'bike' && <Bike size={20} />}
                        {mode === 'car' && <Car size={20} />}
                        {mode === 'transit' && <Bus size={20} />}
                        <span className="text-xs mt-1 capitalize">{mode}</span>
                    </button>
                ))}
             </div>
          </div>
        </div>

        {/* Safety Preferences */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
             <span className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center text-sm">02</span> 
             Route Safety
          </h2>
          
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <div className="flex justify-between mb-3">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Minimum Safety Score</label>
                <span className="text-blue-600 dark:text-blue-400 font-bold bg-white dark:bg-slate-800 px-3 py-1 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">{settings.minSafetyScore}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={settings.minSafetyScore} 
                onChange={(e) => setSettings({...settings, minSafetyScore: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> Routes below this score will be flagged as unsafe.
              </p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><Moon size={18} /></div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Avoid Unlit Areas</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Prefer main roads with streetlights</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.avoidUnlitAreas} onChange={(e) => setSettings({...settings, avoidUnlitAreas: e.target.checked})} className="sr-only peer" />
                <div className="w-12 h-7 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg"><Users size={18} /></div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Avoid Large Crowds</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Route around heavy pedestrian traffic</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.avoidCrowds} onChange={(e) => setSettings({...settings, avoidCrowds: e.target.checked})} className="sr-only peer" />
                <div className="w-12 h-7 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
             <span className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-sm">03</span> 
             Notifications
          </h2>
          <div className="space-y-4">
              <label className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer">
                <input type="checkbox" checked={settings.notifications.push} onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, push: e.target.checked}})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Push Notifications for Safety Alerts</span>
              </label>
              <label className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer">
                <input type="checkbox" checked={settings.notifications.sms} onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, sms: e.target.checked}})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">SMS Alerts to Emergency Contacts</span>
              </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-4 pb-10">
          <button onClick={handleDiscard} className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition">Discard</button>
          <button onClick={handleSave} className="px-8 py-3 bg-slate-900 dark:bg-blue-600 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition shadow-lg shadow-slate-200 dark:shadow-none">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

interface ContactsViewProps {
  user: User | null;
  setUser: (user: User) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}
const ContactsView = ({ user, setUser, showToast }: ContactsViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: 'Friend' });

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) {
      showToast("Name and Phone are required", "error");
      return;
    }
    
    const contact: Contact = {
      id: Date.now(),
      name: newContact.name,
      phone: newContact.phone,
      relationship: newContact.relationship,
      isPrimary: false,
      verified: false
    };

    if (user) {
      setUser({
        ...user,
        emergencyContacts: [...user.emergencyContacts, contact]
      });
      showToast("Contact added successfully", "success");
      setIsModalOpen(false);
      setNewContact({ name: '', phone: '', relationship: 'Friend' });
    }
  };

  const handleDeleteContact = (id: number) => {
    if (user) {
      setUser({
        ...user,
        emergencyContacts: user.emergencyContacts.filter(c => c.id !== id)
      });
      showToast("Contact removed", "info");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* Emergency Card */}
      <div className="mb-8 bg-red-600 text-white p-6 rounded-3xl shadow-xl shadow-red-200 dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm animate-pulse">
                <Phone size={32} />
            </div>
            <div>
                <h2 className="text-2xl font-bold">Emergency SOS</h2>
                <p className="text-red-100">One-tap connection to local authorities</p>
            </div>
        </div>
        <button className="w-full md:w-auto px-8 py-4 bg-white text-red-600 font-bold text-lg rounded-xl hover:bg-red-50 transition shadow-lg flex items-center justify-center gap-2">
            <PhoneCall size={24} /> Call 112 / 911
        </button>
      </div>

      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="text-slate-400" /> Emergency Contacts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 ml-10">Trusted people to notify in case of emergency</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none transition transform hover:-translate-y-0.5"
        >
          <Plus size={20} /> Add Contact
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {user?.emergencyContacts.map(contact => (
          <div key={contact.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl border border-blue-100 dark:border-blue-800">
                {contact.name.charAt(0)}
              </div>
              <button onClick={() => handleDeleteContact(contact.id)} className="text-slate-300 hover:text-red-500 transition p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full">
                <Trash2 size={18} />
              </button>
            </div>
            
            <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-1">{contact.name}</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg font-medium">{contact.relationship}</span>
              {contact.isPrimary && <span className="px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-lg font-medium border border-yellow-200 dark:border-yellow-800">Primary</span>}
            </div>
            
            <div className="pt-4 border-t border-slate-50 dark:border-slate-700">
              <p className="font-mono text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Phone size={14} className="text-slate-400" /> {contact.phone}
              </p>
            </div>
          </div>
        ))}

        {/* Empty State for Grid */}
        <button onClick={() => setIsModalOpen(true)} className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition min-h-[200px] group">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3 group-hover:bg-white dark:group-hover:bg-slate-600 transition">
            <Plus size={24} />
          </div>
          <span className="font-medium">Add New Contact</span>
        </button>
      </div>

      {/* Add Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Contact</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddContact} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Name</label>
                <input 
                  type="text" 
                  value={newContact.name}
                  onChange={e => setNewContact({...newContact, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. Mom, Best Friend"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                <input 
                  type="tel" 
                  value={newContact.phone}
                  onChange={e => setNewContact({...newContact, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Relationship</label>
                <select 
                  value={newContact.relationship}
                  onChange={e => setNewContact({...newContact, relationship: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 dark:text-white"
                >
                  <option value="Friend">Friend</option>
                  <option value="Family">Family</option>
                  <option value="Partner">Partner</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 mt-4 transition shadow-lg shadow-blue-200 dark:shadow-none">
                Save Contact
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface MapDashboardProps {
  startAddress: string;
  setStartAddress: (val: string) => void;
  setStartCoords: (coords: [number, number] | null) => void;
  endAddress: string;
  setEndAddress: (val: string) => void;
  setEndCoords: (coords: [number, number] | null) => void;
  handleRouteSearch: () => void;
  isSearching: boolean;
  foundRoutes: Route[];
  selectedRoute: Route | null;
  setSelectedRoute: (route: Route | null) => void;
  incidents: Incident[];
  settings: AppSettings;
  addSavedRoute: (route: Route) => void;
}
const MapDashboard = ({
  startAddress, setStartAddress, setStartCoords,
  endAddress, setEndAddress, setEndCoords,
  handleRouteSearch, isSearching, foundRoutes,
  selectedRoute, setSelectedRoute, incidents,
  settings, addSavedRoute
}: MapDashboardProps) => {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleStartNavigation = () => {
    setIsNavigating(true);
  };

  const handleEndNavigation = () => {
    setIsNavigating(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden relative">
      
      {/* Standard Route Planning Sidebar - Hidden when navigating */}
      <div className={`w-full md:w-[420px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-1/2 md:h-full z-10 shadow-2xl transition-all duration-500 ${isNavigating ? '-translate-x-full absolute' : 'relative'}`}>
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 z-20">
          
          {/* Active Preferences Status Bar */}
          <div className="flex items-center gap-3 mb-6 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400">
             <div className="flex items-center gap-1">
                <Sliders size={14} /> Active:
             </div>
             <div className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded capitalize flex items-center gap-1">
                {settings.travelMode === 'car' && <Car size={12} />}
                {settings.travelMode === 'bike' && <Bike size={12} />}
                {settings.travelMode === 'walking' && <Footprints size={12} />}
                {settings.travelMode}
             </div>
             <div className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded flex items-center gap-1">
                <Shield size={12} /> {'>'}{settings.minSafetyScore}%
             </div>
          </div>

          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Plan Your Route</h2>
          <div className="space-y-4 relative">
            
            <div className="absolute left-[19px] top-[40px] bottom-[90px] w-0.5 bg-slate-200 dark:bg-slate-700 z-0 border-l-2 border-dashed border-slate-200 dark:border-slate-700"></div>

            <div className="relative z-30">
              <LocationSearchInput 
                  value={startAddress}
                  onChange={setStartAddress}
                  onSelect={setStartCoords}
                  placeholder="Starting Location"
                  icon={<div className="w-4 h-4 rounded-full border-[3px] border-slate-400 bg-white dark:bg-slate-800"></div>}
              />
            </div>

            <div className="relative z-20">
              <LocationSearchInput 
                  value={endAddress}
                  onChange={setEndAddress}
                  onSelect={setEndCoords}
                  placeholder="Destination"
                  icon={<MapPin size={20} className="text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900" />}
              />
            </div>
            
            <div className="pt-2 relative z-10">
              <button 
                onClick={handleRouteSearch}
                disabled={isSearching}
                className={`w-full py-3.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-base font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition shadow-lg shadow-slate-200 dark:shadow-none flex items-center justify-center gap-2 ${isSearching ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Calculating Safe Path...
                  </>
                ) : (
                  'Find Safe Route'
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
          {foundRoutes.length > 0 ? (
            <>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Routes</h3>
              {foundRoutes.map(route => (
                <div 
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`group p-5 rounded-2xl border cursor-pointer transition-all shadow-sm hover:shadow-md relative overflow-hidden ${selectedRoute?.id === route.id ? 'bg-white dark:bg-slate-800 border-blue-500 ring-1 ring-blue-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'}`}
                >
                  <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-xs font-bold border-b border-l ${getSafetyColor(route.safetyScore)}`}>
                    {route.safetyScore}% Safety Score
                  </div>

                  <div className="mb-3 pr-20">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{route.name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400 mb-3">
                    <span className="flex items-center gap-1.5 font-medium"><div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div> {route.distance}</span>
                    <span className="flex items-center gap-1.5 font-medium"><div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div> {route.duration}</span>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                    {route.description}
                  </p>

                  {/* Action Buttons */}
                  {selectedRoute?.id === route.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 animate-in fade-in flex gap-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStartNavigation();
                            }}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none"
                        >
                            <Navigation size={18} /> Start
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                addSavedRoute(route);
                            }}
                            className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                            title="Download for Offline Use"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="text-center text-slate-400 mt-12">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Navigation className="opacity-20 text-slate-600 dark:text-slate-300" size={40} />
              </div>
              <p className="font-medium text-slate-500 dark:text-slate-400">Enter locations to find safe paths.</p>
              <p className="text-sm mt-1">We analyze lighting, crowds, and incidents.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Map Area */}
      <div className="flex-1 relative h-1/2 md:h-full bg-slate-100 dark:bg-slate-900">
          <LeafletMap incidents={incidents} selectedRoute={selectedRoute} isNavigating={isNavigating} />
          
          {/* NAVIGATION OVERLAY */}
          {isNavigating && selectedRoute && (
            <div className="absolute top-0 left-0 right-0 z-[500] p-4 animate-in slide-in-from-top-4">
                <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between max-w-2xl mx-auto border border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-500 p-3 rounded-xl">
                            <CornerUpRight size={32} className="text-white" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Next Turn</p>
                            <h3 className="text-xl font-bold">Head Northeast on Main St</h3>
                            <p className="text-sm text-slate-300 mt-1">Then turn right in 200m</p>
                        </div>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="flex items-center gap-2 justify-end">
                            <Clock size={16} className="text-green-400" />
                            <span className="font-mono font-bold text-lg">{selectedRoute.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-end text-slate-400 text-sm">
                            <ArrowRight size={14} />
                            <span>{selectedRoute.distance}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleEndNavigation}
                        className="ml-4 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg font-bold text-sm hover:bg-red-500/30 transition"
                    >
                        End Trip
                    </button>
                </div>
            </div>
          )}

          {/* Standard Floating Controls - Only show when NOT navigating */}
          {!isNavigating && (
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
                <button className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition" title="Current Location">
                    <Navigation size={20} />
                </button>
            </div>
          )}
      </div>
    </div>
  );
};

// --- Dashboard Layout Wrapper ---
const DashboardLayout = ({ 
  children, 
  currentPage, 
  setCurrentPage, 
  setSidebarOpen, 
  sidebarOpen, 
  handleLogout,
  darkMode,
  toggleTheme
}: { 
  children?: React.ReactNode, 
  currentPage: Page, 
  setCurrentPage: (p: Page) => void, 
  setSidebarOpen: (o: boolean) => void, 
  sidebarOpen: boolean, 
  handleLogout: () => void,
  darkMode: boolean,
  toggleTheme: () => void
}) => (
  <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
    <aside className={`
      fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-900 dark:bg-slate-950 text-white transform transition-transform duration-300 ease-in-out shadow-2xl
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-bold text-2xl tracking-tight">
          <Shield className="fill-blue-600 text-slate-900 dark:text-white" size={28} /> SafeWalk
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white"><X /></button>
      </div>

      <nav className="px-4 space-y-2 mt-4">
        <button onClick={() => {setCurrentPage('map'); setSidebarOpen(false)}} className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-xl transition font-medium text-sm ${currentPage === 'map' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <MapIcon size={20} /> Route Map
        </button>
        <button onClick={() => {setCurrentPage('safety_hub'); setSidebarOpen(false)}} className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-xl transition font-medium text-sm ${currentPage === 'safety_hub' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <AlertTriangle size={20} /> Safety Hub
        </button>
        <button onClick={() => {setCurrentPage('offline'); setSidebarOpen(false)}} className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-xl transition font-medium text-sm ${currentPage === 'offline' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <WifiOff size={20} /> Offline Mode
        </button>
        <button onClick={() => {setCurrentPage('contacts'); setSidebarOpen(false)}} className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-xl transition font-medium text-sm ${currentPage === 'contacts' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <Users size={20} /> Contacts
        </button>
        <button onClick={() => {setCurrentPage('settings'); setSidebarOpen(false)}} className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-xl transition font-medium text-sm ${currentPage === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <Settings size={20} /> Settings
        </button>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-5 py-4 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition font-medium text-sm border border-slate-800 hover:border-slate-700">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />} 
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition font-medium text-sm border border-slate-800 hover:border-slate-700">
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    </aside>

    <main className="flex-1 flex flex-col h-full overflow-hidden relative">
      <header className="md:hidden h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 z-20 shadow-sm">
        <button onClick={() => setSidebarOpen(true)} className="text-slate-600 dark:text-slate-300 p-2"><Menu /></button>
        <span className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2"><Shield className="text-blue-600 fill-current" size={18}/> SafeWalk</span>
        <div className="w-6"></div>
      </header>

      <div className="flex-1 overflow-y-auto relative bg-slate-50 dark:bg-slate-950">
        {children}
      </div>
    </main>
  </div>
);

// --- Main App ---

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [darkMode, setDarkMode] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<Route[]>([]);
  
  const [startAddress, setStartAddress] = useState("Central Park, NY");
  const [endAddress, setEndAddress] = useState("Empire State Building, NY");
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);
  const [foundRoutes, setFoundRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [showNotification, setShowNotification] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>({
    minSafetyScore: 60,
    avoidUnlitAreas: true,
    avoidCrowds: false,
    travelMode: 'walking',
    notifications: { push: true, sms: true, email: false }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const showToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setShowNotification({ msg, type });
    setTimeout(() => setShowNotification(null), 3000);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('landing');
    showToast('Signed out successfully', 'info');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const addSavedRoute = (route: Route) => {
    if (!savedRoutes.some(r => r.id === route.id)) {
        setSavedRoutes([...savedRoutes, route]);
        showToast("Route saved for offline use", "success");
    } else {
        showToast("Route already saved", "info");
    }
  };

  useEffect(() => {
    let interval: any;
    if (sosActive && sosCountdown > 0) {
      interval = setInterval(() => setSosCountdown(c => c - 1), 1000);
    } else if (sosActive && sosCountdown === 0) {
      showToast('ALERTS SENT TO ALL EMERGENCY CONTACTS', 'error');
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [sosActive, sosCountdown]);

  const triggerSOS = () => {
    setSosActive(true);
    setSosCountdown(5);
  };

  const cancelSOS = () => {
    setSosActive(false);
    setSosCountdown(5);
    showToast('SOS Cancelled', 'info');
  };

  const handleRouteSearch = async () => {
    setIsSearching(true);
    setFoundRoutes([]); 

    let sCoords = startCoords;
    let eCoords = endCoords;

    if (!sCoords && startAddress) {
       const resolved = await resolveAddressToCoords(startAddress);
       if (resolved) {
         sCoords = [resolved.lat, resolved.lon];
         setStartCoords(sCoords);
         setStartAddress(resolved.address); 
       }
    }

    if (!eCoords && endAddress) {
       const resolved = await resolveAddressToCoords(endAddress);
       if (resolved) {
         eCoords = [resolved.lat, resolved.lon];
         setEndCoords(eCoords);
         setEndAddress(resolved.address); 
       }
    }

    if (!sCoords || !eCoords) {
      showToast("Could not resolve one or more locations. Please select valid locations.", "error");
      setIsSearching(false);
      return;
    }

    try {
      const routeData = await calculateRoute(sCoords, eCoords);
      if (!routeData) throw new Error("No route found between these locations.");

      const coordinates: [number, number][] = routeData.legs[0].points.map((pt: any) => [pt.latitude, pt.longitude]);
      const distanceMeters = routeData.summary.lengthInMeters;
      const durationSeconds = routeData.summary.travelTimeInSeconds;

      const simulatedScore = Math.floor(Math.random() * (100 - 60) + 60); 

      const newRoute: Route = {
        id: Date.now(),
        name: "Recommended Route",
        start: startAddress,
        end: endAddress,
        distance: (distanceMeters / 1000).toFixed(1) + " km",
        duration: Math.ceil(durationSeconds / 60) + " min",
        safetyScore: simulatedScore,
        lighting: simulatedScore > 80 ? 90 : 60,
        traffic: 50,
        crowd: 50,
        incidents: simulatedScore > 80 ? 0 : 3,
        color: simulatedScore > 80 ? '#10B981' : '#F59E0B',
        description: "Fastest path calculated by TomTom.",
        coordinates: coordinates
      };

      setFoundRoutes([newRoute]);
      setSelectedRoute(newRoute);
      showToast("Route calculated successfully!", "success");

    } catch (err: any) {
      showToast(err.message || "Failed to calculate route", "error");
    } finally {
      setIsSearching(false);
    }
  };
  
  if (currentPage === 'landing') return <LandingView setCurrentPage={setCurrentPage} />;
  if (currentPage === 'login') return <LoginView setCurrentPage={setCurrentPage} setUser={setUser} showToast={showToast} />;
  if (currentPage === 'signup') return <SignupView setCurrentPage={setCurrentPage} setUser={setUser} showToast={showToast} />;

  return (
    <>
      <DashboardLayout
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
        darkMode={darkMode}
        toggleTheme={toggleTheme}
      >
        {currentPage === 'map' && (
          <MapDashboard 
            startAddress={startAddress}
            setStartAddress={setStartAddress}
            setStartCoords={setStartCoords}
            endAddress={endAddress}
            setEndAddress={setEndAddress}
            setEndCoords={setEndCoords}
            handleRouteSearch={handleRouteSearch}
            isSearching={isSearching}
            foundRoutes={foundRoutes}
            selectedRoute={selectedRoute}
            setSelectedRoute={setSelectedRoute}
            incidents={incidents}
            settings={settings}
            addSavedRoute={addSavedRoute}
          />
        )}
        {currentPage === 'settings' && (
          <SettingsView 
            user={user} 
            settings={settings} 
            setSettings={setSettings} 
            showToast={showToast}
            updateUser={updateUser}
          />
        )}
        {currentPage === 'contacts' && (
          <ContactsView 
            user={user} 
            setUser={setUser} 
            showToast={showToast}
          />
        )}
        {currentPage === 'safety_hub' && (
            <SafetyHubView incidents={incidents} setIncidents={setIncidents} showToast={showToast} />
        )}
        {currentPage === 'offline' && (
            <OfflineView 
                savedRoutes={savedRoutes} 
                showToast={showToast} 
                setSelectedRoute={setSelectedRoute}
                setCurrentPage={setCurrentPage}
            />
        )}
      </DashboardLayout>

      {!sosActive ? (
        <button 
          onClick={triggerSOS}
          className="fixed bottom-8 right-8 z-50 bg-red-600 text-white w-18 h-18 md:w-20 md:h-20 rounded-full shadow-2xl flex items-center justify-center hover:bg-red-700 transition hover:scale-105 animate-pulse-red group"
        >
          <span className="font-bold text-xl group-hover:hidden">SOS</span>
          <PhoneCall className="hidden group-hover:block" size={32} />
        </button>
      ) : (
        <div className="fixed inset-0 z-[100] bg-red-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in duration-300">
          <AlertTriangle size={80} className="mb-6 animate-bounce" />
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">SOS ACTIVATED</h2>
          <p className="text-xl mb-10 opacity-90">Notifying emergency contacts in</p>
          <div className="text-[10rem] font-bold mb-12 leading-none">{sosCountdown}</div>
          <button 
            onClick={cancelSOS}
            className="bg-white text-red-600 px-12 py-5 rounded-2xl font-bold text-xl hover:bg-red-50 transition shadow-xl transform hover:scale-105"
          >
            CANCEL ALERT
          </button>
        </div>
      )}

      {showNotification && (
        <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 animate-in slide-in-from-top-5 duration-300 ${
          showNotification.type === 'success' ? 'bg-green-600' : 
          showNotification.type === 'error' ? 'bg-red-600' : 'bg-slate-800'
        }`}>
          {showNotification.type === 'success' ? <CheckCircle size={20}/> : 
           showNotification.type === 'error' ? <AlertCircle size={20}/> : <Bell size={20}/>}
          {showNotification.msg}
        </div>
      )}
    </>
  );
}
