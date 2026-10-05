import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../screens/HomeScreen';
import InventoryScreen from '../screens/InventoryScreen';
import PurchaseHistory from '../screens/PurchaseHistory';
import ProcessOrders from '../screens/ProcessOrders';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Home">
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Inventory" component={InventoryScreen} />
      <Drawer.Screen name="Purchase History" component={PurchaseHistory} />
      <Drawer.Screen name="Process Orders" component={ProcessOrders} />
    </Drawer.Navigator>
  );
}
