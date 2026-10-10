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
    case 'Shuffle':
      return <Shuffle className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};
