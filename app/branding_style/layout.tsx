import { StyleSheet } from 'react-native';
const Layout = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },

  header: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingBottom: 30
  },

  card_grid: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 8,
    padding: 8
  },
});

export default Layout;
