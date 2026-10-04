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
  },
  h2_zen_text: {
    fontFamily: 'ZenRegular',
    fontSize: 17.31
  },
  h3_zen_text: {
    fontFamily: 'ZenRegular',
    fontSize: 17.31 / 1.618
  }
});

export default Font;
