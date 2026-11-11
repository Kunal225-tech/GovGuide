import React from 'react';
import { 
  GraduationCap, 
  Briefcase, 
  Wheat, 
  HeartPulse, 
  House, 
  Users, 
  ShieldCheck, 
  Wallet, 
  Lightbulb, 
  Laptop, 
  Building2, 
  HeartHandshake, 
  TreePine, 
  Wrench, 
  Map, 
  Utensils, 
  Droplet, 
  Zap, 
  Bus, 
  LifeBuoy, 
  Rocket, 
  Factory 
} from 'lucide-react';

export interface IconData {
  id: string;
  icon: React.ElementType;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  color: string;
}

export const ICONS: IconData[] = [
  // Outer Left
  { id: 'edu', icon: GraduationCap, label: 'Education', x: 12, y: 15, color: 'text-primary' },
  { id: 'emp', icon: Briefcase, label: 'Employment', x: 8, y: 35, color: 'text-stone-600' },
  { id: 'rur', icon: House, label: 'Rural Development', x: 10, y: 55, color: 'text-green-600' },
  { id: 'san', icon: Droplet, label: 'Sanitation', x: 15, y: 75, color: 'text-sky-500' },
  { id: 'dis', icon: LifeBuoy, label: 'Disaster Relief', x: 8, y: 90, color: 'text-red-500' },

  // Inner Left
  { id: 'ski', icon: Wrench, label: 'Skill Development', x: 22, y: 25, color: 'text-stone-500' },
  { id: 'dig', icon: Laptop, label: 'Digital India', x: 20, y: 45, color: 'text-amber-500' },
  { id: 'inf', icon: Building2, label: 'Infrastructure', x: 25, y: 65, color: 'text-stone-500' },
  { id: 'ene', icon: Zap, label: 'Clean Energy', x: 22, y: 85, color: 'text-yellow-500' },

  // Top Center
  { id: 'agr', icon: Wheat, label: 'Agriculture', x: 35, y: 10, color: 'text-green-500' },
  { id: 'hea', icon: HeartPulse, label: 'Healthcare', x: 50, y: 8, color: 'text-rose-500' },
  { id: 'hou', icon: House, label: 'Housing', x: 65, y: 12, color: 'text-orange-500' },

  // Bottom Center
  { id: 'tra', icon: Bus, label: 'Transport', x: 35, y: 92, color: 'text-stone-600' },
  { id: 'tou', icon: Map, label: 'Tourism', x: 50, y: 88, color: 'text-emerald-500' },
  { id: 'sta', icon: Rocket, label: 'Startups', x: 65, y: 90, color: 'text-primary' },

  // Inner Right
  { id: 'wom', icon: Users, label: 'Women & Child', x: 78, y: 22, color: 'text-pink-500' },
  { id: 'soc', icon: ShieldCheck, label: 'Social Welfare', x: 82, y: 40, color: 'text-purple-500' },
  { id: 'sen', icon: HeartHandshake, label: 'Senior Citizens', x: 75, y: 60, color: 'text-teal-500' },
  { id: 'foo', icon: Utensils, label: 'Food Security', x: 80, y: 78, color: 'text-amber-600' },

  // Outer Right
  { id: 'fin', icon: Wallet, label: 'Financial Support', x: 92, y: 18, color: 'text-amber-500' },
  { id: 'ent', icon: Lightbulb, label: 'Entrepreneurship', x: 95, y: 38, color: 'text-yellow-600' },
  { id: 'tri', icon: Users, label: 'Tribal Welfare', x: 90, y: 55, color: 'text-orange-600' },
  { id: 'env', icon: TreePine, label: 'Environment', x: 92, y: 75, color: 'text-green-600' },
  { id: 'mak', icon: Factory, label: 'Make in India', x: 95, y: 92, color: 'text-indigo-600' },
];
