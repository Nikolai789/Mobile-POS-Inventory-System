import { Pressable, Text, View } from 'react-native';
import { hero_card } from '../assets/branding/layout';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  label: string;
  value: string | number;
  color: string;
  onPress?: () => void;
};

export default function HeroCard({ label, value, color, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        hero_card.card,
        { backgroundColor: color, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={hero_card.top}>
        <Text style={hero_card.label}>{label}</Text>
        <View style={hero_card.chevron}>
          <Ionicons name="chevron-forward" size={10} color="#fff" />
        </View>
      </View>

      <Text style={hero_card.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </Pressable>
  );
}
