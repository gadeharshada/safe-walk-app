import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { 
  Shield, Map as MapIcon, Users, AlertTriangle, Settings, 
  LogOut, Menu, X, 
  Bell, CheckCircle, AlertCircle, PhoneCall, 
  Moon, Sun, Plus, Loader2, MapPin, Flag, Eye,
  ArrowRight, CornerUpRight, WifiOff, 
  Car, Bike, Bus, Footprints, Globe, Signal, SignalZero, Locate,
  Sparkles, MessageSquare} from 'lucide-react';
import { MOCK_INCIDENTS, MOCK_USER, MOCK_ROUTES } from './mockData';
import type { Incident, Route, User, Page, AppSettings } from './types';

// Fallback Key for TomTom if backend fails
const TOMTOM_API_KEY = 'YhsCKeh4g9fRkS2YEta9Isj3KH3pkttI';
// Updated Backend URL
const API_BASE_URL = 'https://safewalk-10oe.onrender.com/api'; 

// --- Helper: Text to Speech ---
const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }
};

// --- Translation Data ---
type Language = 'en' | 'hi' | 'es';

const translations = {
  en: {
    welcome: "Welcome Back",
    signinSubtitle: "Sign in to access your safe routes",
    createAccount: "Create Account",
    signupSubtitle: "Join the community keeping everyone safe",
    email: "Email Address",
    password: "Password",
    fullName: "Full Name",
    phone: "Phone Number",
    signinBtn: "Sign In",
    signupBtn: "Sign Up",
    noAccount: "New to SafeWalk?",
    hasAccount: "Already have an account?",
    create: "Create account",
    signin: "Sign in",
    backHome: "Back to Home",
    guest: "Continue as Guest",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "••••••••",
    namePlaceholder: "John Doe",
    phonePlaceholder: "+1 555 000 0000",
  },
  hi: {
    welcome: "वापसी पर स्वागत है",
    signinSubtitle: "अपने सुरक्षित मार्ग देखने के लिए साइन इन करें",
    createAccount: "खाता बनाएं",
    signupSubtitle: "समुदाय में शामिल हों, सुरक्षित रहें",
    email: "ईमेल पता",
    password: "पासवर्ड",
    fullName: "पूरा नाम",
    phone: "फ़ोन नंबर",
    signinBtn: "साइन इन करें",
    signupBtn: "साइन अप करें",
    noAccount: "सेफवॉक पर नए हैं?",
    hasAccount: "क्या आपके पास पहले से एक खाता मौजूद है?",
    create: "खाता बनाएं",
    signin: "साइन इन करें",
    backHome: "मुखपृष्ठ पर वापस",
    guest: "अतिथि के रूप में जारी रखें",
    emailPlaceholder: "आप@example.com",
    passwordPlaceholder: "••••••••",
    namePlaceholder: "जॉन डो",
    phonePlaceholder: "+91 98765 43210",
  },
  es: {
    welcome: "Bienvenido de nuevo",
    signinSubtitle: "Inicia sesión para ver tus rutas seguras",
    createAccount: "Crear una cuenta",
    signupSubtitle: "Únete a la comunidad que nos mantiene seguros",
    email: "Correo electrónico",
    password: "Contraseña",
    fullName: "Nombre completo",
    phone: "Número de teléfono",
    signinBtn: "Iniciar sesión",
    signupBtn: "Regístrate",
    noAccount: "¿Nuevo en SafeWalk?",
    hasAccount: "¿Ya tienes una cuenta?",
    create: "Crear cuenta",
    signin: "Iniciar sesión",
    backHome: "Volver al inicio",
    guest: "Continuar como invitado",
    emailPlaceholder: "tu@ejemplo.com",
    passwordPlaceholder: "••••••••",
    namePlaceholder: "Juan Pérez",
    phonePlaceholder: "+1 555 000 0000",
  }
};

// --- Storage Helper ---
const storage = {
  saveRoutes: (routes: Route[]) => localStorage.setItem('offline_routes', JSON.stringify(routes)),
  getRoutes: (): Route[] => JSON.parse(localStorage.getItem('offline_routes') || '[]'),
  
  saveToken: (token: string) => localStorage.setItem('auth_token', token),
  getToken: () => localStorage.getItem('auth_token'),
  
  saveUser: (user: User) => localStorage.setItem('cached_user', JSON.stringify(user)),
  getUser: (): User | null => JSON.parse(localStorage.getItem('cached_user') || 'null'),
  
  saveHistory: (history: string[]) => localStorage.setItem('search_history', JSON.stringify(history)),
  getHistory: (): string[] => JSON.parse(localStorage.getItem('search_history') || '[]'),
  
  savePendingIncident: (incident: Incident) => {
    const pending = JSON.parse(localStorage.getItem('pending_incidents') || '[]');
    pending.push(incident);
    localStorage.setItem('pending_incidents', JSON.stringify(pending));
  },
  getPendingIncidents: (): Incident[] => JSON.parse(localStorage.getItem('pending_incidents') || '[]'),
  clearPendingIncidents: () => localStorage.removeItem('pending_incidents'),

  clear: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('cached_user');
    localStorage.removeItem('offline_routes');
    localStorage.removeItem('search_history');
    localStorage.removeItem('trip_history');
  }
};

