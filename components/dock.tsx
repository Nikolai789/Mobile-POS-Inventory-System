import { Pressable, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { dock } from '../assets/branding/layout';

import DashboardIcon from '../assets/Dashboard.svg';
import SalesReport from '../assets/Sales Report.svg';
import InventoryIcon from '../assets/Inventory.svg';
import { Colors } from '../assets/branding/color_scheme';

const tabs = {
  index: { label: 'Dashboard', Icon: DashboardIcon },
  sales: { label: 'Sales Report', Icon: SalesReport },
  inv: { label: 'Inventory', Icon: InventoryIcon },
};

export default function Dock({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={dock.dock}>
      {state.routes.map((route, i) => {
        const tab = tabs[route.name as keyof typeof tabs];
        if (!tab) return null;

        const focused = state.index === i;
        const color = Colors.BGColorBlack;

        return (
          <Pressable
            key={route.key}
            style={[dock.item, focused && dock.itemActive]}
            onPress={() => navigation.navigate(route.name)}
          >
            <tab.Icon width={32} height={32} color={color} />
            <Text style={dock.label}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
