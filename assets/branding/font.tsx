import { useFonts } from 'expo-font';
import { StyleSheet } from 'react-native';
export default function useAppFonts() {
  return useFonts({
    ZenOld: require('../fonts/ZenOldMincho-Regular.ttf'),
    SpaceGrotesk: require('../fonts/SpaceGrotesk-VariableFont_wght.ttf'),
  });
}
export const fontStyle = StyleSheet.create({
  subZenFont1: {
    fontFamily: 'ZenOld',
    fontSize: 24,
    fontWeight:400
  },
  subZenFont2: {
    fontFamily: 'ZenOld',
    fontSize: 24 / 1.618,
    fontWeight:400
  },
  subZenFont3: {
    fontFamily: 'ZenOld',
    fontSize: 24 / (1.618 ** 2),
    fontWeight:400
  }
});
