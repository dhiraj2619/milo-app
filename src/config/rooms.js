import {Globe, Moon, Music, Users, Zap} from 'lucide-react-native';

// MILO Special rooms. Keys must match milo-server/config/catalog.js (ROOMS); the server owns
// matching, the per-room questions and Speed Talk's time limit.
export const MOOD_ROOMS = [
  {key: 'night', title: 'Late Night Talks', subtitle: 'Deep, honest chats', icon: Moon, from: '#3B1F8F', to: '#120A33', accent: '#A78BFA'},
  {key: 'language', title: 'Language Exchange', subtitle: 'Practise with locals', icon: Globe, from: '#0E5D73', to: '#0A1B2E', accent: '#5EE7FF'},
  {key: 'music', title: 'Music & Chill', subtitle: 'Share your playlist', icon: Music, from: '#8A1F6B', to: '#250A26', accent: '#FF7AD9'},
  {key: 'friends', title: 'Make Friends', subtitle: 'Meet someone new', icon: Users, from: '#7A4A0E', to: '#24150A', accent: '#FFC861'},
];
export const SPEED_TALK = {key: 'speed', title: 'Speed Talk', subtitle: '3-minute calls with someone new', icon: Zap, from: '#B0207A', to: '#3A0B4F', accent: '#FF8AD8'};
export const ROOMS_BY_KEY = Object.fromEntries([...MOOD_ROOMS, SPEED_TALK].map(room => [room.key, room]));
