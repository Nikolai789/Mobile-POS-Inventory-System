import { Pressable, Text, View, StyleSheet, Platform } from 'react-native';


type Props = {
  label: string
  value: string | number
  color: string
  onPress?: () => void
};

export default function HeroCard({ label, value, color, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
    >

    </Pressable>
  )
}
