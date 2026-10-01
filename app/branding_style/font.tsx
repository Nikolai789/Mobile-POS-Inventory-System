import { useFonts } from "expo-font";
import { StyleSheet } from 'react-native';

export function FontFam() {
  const [loaded, error] = useFonts({
    'ZenRegular': require('../../assets/Fonts/ZenOldMincho-Regular.ttf'),
    'SpaceGrotesk' : require('../../assets/Fonts/SpaceGrotesk.ttf')
  })
};

const Font = StyleSheet.create({
  h1_zen_text: {
    fontFamily: 'ZenRegular',
    fontSize: 28
  }
});

export default Font;
