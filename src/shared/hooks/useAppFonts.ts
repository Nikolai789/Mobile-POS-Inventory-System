import { useFonts } from 'expo-font';
export default function useAppFonts() {
  return useFonts({
    ZenOld: require('../../../assets/fonts/ZenOldMincho-Regular.ttf'),
    SpaceGrotesk: require('../../../assets/fonts/SpaceGrotesk-VariableFont_wght.ttf'),
  });
}
