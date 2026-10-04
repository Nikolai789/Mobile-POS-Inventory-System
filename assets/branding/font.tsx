import { useFonts } from 'expo-font';

export default function useAppFonts() {
  return useFonts({
    ZenOld: require('../fonts/ZenOldMincho-Regular.ttf'),
    SpaceGrotesk: require('../fonts/SpaceGrotesk-VariableFont_wght.ttf'),
  });
}
