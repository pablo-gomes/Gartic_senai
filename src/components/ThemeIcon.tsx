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
  Zap,
  Bot,
  Car,
  Plane,
  Coffee,
  Cake,
  Apple,
  Palette,
  Camera,
  BookOpen,
  Sword,
  Shield,
  Ghost,
  Skull,
  Snowflake,
  Flame,
  Droplets,
  Tent,
  Mountain,
  Globe,
  Clock,
  Gift,
  ShoppingCart,
  Key,
  Hammer,
  Factory,
  Microscope,
  Stethoscope,
  Bird,
  Fish,
  Flower2,
  Dumbbell,
  Bike,
  Train,
  Ship,
  Castle,
  Gem,
  Coins,
  Headphones,
  Tv,
  Smartphone,
  Pizza,
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
    case 'Zap':
      return <Zap className={className} />;
    case 'Bot':
      return <Bot className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'Plane':
      return <Plane className={className} />;
    case 'Coffee':
      return <Coffee className={className} />;
    case 'Cake':
      return <Cake className={className} />;
    case 'Apple':
      return <Apple className={className} />;
    case 'Palette':
      return <Palette className={className} />;
    case 'Camera':
      return <Camera className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Sword':
      return <Sword className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Ghost':
      return <Ghost className={className} />;
    case 'Skull':
      return <Skull className={className} />;
    case 'Snowflake':
      return <Snowflake className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Droplets':
      return <Droplets className={className} />;
    case 'Tent':
      return <Tent className={className} />;
    case 'Mountain':
      return <Mountain className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    case 'Gift':
      return <Gift className={className} />;
    case 'ShoppingCart':
      return <ShoppingCart className={className} />;
    case 'Key':
      return <Key className={className} />;
    case 'Hammer':
      return <Hammer className={className} />;
    case 'Factory':
      return <Factory className={className} />;
    case 'Microscope':
      return <Microscope className={className} />;
    case 'Stethoscope':
      return <Stethoscope className={className} />;
    case 'Bird':
      return <Bird className={className} />;
    case 'Fish':
      return <Fish className={className} />;
    case 'Flower2':
      return <Flower2 className={className} />;
    case 'Dumbbell':
      return <Dumbbell className={className} />;
    case 'Bike':
      return <Bike className={className} />;
    case 'Train':
      return <Train className={className} />;
    case 'Ship':
      return <Ship className={className} />;
    case 'Castle':
      return <Castle className={className} />;
    case 'Gem':
      return <Gem className={className} />;
    case 'Coins':
      return <Coins className={className} />;
    case 'Headphones':
      return <Headphones className={className} />;
    case 'Tv':
      return <Tv className={className} />;
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'Pizza':
      return <Pizza className={className} />;
    case 'Shuffle':
      return <Shuffle className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};
