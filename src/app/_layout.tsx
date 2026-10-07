import { Drawer } from 'expo-router/drawer';
import useAppFonts from '../../assets/branding/font';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  if (!fontsLoaded && !fontError) return null;

  return (
    <Drawer initialRouteName="index">
      <Drawer.Screen name="index" options={{ title: 'Home', drawerLabel: 'Home' }} />
      <Drawer.Screen name="inventory" options={{ title: 'Inventory', drawerLabel: 'Inventory' }} />
      <Drawer.Screen name="process-orders" options={{ title: 'Process Orders', drawerLabel: 'Process Orders' }} />
      <Drawer.Screen name="purchase-history" options={{ title: 'Purchase History', drawerLabel: 'Purchase History' }} />
    </Drawer>
  );
}