// --- API Service Layer ---
const apiService = {
  login: async (email: string, password: string): Promise<User> => {
    if (!navigator.onLine) {
       const cached = storage.getUser();
       if (cached && cached.email === email) return cached;
       if (email === MOCK_USER.email) return MOCK_USER; // Offline mock fallback
       throw new Error("No internet connection. Cannot log in.");
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) throw new Error('Invalid credentials');
      
      const data = await response.json();
      const user = data.user || data; 
      storage.saveUser(user);
      return user;
    } catch (e) {
      console.warn("Backend login failed, using mock", e);
      return new Promise((resolve) => {
        setTimeout(() => {
            const user = MOCK_USER;
            storage.saveUser(user);
            resolve(user);
        }, 1000);
      });
    }
  },
  getIncidents: async (): Promise<Incident[]> => {
    if (!navigator.onLine) return [...MOCK_INCIDENTS, ...storage.getPendingIncidents()];
    try {
        const response = await fetch(`${API_BASE_URL}/incidents`);
        if (!response.ok) throw new Error("Failed to fetch incidents");
        const data = await response.json();
        return data.length ? data : MOCK_INCIDENTS;
    } catch (e) {
        console.warn("Backend incidents fetch failed, using mock");
        return MOCK_INCIDENTS;
    }
  },
  reportIncident: async (incident: Incident): Promise<boolean> => {
    if (!navigator.onLine) {
        const offlineIncident = { ...incident, pendingSync: true };
        storage.savePendingIncident(offlineIncident);
        return true;
    }
    try {
        await fetch(`${API_BASE_URL}/incidents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(incident)
        });
        return true;
    } catch (e) {
        // Backend failed, save offline
        const offlineIncident = { ...incident, pendingSync: true };
        storage.savePendingIncident(offlineIncident);
        return true;
    }
  },
  calculateRoute: async (startCoords: [number, number], endCoords: [number, number], mode: string): Promise<any> => {
    if (!navigator.onLine) return null;
    let tomtomMode = 'car';
    switch(mode) {
        case 'walking': tomtomMode = 'pedestrian'; break;
        case 'bike': tomtomMode = 'bicycle'; break;
        case 'transit': tomtomMode = 'bus'; break; 
        default: tomtomMode = 'car';
    }
    try {
        const response = await fetch(
            `https://api.tomtom.com/routing/1/calculateRoute/${startCoords[0]},${startCoords[1]}:${endCoords[0]},${endCoords[1]}/json?key=${TOMTOM_API_KEY}&instructionsType=text&routeRepresentation=polyline&travelMode=${tomtomMode}`
        );
        const data = await response.json();
        return data.routes ? data.routes[0] : null;
    } catch (e) {
        return null;
    }
  },
  triggerSOS: async (location: {lat: number, lng: number}) => {
    console.log("SOS Signal sent to backend at", location);
    try {
        fetch(`${API_BASE_URL}/sos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location, timestamp: new Date().toISOString() })
        }).catch(err => console.error("SOS Backend Error:", err));
    } catch (e) {
        console.error(e);
    }
    return true;
  },
  syncPendingData: async () => {
     if (!navigator.onLine) return;
     const pending = storage.getPendingIncidents();
     if (pending.length === 0) return;
     console.log("Syncing offline data...", pending);
     try {
         // Attempt batch upload if endpoint exists, or single loop
         // For now assumes /incidents accepts POST
         for (const inc of pending) {
             const { pendingSync, ...cleanInc } = inc;
             await fetch(`${API_BASE_URL}/incidents`, {
                 method: 'POST',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify(cleanInc)
             });
         }
         storage.clearPendingIncidents();
         return true;
     } catch (e) {
         console.warn("Sync failed", e);
         return false;
     }
  }
};

const getSuggestions = async (query: string) => {
  if (!navigator.onLine || query.length < 3) return [];
  try {
    const response = await fetch(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${TOMTOM_API_KEY}&typeahead=true&limit=5`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) { return []; }
};

const getSafetyColor = (score: number) => {
  if (score >= 80) return 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
  if (score >= 60) return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
  return 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// --- Components ---

const AmbientBackground = () => (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-400 dark:bg-purple-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-400 dark:bg-blue-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 dark:bg-pink-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
    </div>
);

const SOSOverlay = ({ onDismiss }: { onDismiss: () => void }) => (
    <div className="fixed inset-0 z-[1100] bg-red-600/95 backdrop-blur-xl flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 animate-pulse shadow-[0_0_60px_rgba(255,255,255,0.6)]">
             <AlertTriangle size={64} className="text-red-600" />
        </div>
        <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase text-center">SOS Sent</h1>
        <p className="text-xl font-medium mb-8 text-red-100 max-w-md text-center leading-relaxed px-4">
            Emergency contacts have been notified with your live location.
            Authorities are being contacted.
        </p>
        <button onClick={onDismiss} className="px-10 py-4 bg-white text-red-600 rounded-full font-bold text-lg hover:bg-red-50 transition shadow-xl transform hover:scale-105 active:scale-95 duration-200">
            I am Safe (Dismiss)
        </button>
    </div>
);

const AIAssistant = ({ incidents }: { incidents: Incident[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    {role: 'assistant', text: "Hello! I'm monitoring real-time incidents in your area. How can I help you stay safe today?"}
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userText = inputValue.trim();
    setMessages(prev => [...prev, {role: 'user', text: userText}]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let response = "I'm not sure about that, but you can check the Safety Hub for more details.";
      const lowerText = userText.toLowerCase();
      if (lowerText.includes('incident') || lowerText.includes('crime') || lowerText.includes('safe')) {
         const highSeverityCount = incidents.filter(i => i.severity === 'high').length;
         response = highSeverityCount > 0 
            ? `There are currently ${incidents.length} incidents reported nearby. ${highSeverityCount} are high severity. Please exercise caution.`
            : `The area seems relatively calm. There are ${incidents.length} minor reports nearby.`;
      } else if (lowerText.includes('sos') || lowerText.includes('help')) {
         response = "If you are in danger, please trigger the SOS button immediately or dial emergency services.";
      }
      setMessages(prev => [...prev, {role: 'assistant', text: response}]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="fixed bottom-32 right-8 z-[500] flex flex-col items-end pointer-events-none">
      {isOpen && (
         <div className="mb-4 pointer-events-auto w-80 bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 zoom-in-95 duration-300 overflow-hidden">
           <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-navy-900/50">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg"><Sparkles size={16} /></div>
             <div><h4 className="font-bold text-sm dark:text-white">Safety AI</h4><p className="text-[10px] text-slate-500 dark:text-slate-400">Online • Live</p></div>
             <button onClick={() => setIsOpen(false)} className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"><X size={16}/></button>
           </div>
           <div ref={scrollRef} className="h-64 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-navy-900 custom-scrollbar">
             {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-bl-none shadow-sm'}`}>{msg.text}</div>
                </div>
             ))}
             {isTyping && <div className="text-xs text-slate-400 ml-2">Typing...</div>}
           </div>
           <div className="p-3 bg-white dark:bg-navy-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
             <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask about safety..." className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-900 border-none outline-none dark:text-white focus:ring-1 focus:ring-blue-500 transition" />
             <button onClick={handleSend} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"><MessageSquare size={14} /></button>
           </div>
         </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="pointer-events-auto w-14 h-14 bg-gradient-to-tr from-blue-600 to-purple-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:scale-110 transition duration-300 animate-float">
        <MessageSquare size={24} className={isOpen ? 'hidden' : 'block'} />
        <X size={24} className={isOpen ? 'block' : 'hidden'} />
      </button>
    </div>
  );
};

const LanguageSwitcher = ({ lang, setLang }: { lang: Language, setLang: (l: Language) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages: {code: Language, label: string, flag: string}[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
    { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  ];

  return (
    <div className="relative z-50" ref={wrapperRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-slate-700 dark:text-white transition">
        <Globe size={18} />
        <span className="uppercase font-bold text-sm">{lang}</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-12 bg-white dark:bg-navy-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden w-40 animate-in fade-in zoom-in-95 duration-200">
           {languages.map(l => (
             <button key={l.code} onClick={() => { setLang(l.code); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-slate-700 transition ${lang === l.code ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
               <span className="text-lg">{l.flag}</span> {l.label}
             </button>
           ))}
        </div>
      )}
    </div>
  );
};

const LocationSearchInput = ({ value, onChange, onSelect, placeholder, icon, onUseCurrentLocation }: any) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length > 2) {
        setIsLoading(true);
        const results = await getSuggestions(value);
        setSuggestions(results);
        setIsLoading(false);
        setShowDropdown(true);
      } else { setSuggestions([]); }
    };
    const timer = setTimeout(fetchSuggestions, 400); 
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div ref={wrapperRef} className="relative group w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 z-10">{isLoading ? <Loader2 size={18} className="animate-spin" /> : icon}</div>
      <input type="text" value={value} onChange={(e) => { onChange(e.target.value); onSelect(null); }} onFocus={() => setShowDropdown(true)} placeholder={placeholder} className="w-full pl-10 pr-24 py-4 bg-white/50 dark:bg-navy-900/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
        {value && <button onClick={() => {onChange(''); onSelect(null)}} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>}
        {onUseCurrentLocation && <button onClick={onUseCurrentLocation} className="text-slate-400 hover:text-blue-600"><Locate size={18} /></button>}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white/95 dark:bg-navy-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-64 overflow-y-auto z-[100] ring-1 ring-black/5 custom-scrollbar">
          {suggestions.map((item: any) => (
            <div key={item.id} onClick={() => { onChange(item.address.freeformAddress); onSelect([item.position.lat, item.position.lon]); setShowDropdown(false); }} className="p-3.5 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700 flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 text-slate-400 shrink-0" />
              <div><p className="font-medium text-slate-800 dark:text-slate-200 text-sm leading-tight">{item.address.freeformAddress}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LeafletMap = ({ 
  incidents, selectedRoute, isNavigating, currentPosition, interactive = true, heatmapMode = false
}: { 
  incidents: Incident[], selectedRoute: Route | null, isNavigating: boolean, currentPosition?: [number, number] | null, interactive?: boolean, heatmapMode?: boolean
}) => {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const routeLayerGroupRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const markerLayerGroupRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    try {
      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false, dragging: interactive, scrollWheelZoom: interactive, doubleClickZoom: interactive }).setView([40.7580, -73.9855], 14);
      L.tileLayer(`https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`, { maxZoom: 22 }).addTo(map);
      if (interactive && !isNavigating) L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;
    } catch (e) {
      console.error("Map init failed", e);
    }
    return () => { 
        if (mapRef.current) {
            mapRef.current.remove(); 
            mapRef.current = null; 
        }
    };
  }, [interactive]); 

  useEffect(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    if (heatLayerRef.current) { map.removeLayer(heatLayerRef.current); heatLayerRef.current = null; }
    if (markerLayerGroupRef.current) { map.removeLayer(markerLayerGroupRef.current); markerLayerGroupRef.current = null; }

    if (heatmapMode) {
        if (L.heatLayer) {
            const heatPoints = incidents.map(i => [i.lat, i.lng, i.severity === 'high' ? 1.0 : i.severity === 'medium' ? 0.6 : 0.3]);
            heatLayerRef.current = L.heatLayer(heatPoints, { radius: 35, blur: 20, maxZoom: 14, minOpacity: 0.4, gradient: {0.2: 'blue', 0.4: 'cyan', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red'} }).addTo(map);
        }
    } else {
        const group = L.layerGroup().addTo(map);
        markerLayerGroupRef.current = group;
        incidents.forEach(inc => {
            const color = inc.severity === 'high' ? '#ef4444' : inc.severity === 'medium' ? '#f59e0b' : '#3b82f6';
            const marker = L.circleMarker([inc.lat, inc.lng], { radius: 8, fillColor: color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.8 }).addTo(group);
            if (interactive) marker.bindPopup(`<div class="p-2"><strong class="block text-sm font-bold text-gray-900">${inc.type}</strong><span class="text-xs text-gray-500">${inc.timestamp}</span><p class="text-xs mt-1">${inc.description}</p></div>`);
        });
    }
  }, [heatmapMode, incidents]);

  useEffect(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    if (routeLayerGroupRef.current) { map.removeLayer(routeLayerGroupRef.current); routeLayerGroupRef.current = null; }
    if (selectedRoute && selectedRoute.coordinates.length > 0) {
      const group = L.layerGroup().addTo(map);
      routeLayerGroupRef.current = group;
      L.polyline(selectedRoute.coordinates, { color: '#ffffff', weight: 8, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }).addTo(group);
      L.polyline(selectedRoute.coordinates, { color: isNavigating ? '#3b82f6' : selectedRoute.color, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(group);
      
      if (!isNavigating) { 
          map.fitBounds(L.latLngBounds(selectedRoute.coordinates), { padding: [50, 50] }); 
          L.marker(selectedRoute.coordinates[0]).addTo(group); 
          L.marker(selectedRoute.coordinates[selectedRoute.coordinates.length - 1]).addTo(group); 
      } else { 
          map.setView(selectedRoute.coordinates[0], 19); 
      }
    }
  }, [selectedRoute, isNavigating]);

  useEffect(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;
    if (isNavigating && currentPosition) {
        if (!userMarkerRef.current) {
            const icon = L.divIcon({ className: 'bg-transparent', html: `<div class="w-12 h-12 bg-blue-600/30 rounded-full flex items-center justify-center animate-pulse"><div class="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center transform"><div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-white transform -translate-y-0.5"></div></div></div>`, iconSize: [48, 48], iconAnchor: [24, 24] });
            userMarkerRef.current = L.marker(currentPosition, { icon, zIndexOffset: 1000 }).addTo(map);
        } else { userMarkerRef.current.setLatLng(currentPosition); }
        map.setView(currentPosition, 19, { animate: true, duration: 1.0, easeLinearity: 0.25 });
    } else if (userMarkerRef.current) { map.removeLayer(userMarkerRef.current); userMarkerRef.current = null; }
  }, [isNavigating, currentPosition]);

  return (
    <div className="w-full h-full relative map-perspective-container overflow-hidden bg-slate-100 dark:bg-navy-900">
        {!(window as any).L && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-navy-900 text-slate-500 z-50">
                <div className="text-center p-6 bg-white dark:bg-navy-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <MapIcon size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold mb-2">Map Unavailable</p>
                    <p className="text-xs max-w-xs">Scripts blocked. Check internet/settings.</p>
                </div>
            </div>
        )}
        <div ref={containerRef} className={`w-full h-full z-0 outline-none ${isNavigating ? 'map-3d-view' : 'map-standard-view'}`} />
    </div>
  );
};

// --- Full Component Definitions ---

interface LandingViewProps {
  setCurrentPage: (page: Page) => void;
  setDarkMode: (val: boolean) => void;
  darkMode: boolean;
}

const LandingView = ({ setCurrentPage, setDarkMode }: LandingViewProps) => {
  useEffect(() => { setDarkMode(true); }, []);

  return (
  <div className="min-h-screen bg-navy-900 text-white font-sans selection:bg-blue-500/30 relative overflow-x-hidden">
    <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-0 w-[50%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-20 right-0 w-[40%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-20 w-[60%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
    </div>

    <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full animate-in slide-in-from-top-4 duration-500 relative z-20">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Shield size={32} className="text-blue-500 fill-blue-500/20" />
          <div className="absolute inset-0 bg-blue-500/50 blur-lg rounded-full -z-10"></div>
        </div>
        <span className="text-2xl font-bold tracking-tight text-white">SafeWalk</span>
      </div>
      <div className="flex gap-4">
        <button onClick={() => setCurrentPage('login')} className="px-6 py-2.5 text-slate-300 font-medium hover:text-white transition glass-panel rounded-full hover:bg-white/10">Sign In</button>
        <button onClick={() => setCurrentPage('signup')} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition transform hover:-translate-y-0.5">Get Started</button>
      </div>
    </nav>

    <div className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-20 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-8 animate-in slide-in-from-left-8 duration-700">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.2)]"><Sparkles size={12} className="text-blue-400" /> Next Gen Safety</div>
             <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">Navigate with <br/><span className="text-gradient">Absolute Confidence</span></h1>
             <p className="text-lg text-slate-400 max-w-xl leading-relaxed">Experience the future of personal safety. AI-driven routing, real-time community intelligence, and 3D navigation in one premium interface.</p>
             <div className="flex flex-col sm:flex-row gap-5">
                <button onClick={() => setCurrentPage('signup')} className="px-8 py-4 bg-white text-navy-900 rounded-2xl font-bold text-lg hover:bg-blue-50 transition shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 transform hover:scale-105 duration-200">Start Your Journey <ArrowRight size={20} /></button>
                <button className="px-8 py-4 glass-panel text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition flex items-center justify-center gap-2 backdrop-blur-md">Watch Demo</button>
             </div>
        </div>
        <div className="flex-1 w-full h-[500px] relative scene-3d animate-in zoom-in-95 duration-1000 delay-200">
             <div className="absolute inset-0 object-3d animate-float">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-96 bg-navy-800/80 rounded-[40px] border border-blue-500/30 transform -rotate-y-12 rotate-x-12 translate-z-0 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col">
                    <div className="h-full w-full bg-gradient-to-b from-navy-800 to-navy-900 relative">
                        <div className="absolute inset-0 opacity-40 bg-[url('https://api.tomtom.com/map/1/staticimage?layer=basic&style=night&format=png&zoom=13&center=-73.9855,40.7580&width=400&height=600&key=YhsCKeh4g9fRkS2YEta9Isj3KH3pkttI')] bg-cover"></div>
                        <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"><path d="M 80 400 Q 150 300 120 200 T 250 100" stroke="#10b981" strokeWidth="4" fill="none" strokeDasharray="10 5" className="animate-pulse" /><circle cx="80" cy="400" r="6" fill="#10b981" /><circle cx="250" cy="100" r="6" fill="#3b82f6" /></svg>
                        <div className="absolute bottom-6 left-6 right-6 p-4 bg-navy-900/90 rounded-2xl border border-blue-500/30 transform translate-z-20 shadow-xl">
                             <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-green-400">SAFEST ROUTE</span><span className="text-xs font-bold text-white">12 min</span></div>
                             <button className="w-full py-2 bg-blue-600 rounded-lg text-xs font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">Start Navigation</button>
                        </div>
                    </div>
                 </div>
                 <div className="absolute top-20 right-10 p-4 glass-panel rounded-2xl animate-float-delayed transform translate-z-30 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-l-4 border-green-500">
                    <div className="flex items-center gap-3"><div className="p-2 bg-green-500/20 rounded-lg text-green-400"><CheckCircle size={20} /></div><div><p className="text-xs font-bold text-slate-300">Safety Score</p><p className="text-xl font-bold text-white">98%</p></div></div>
                 </div>
             </div>
        </div>
    </div>
  </div>
)};

interface LoginViewProps {
  setCurrentPage: (page: Page) => void;
  setUser: (user: User) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  lang: Language;
  setLang: (l: Language) => void;
}
const LoginView = ({ setCurrentPage, setUser, showToast, lang, setLang }: LoginViewProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please fill in all fields.", "error");
      return;
    }
    setIsLoading(true);
    try {
        const user = await apiService.login(email, password);
        storage.saveToken('mock_token_123');
        setUser(user); 
        setCurrentPage('map'); 
        showToast('Welcome back!', 'success');
    } catch (err: any) {
        showToast(err.message || 'Login failed', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const t = translations[lang];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-900 relative overflow-hidden transition-colors duration-300">
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0"><div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-purple-600/30 rounded-full mix-blend-screen filter blur-3xl opacity-60 animate-blob"></div></div>
      <div className="absolute top-6 right-6 z-50"><LanguageSwitcher lang={lang} setLang={setLang} /></div>
      <div className="glass-panel backdrop-blur-2xl p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="flex justify-center mb-6"><div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-500/30"><Shield size={40} className="fill-blue-500/20 text-white" /></div></div>
        <h2 className="text-3xl font-bold text-center mb-2 text-white tracking-tight">{t.welcome}</h2>
        <p className="text-center text-slate-300 mb-8 font-medium">{t.signinSubtitle}</p>
        <form onSubmit={handleLogin} className="space-y-5">
          <div><label className="block text-sm font-bold text-slate-200 mb-2 ml-1">{t.email}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} className="w-full px-5 py-3.5 rounded-xl border border-slate-600 bg-navy-800/50 text-white placeholder-slate-500" /></div>
          <div><label className="block text-sm font-bold text-slate-200 mb-2 ml-1">{t.password}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.passwordPlaceholder} className="w-full px-5 py-3.5 rounded-xl border border-slate-600 bg-navy-800/50 text-white placeholder-slate-500" /></div>
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold transition flex items-center justify-center gap-2">{isLoading ? <Loader2 className="animate-spin" /> : t.signinBtn}</button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
          <p className="text-sm text-slate-300 mb-4">{t.noAccount} <button onClick={() => setCurrentPage('signup')} className="text-blue-400 font-bold hover:underline transition">{t.create}</button></p>
          <button onClick={() => setCurrentPage('landing')} className="text-xs text-slate-400 hover:text-slate-200 font-medium hover:underline transition">{t.backHome}</button>
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
      showToast("All fields are compulsory.", "error");
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-900 relative overflow-hidden transition-colors duration-300">
      <div className="glass-panel backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-500 relative z-10 my-10">
        <h2 className="text-3xl font-bold text-center mb-2 text-white tracking-tight">Create Account</h2>
        <form onSubmit={handleSignup} className="space-y-5">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full px-5 py-3.5 rounded-xl border border-slate-600 bg-navy-800/50 text-white placeholder-slate-500" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-5 py-3.5 rounded-xl border border-slate-600 bg-navy-800/50 text-white placeholder-slate-500" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full px-5 py-3.5 rounded-xl border border-slate-600 bg-navy-800/50 text-white placeholder-slate-500" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full px-5 py-3.5 rounded-xl border border-slate-600 bg-navy-800/50 text-white placeholder-slate-500" />
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold transition flex items-center justify-center gap-2">{isLoading ? <Loader2 className="animate-spin" /> : "Sign Up"}</button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
          <p className="text-sm text-slate-300 mb-4">Already have an account? <button onClick={() => setCurrentPage('login')} className="text-purple-400 font-bold hover:underline transition">Sign in</button></p>
          <button onClick={() => setCurrentPage('landing')} className="text-xs text-slate-400 hover:text-slate-200 font-medium hover:underline transition">Back to Home</button>
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
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap'>('markers');

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      showToast("Please describe the incident.", "error");
      return;
    }
    setIsSubmitting(true);
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
    await apiService.reportIncident(newIncident);
    setIncidents([newIncident, ...incidents]);
    setIsSubmitting(false);
    setDescription('');
    showToast("Incident reported to the community.", "success");
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative z-10">
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full h-full flex flex-col animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-8"><AlertTriangle className="text-red-600 fill-red-100 dark:fill-red-900/30" /> <span className="text-gradient">Safety Hub</span></h1>
            <div className="grid lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
                <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
                    <div className="flex-1 bg-white dark:bg-navy-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden relative min-h-[400px]">
                        <div className="absolute top-4 right-4 z-[400] bg-white/90 dark:bg-navy-900/90 backdrop-blur p-1 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex">
                            <button onClick={() => setViewMode('markers')} className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${viewMode === 'markers' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}><MapIcon size={14} /> Markers</button>
                            <button onClick={() => setViewMode('heatmap')} className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${viewMode === 'heatmap' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}><Sparkles size={14} /> Heatmap</button>
                        </div>
                        <LeafletMap incidents={incidents} selectedRoute={null} isNavigating={false} interactive={true} heatmapMode={viewMode === 'heatmap'} />
                    </div>
                </div>
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
                    <div className="glass-panel p-6 rounded-2xl shrink-0">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white"><Flag size={20} className="text-blue-500" /> Report Incident</h2>
                        <form onSubmit={handleReportSubmit} className="space-y-4">
                            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-navy-900/50 dark:text-white outline-none">
                                <option>Suspicious Activity</option>
                                <option>Lighting Issue</option>
                                <option>Harassment</option>
                                <option>Accident</option>
                            </select>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-navy-900/50 dark:text-white outline-none h-24 resize-none"></textarea>
                            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-navy-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition shadow-lg flex justify-center items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Report"}</button>
                        </form>
                    </div>
                    <div className="glass-panel flex flex-col flex-1 overflow-hidden rounded-2xl">
                        <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center shrink-0"><h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Eye size={20} className="text-blue-500" /> Live Feed</h2></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {incidents.map(inc => (
                                <div key={inc.id} className="bg-white/60 dark:bg-navy-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex gap-4 backdrop-blur-sm">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${inc.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}><AlertCircle size={18} /></div>
                                    <div className="flex-1 min-w-0"><h3 className="font-bold text-slate-800 dark:text-white truncate text-sm">{inc.name}</h3><p className="text-slate-600 dark:text-slate-300 text-xs line-clamp-2">{inc.description}</p></div>
                                </div>
                            ))}
                        </div>
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
  const [isMapAvailable, setIsMapAvailable] = useState(false);
  
  useEffect(() => {
    const hasMap = localStorage.getItem('offline_map_data');
    if (hasMap) setIsMapAvailable(true);
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto animate-in fade-in duration-300 h-full overflow-y-auto custom-scrollbar relative z-10">
      <div className="mb-8"><h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3"><WifiOff className="text-slate-400" /> <span className="text-gradient">Offline Mode</span></h1></div>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Offline Status</h2>
            <div className={`flex items-center gap-3 font-medium p-3 rounded-xl border ${isMapAvailable ? 'text-green-600 bg-green-50' : 'text-slate-500 bg-slate-50'}`}>{isMapAvailable ? <CheckCircle size={20} /> : <AlertCircle size={20} />}{isMapAvailable ? 'Maps Installed' : 'Maps Not Installed'}</div>
            {!isMapAvailable && <button onClick={() => {localStorage.setItem('offline_map_data', 'true'); setIsMapAvailable(true); showToast("Map downloaded", "success")}} className="w-full mt-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">Download Region Map</button>}
          </div>
        </div>
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Saved Routes</h2>
          <div className="space-y-4">
            {savedRoutes.length > 0 ? (savedRoutes.map(route => (
                <div key={route.id} className="glass-panel p-5 flex justify-between items-center hover:bg-white/80 dark:hover:bg-navy-800/80 transition rounded-2xl group">
                  <div><h3 className="font-bold text-lg text-slate-900 dark:text-white">{route.name}</h3><div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1"><span>{route.start}</span><ArrowRight size={14} /><span>{route.end}</span></div></div>
                  <button onClick={() => { setSelectedRoute(route); setCurrentPage('map'); showToast("Loaded offline route", "success"); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition">Navigate</button>
                </div>
              ))) : <div className="text-center py-12 text-slate-400">No saved routes yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}
const SettingsView = ({ settings, setSettings }: SettingsViewProps) => {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar relative z-10">
        <div className="p-6 md:p-10 max-w-3xl mx-auto animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Settings</h1>
        <div className="space-y-8">
            <div className="glass-panel p-8 rounded-2xl">
                <h2 className="text-xl font-bold mb-6 dark:text-white">Safety Preferences</h2>
                <div className="space-y-4">
                     <label className="flex items-center gap-3 dark:text-white cursor-pointer"><input type="checkbox" checked={settings.avoidUnlitAreas} onChange={(e) => setSettings({...settings, avoidUnlitAreas: e.target.checked})} className="w-5 h-5" /> Avoid Unlit Areas</label>
                     <label className="flex items-center gap-3 dark:text-white cursor-pointer"><input type="checkbox" checked={settings.notifications.push} onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, push: e.target.checked}})} className="w-5 h-5" /> Push Notifications</label>
                </div>
            </div>
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
    if (user) {
      setUser({ ...user, emergencyContacts: [...user.emergencyContacts, { id: Date.now(), ...newContact, isPrimary: false, verified: false }]});
      showToast("Contact added", "success");
      setIsModalOpen(false);
      setNewContact({ name: '', phone: '', relationship: 'Friend' });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto animate-in fade-in duration-300 h-full overflow-y-auto custom-scrollbar relative z-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Emergency Contacts</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2"><Plus size={20} /> Add Contact</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {user?.emergencyContacts.map(contact => (
          <div key={contact.id} className="glass-panel p-6 rounded-2xl">
            <h3 className="font-bold text-xl text-slate-800 dark:text-white">{contact.name}</h3>
            <p className="text-slate-500">{contact.phone}</p>
            <button onClick={() => setUser({...user, emergencyContacts: user.emergencyContacts.filter(c => c.id !== contact.id)})} className="mt-4 text-red-500 text-sm font-bold">Remove</button>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-800 p-8 rounded-3xl w-full max-w-md">
             <h3 className="text-2xl font-bold mb-6 dark:text-white">Add Contact</h3>
             <form onSubmit={handleAddContact} className="space-y-4">
                <input type="text" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} placeholder="Name" className="w-full p-3 rounded-xl border dark:bg-navy-900 dark:border-slate-700 dark:text-white" />
                <input type="tel" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} placeholder="Phone" className="w-full p-3 rounded-xl border dark:bg-navy-900 dark:border-slate-700 dark:text-white" />
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold">Save Contact</button>
             </form>
             <button onClick={() => setIsModalOpen(false)} className="w-full py-3 mt-2 text-slate-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

interface MapDashboardProps {
  startAddress: string; setStartAddress: (val: string) => void; setStartCoords: (coords: [number, number] | null) => void;
  endAddress: string; setEndAddress: (val: string) => void; setEndCoords: (coords: [number, number] | null) => void;
  handleRouteSearch: () => void; isSearching: boolean; foundRoutes: Route[]; selectedRoute: Route | null; setSelectedRoute: (route: Route | null) => void;
  incidents: Incident[]; isNavigating: boolean; handleStartNavigation: () => void; handleEndNavigation: () => void; currentUserPosition: [number, number] | null;
  transportMode: string; setTransportMode: (mode: string) => void; handleUseCurrentLocation: () => void; handleTriggerSOS: () => void; currentInstruction: string;
  isSimulatingStop: boolean; setIsSimulatingStop: (val: boolean) => void; showToast: (msg: string, type: 'success'|'error'|'info') => void;
}
const MapDashboard = ({
  startAddress, setStartAddress, setStartCoords, endAddress, setEndAddress, setEndCoords, handleRouteSearch, isSearching, foundRoutes,
  selectedRoute, setSelectedRoute, incidents, isNavigating, handleStartNavigation, handleEndNavigation, currentUserPosition,
  transportMode, setTransportMode, handleUseCurrentLocation, showToast, handleTriggerSOS, currentInstruction, isSimulatingStop, setIsSimulatingStop
}: MapDashboardProps) => {
  const [lastMoveTime, setLastMoveTime] = useState(Date.now());
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const [safetyTimer, setSafetyTimer] = useState(10);
  const lastPosRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!isNavigating) { setShowSafetyCheck(false); setSafetyTimer(10); return; }
    const checkInterval = setInterval(() => {
        if (showSafetyCheck) return; 
        const timeSinceLastMove = Date.now() - lastMoveTime;
        if (timeSinceLastMove > 10000 || isSimulatingStop) {
            setShowSafetyCheck(true); 
            setSafetyTimer(10); 
            speak("You stopped. Are you safe?");
        }
    }, 1000);
    return () => clearInterval(checkInterval);
  }, [isNavigating, lastMoveTime, showSafetyCheck, isSimulatingStop]);

  useEffect(() => {
      let interval: any;
      if (showSafetyCheck && safetyTimer > 0) {
          interval = setInterval(() => setSafetyTimer(p => p - 1), 1000);
      } else if (showSafetyCheck && safetyTimer <= 0) {
          setShowSafetyCheck(false); 
          handleTriggerSOS(); 
          showToast("SOS Triggered: No response!", "error"); 
      }
      return () => clearInterval(interval);
  }, [showSafetyCheck, safetyTimer]);

  useEffect(() => {
    if (!currentUserPosition) return;
    if (lastPosRef.current) {
         const dist = calculateDistance(lastPosRef.current[0], lastPosRef.current[1], currentUserPosition[0], currentUserPosition[1]);
         if (dist > 2 && !isSimulatingStop) {
             setLastMoveTime(Date.now());
         }
    }
    lastPosRef.current = currentUserPosition;
  }, [currentUserPosition, isSimulatingStop]);

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden relative z-10">
      <div className={`w-full md:w-[420px] bg-white/80 dark:bg-navy-900/90 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700 flex flex-col h-1/2 md:h-full z-10 shadow-2xl transition-all duration-500 ${isNavigating ? 'hidden md:flex md:-translate-x-full md:absolute' : 'relative'}`}>
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-navy-900/50 z-20">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Plan Your Route</h2>
          <div className="space-y-4 relative">
             <LocationSearchInput value={startAddress} onChange={setStartAddress} onSelect={setStartCoords} placeholder="Starting Location" icon={<div className="w-4 h-4 rounded-full border-[3px] border-slate-400 bg-white dark:bg-navy-800"></div>} onUseCurrentLocation={handleUseCurrentLocation} />
             <LocationSearchInput value={endAddress} onChange={setEndAddress} onSelect={setEndCoords} placeholder="Destination" icon={<MapPin size={20} className="text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900" />} />
             <div className="grid grid-cols-4 gap-2 pt-2">
                {[{id:'walking', icon:<Footprints size={18}/>, l:'Walk'}, {id:'bike', icon:<Bike size={18}/>, l:'Bike'}, {id:'car', icon:<Car size={18}/>, l:'Car'}, {id:'transit', icon:<Bus size={18}/>, l:'Transit'}].map(m => (
                    <button key={m.id} onClick={() => setTransportMode(m.id)} className={`flex flex-col items-center justify-center py-2 rounded-xl border transition backdrop-blur-sm ${transportMode === m.id ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-white/50 dark:bg-navy-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'}`}>{m.icon} <span className="text-[10px] font-bold mt-1 uppercase">{m.l}</span></button>
                ))}
            </div>
            <button onClick={handleRouteSearch} disabled={isSearching} className={`w-full py-3 bg-navy-900 dark:bg-blue-600 text-white rounded-xl text-base font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition shadow-lg mt-2 ${isSearching ? 'opacity-80' : ''}`}>{isSearching ? 'Calculating...' : 'Find Safe Route'}</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-navy-900/30 custom-scrollbar">
          {foundRoutes.length > 0 ? (foundRoutes.map((route) => (
                <div key={route.id} onClick={() => setSelectedRoute(route)} className={`p-5 rounded-2xl border cursor-pointer transition-all shadow-sm hover:shadow-md relative backdrop-blur-sm ${selectedRoute?.id === route.id ? 'bg-white/90 dark:bg-navy-800/90 border-blue-500 ring-1 ring-blue-500' : 'bg-white/70 dark:bg-navy-800/70 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
                    <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-xs font-bold border-b border-l ${getSafetyColor(route.safetyScore)}`}>{route.safetyScore}% Safety</div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-3">{route.name}</h3>
                    <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400 mb-3"><span className="font-medium">{route.distance}</span><span className="font-medium">{route.duration}</span></div>
                    {selectedRoute?.id === route.id && <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2"><button onClick={(e) => { e.stopPropagation(); handleStartNavigation(); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">Start Navigation</button></div>}
                </div>
            ))) : <div className="text-center text-slate-400 mt-12">Search to find routes</div>}
        </div>
      </div>
      <div className="flex-1 relative h-1/2 md:h-full bg-slate-100 dark:bg-slate-900 border-t md:border-t-0 border-slate-200 dark:border-slate-700">
          <LeafletMap incidents={incidents} selectedRoute={selectedRoute} isNavigating={isNavigating} currentPosition={currentUserPosition} />
          {isNavigating && selectedRoute && (
            <div className="absolute top-0 left-0 right-0 z-[500] p-4 pointer-events-none">
                <div className="bg-navy-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between max-w-2xl mx-auto pointer-events-auto border border-slate-700/50">
                    <div className="flex items-center gap-4"><div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-500/30"><CornerUpRight size={32} /></div><div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Next Turn</p><h3 className="text-xl font-bold">{currentInstruction}</h3></div></div>
                    <div className="flex items-center gap-2"><button onClick={() => setIsSimulatingStop(!isSimulatingStop)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${isSimulatingStop ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>{isSimulatingStop ? 'Stop Active' : 'Test Stop'}</button></div>
                    <button onClick={handleEndNavigation} className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg font-bold text-sm hover:bg-red-500/30 transition">End Trip</button>
                </div>
            </div>
          )}
          {showSafetyCheck && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center p-6 bg-navy-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-navy-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border-2 border-red-500 animate-pulse">
                      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={40} /></div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Are you safe?</h2>
                      <p className="text-slate-600 dark:text-slate-300 mb-6">Movement stopped. SOS in <span className="text-red-600 font-bold text-xl">{safetyTimer}s</span></p>
                      <button onClick={() => { setShowSafetyCheck(false); setLastMoveTime(Date.now()); setIsSimulatingStop(false); showToast("Safe!", "success"); }} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg mb-3">I am Safe</button>
                      <button onClick={handleTriggerSOS} className="w-full py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition">Trigger SOS Now</button>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

// --- Dashboard Layout Wrapper ---
const DashboardLayout = ({ 
  children, currentPage, setCurrentPage, setSidebarOpen, sidebarOpen, handleLogout, darkMode, toggleTheme, isOnline, incidents, handleTriggerSOS
}: { 
  children?: ReactNode, currentPage: Page, setCurrentPage: (p: Page) => void, setSidebarOpen: (o: boolean) => void, sidebarOpen: boolean, handleLogout: () => void, darkMode: boolean, toggleTheme: () => void, isOnline: boolean, incidents: Incident[], handleTriggerSOS: () => void
}) => (
  <div className="flex h-screen bg-slate-50 dark:bg-navy-900 overflow-hidden font-sans transition-colors duration-300 relative">
    <AmbientBackground />
    <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white/90 dark:bg-navy-900/90 backdrop-blur-xl text-slate-900 dark:text-white transform transition-transform duration-300 ease-in-out shadow-2xl border-r border-slate-200/50 dark:border-white/5 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-8 flex items-center justify-between"><div className="flex items-center gap-2.5 font-bold text-2xl tracking-tight"><Shield className="fill-blue-600 text-blue-600 dark:text-white" size={28} /> SafeWalk</div><button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white"><X /></button></div>
      <nav className="px-4 space-y-2 mt-4">
        {[['map', <MapIcon key="map" size={20}/>, 'Route Map'], ['safety_hub', <AlertTriangle key="safe" size={20}/>, 'Safety Hub'], ['offline', <WifiOff key="off" size={20}/>, 'Offline Mode'], ['contacts', <Users key="cont" size={20}/>, 'Contacts'], ['settings', <Settings key="sett" size={20}/>, 'Settings']].map(([id, icon, label]) => (
            <button key={id as string} onClick={() => {setCurrentPage(id as Page); setSidebarOpen(false)}} className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-xl transition font-medium text-sm group ${currentPage === id ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-600/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>{icon} {label}</button>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4 bg-gradient-to-t from-white dark:from-navy-900 via-white/80 dark:via-navy-900/80 to-transparent">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isOnline ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30'}`}>
          <div className="relative">{isOnline ? <Signal size={18} className="text-emerald-600 dark:text-emerald-400"/> : <><SignalZero size={18} className="text-red-600 dark:text-red-400" /><span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-white dark:bg-navy-900 border-2 border-transparent"><span className={`block w-full h-full rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span></span></>}</div>
          <div><p className={`text-xs font-bold uppercase tracking-wider ${isOnline ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{isOnline ? 'System Online' : 'Offline Mode'}</p></div>
        </div>
        <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 transition"><span className="text-sm font-medium flex items-center gap-2">{darkMode ? <Moon size={16}/> : <Sun size={16}/>}{darkMode ? 'Dark Mode' : 'Light Mode'}</span><div className={`w-10 h-5 rounded-full relative transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${darkMode ? 'left-6' : 'left-1'}`}></div></div></button>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition font-medium text-sm"><LogOut size={18} /> Sign Out</button>
      </div>
    </aside>
    <main className="flex-1 relative h-full overflow-hidden flex flex-col">
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md z-40 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white"><Shield className="fill-blue-600 text-blue-600 dark:text-white" size={24} /> SafeWalk</div>
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"><Menu size={24} /></button>
      </div>
      <div className="flex-1 relative overflow-hidden">{children}</div>
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={handleTriggerSOS} className="w-20 h-20 bg-red-600 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.6)] flex items-center justify-center text-white font-bold animate-pulse hover:scale-110 transition duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div><span className="relative z-10 text-xl font-black group-hover:hidden">SOS</span><PhoneCall className="relative z-10 hidden group-hover:block" size={32} />
        </button>
      </div>
      <AIAssistant incidents={incidents} />
    </main>
  </div>
);

const App = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<Language>('en');

  // Dashboard State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<Route[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({ minSafetyScore: 70, avoidUnlitAreas: true, avoidCrowds: false, travelMode: 'walking', notifications: { push: true, sms: true, email: false }});

  // Map Dashboard State
  const [startAddress, setStartAddress] = useState('');
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [endAddress, setEndAddress] = useState('');
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [foundRoutes, setFoundRoutes] = useState<Route[]>([]);
  const [currentUserPosition, setCurrentUserPosition] = useState<[number, number] | null>([40.7580, -73.9855]);
  const [transportMode, setTransportMode] = useState('walking');

  // Toast & SOS State
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'info', visible: boolean}>({ msg: '', type: 'info', visible: false });
  const [sosActive, setSosActive] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState('Head northeast');
  const [isSimulatingStop, setIsSimulatingStop] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToast({ msg, type, visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => {
    const token = storage.getToken();
    if (token) {
        apiService.login('saved', 'user').then(u => { setUser(u); setCurrentPage('map'); }).catch(() => storage.clear());
    }
    const saved = storage.getRoutes();
    if (saved.length > 0) setSavedRoutes(saved);
    apiService.getIncidents().then(setIncidents);
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { setDarkMode(true); }
    const handleOnline = () => { apiService.syncPendingData().then(success => { if(success) showToast("Offline data synced with server", "success"); }); };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); }
  }, [darkMode]);

  const handleRouteSearch = async () => {
    if (!startCoords || !endCoords) { showToast("Please select valid start and end locations.", "error"); return; }
    setIsSearching(true);
    
    // Try to get real routes from TomTom via apiService
    const route = await apiService.calculateRoute(startCoords, endCoords, transportMode);
    
    setTimeout(() => {
        if (route) {
             // Adapt TomTom route format to our internal Route format if needed, 
             // but for this demo we'll just mock the multiple route options based on the real calculation if available
             // or fallback to mocks.
             // Since integrating full TomTom response parsing is complex, we will use the MOCK_ROUTES but updated with real coords if possible 
             // or just stick to MOCK_ROUTES for demonstration of UI.
             // However, to make the MAP work with real locations, let's try to update the first mock route with real data if available.
             
             // For the purpose of this demo app structure, we will return the MOCK_ROUTES which are pre-calculated for the demo area (NYC).
             // If the user searches for real locations outside NYC, the mock routes won't make sense on the map.
             // To fix this properly, we would need to parse `route.legs[0].points` from TomTom.
             
             if (route && route.legs && route.legs[0].points) {
                 const realPoints = route.legs[0].points.map((p:any) => [p.latitude, p.longitude] as [number, number]);
                 const realRoute: Route = {
                     ...MOCK_ROUTES[0],
                     id: Date.now(),
                     name: 'Calculated Route',
                     coordinates: realPoints,
                     distance: (route.summary.lengthInMeters / 1000).toFixed(1) + ' km',
                     duration: (route.summary.travelTimeInSeconds / 60).toFixed(0) + ' min',
                     start: startAddress,
                     end: endAddress
                 };
                 setFoundRoutes([realRoute]);
             } else {
                 setFoundRoutes(MOCK_ROUTES);
             }
        } else {
             setFoundRoutes(MOCK_ROUTES);
        }
        
        setIsSearching(false);
        showToast("Found safe routes.", "success");
        const history = storage.getHistory();
        if (!history.includes(endAddress)) { storage.saveHistory([endAddress, ...history].slice(0, 5)); }
    }, 1500);
  };

  const handleStartNavigation = () => {
      if (!selectedRoute) return;
      setIsNavigating(true);
      showToast("Navigation started. Stay safe!", "success");
      const instructions = selectedRoute.instructions || ["Head straight"];
      if(instructions.length > 0) speak(`Starting navigation to ${selectedRoute.end}. ${instructions[0]}`);
      
      let step = 0;
      setCurrentInstruction(instructions[0] || "Follow the route");
      if ((window as any).navInterval) clearInterval((window as any).navInterval);
      const interval = setInterval(() => {
          if (!isSimulatingStop) {
               setCurrentUserPosition(prev => { 
                   if(!prev) return prev; 
                   // Simulate movement along the route would be complex, just move diagonally for demo
                   return [prev[0] + 0.0001, prev[1] + 0.0001]; 
               });
               step++;
               if (step % 5 === 0 && instructions.length > 0) {
                   const nextInst = instructions[Math.floor(Math.random() * instructions.length)];
                   setCurrentInstruction(nextInst);
                   speak(nextInst);
               }
          }
      }, 3000);
      (window as any).navInterval = interval;
  };

  const handleEndNavigation = () => {
      setIsNavigating(false);
      setSelectedRoute(null);
      // Reset position to start for demo purposes or keep current
      // setCurrentUserPosition([40.7580, -73.9855]); 
      if ((window as any).navInterval) clearInterval((window as any).navInterval);
      showToast("Trip ended.", "info");
  };

  const handleTriggerSOS = () => {
      setSosActive(true);
      apiService.triggerSOS({lat: 40.7580, lng: -73.9855});
      if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
      speak("SOS Alert Sent. Help is on the way.");
  };

  const handleUseCurrentLocation = () => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (pos) => {
                  setStartAddress("Current Location");
                  setStartCoords([pos.coords.latitude, pos.coords.longitude]);
                  setCurrentUserPosition([pos.coords.latitude, pos.coords.longitude]);
              },
              () => showToast("Location access denied.", "error")
          );
      } else { showToast("Geolocation not supported.", "error"); }
  };

  if (currentPage === 'landing') return <LandingView setCurrentPage={setCurrentPage} setDarkMode={setDarkMode} darkMode={darkMode} />;
  if (currentPage === 'login') return <LoginView setCurrentPage={setCurrentPage} setUser={setUser} showToast={showToast} lang={lang} setLang={setLang} />;
  if (currentPage === 'signup') return <SignupView setCurrentPage={setCurrentPage} setUser={setUser} showToast={showToast} />;

  return (
    <>
        <DashboardLayout 
            currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} 
            handleLogout={() => { storage.clear(); setUser(null); setCurrentPage('landing'); }} darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)}
            isOnline={navigator.onLine} incidents={incidents} handleTriggerSOS={handleTriggerSOS}
        >
            {currentPage === 'map' && <MapDashboard 
                startAddress={startAddress} setStartAddress={setStartAddress} setStartCoords={setStartCoords}
                endAddress={endAddress} setEndAddress={setEndAddress} setEndCoords={setEndCoords}
                handleRouteSearch={handleRouteSearch} isSearching={isSearching} foundRoutes={foundRoutes}
                selectedRoute={selectedRoute} setSelectedRoute={setSelectedRoute} incidents={incidents}
                isNavigating={isNavigating} handleStartNavigation={handleStartNavigation} handleEndNavigation={handleEndNavigation}
                currentUserPosition={currentUserPosition} transportMode={transportMode} setTransportMode={setTransportMode}
                handleUseCurrentLocation={handleUseCurrentLocation} handleTriggerSOS={handleTriggerSOS} currentInstruction={currentInstruction}
                isSimulatingStop={isSimulatingStop} setIsSimulatingStop={setIsSimulatingStop} showToast={showToast}
            />}
            {currentPage === 'safety_hub' && <SafetyHubView incidents={incidents} setIncidents={setIncidents} showToast={showToast} />}
            {currentPage === 'offline' && <OfflineView savedRoutes={savedRoutes} showToast={showToast} setSelectedRoute={setSelectedRoute} setCurrentPage={setCurrentPage} />}
            {currentPage === 'contacts' && <ContactsView user={user} setUser={setUser} showToast={showToast} />}
            {currentPage === 'settings' && <SettingsView settings={settings} setSettings={setSettings} />}
        </DashboardLayout>
        {sosActive && <SOSOverlay onDismiss={() => setSosActive(false)} />}
        {toast.visible && (
            <div className={`fixed top-6 right-6 z-[2000] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                {toast.type === 'error' ? <AlertTriangle size={20} /> : toast.type === 'success' ? <CheckCircle size={20} /> : <Bell size={20} />}
                <span className="font-bold">{toast.msg}</span>
            </div>
        )}
    </>
  );
};

export default App;