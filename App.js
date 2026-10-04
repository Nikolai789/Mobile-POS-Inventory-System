import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import DrawerNavigator from './frontend/navigation/DrawerNavigator';
import useAppFonts from "./assets/branding/font";



export default function App() {
  const [fontsLoaded, fontError] = useAppFonts();

    if (!fontsLoaded && !fontError) {
      return null;
    }
  return (
    <NavigationContainer>
      <DrawerNavigator />
    </NavigationContainer>
  );
}
