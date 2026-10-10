import React from 'react';
import {
  PawPrint,
  Utensils,
  Briefcase,
  Trophy,
  Lamp,
  Trees,
  Compass,
  Wand2,
  Gamepad2,
  MapPin,
  FlaskConical,
  Shuffle,
  Sparkles,
  Cpu,
  Wrench,
  Film,
  Music,
  HeartPulse,
  Shirt,
  GraduationCap,
  Home,
  Rocket,
  Sun,
  PartyPopper,
  Anchor,
  Bug,
  HardHat,
  Crown,
} from 'lucide-react';

interface ThemeIconProps {
  iconName: string;
  className?: string;
}

export const ThemeIcon: React.FC<ThemeIconProps> = ({ iconName, className = 'w-6 h-6' }) => {
  switch (iconName) {
    case 'PawPrint':
      return <PawPrint className={className} />;
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Trophy':
      return <Trophy className={className} />;
    case 'Lamp':
      return <Lamp className={className} />;
    case 'Trees':
      return <Trees className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Wand2':
      return <Wand2 className={className} />;
    case 'Gamepad2':
      return <Gamepad2 className={className} />;
    case 'MapPin':
      return <MapPin className={className} />;
    case 'FlaskConical':
      return <FlaskConical className={className} />;
    case 'Cpu':
      return <Cpu className={className} />;
    case 'Wrench':
      return <Wrench className={className} />;
    case 'Film':
      return <Film className={className} />;
    case 'Music':
      return <Music className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Shirt':
      return <Shirt className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Home':
      return <Home className={className} />;
    case 'Rocket':
      return <Rocket className={className} />;
    case 'Sun':
      return <Sun className={className} />;
    case 'PartyPopper':
      return <PartyPopper className={className} />;
    case 'Anchor':
      return <Anchor className={className} />;
    case 'Bug':
      return <Bug className={className} />;
    case 'HardHat':
      return <HardHat className={className} />;
    case 'Crown':
      return <Crown className={className} />;
    case 'Shuffle':
      return <Shuffle className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};
