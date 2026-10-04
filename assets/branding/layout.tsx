import { StyleSheet } from 'react-native';
const general_layout = StyleSheet.create({


});

const hero_card = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 90,
    borderRadius: 7,
    gap: 10,
    padding: 8,
    justifyContent: 'space-between'
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },

  label: {
    fontWeight: '700',
  },
  card_effect: {}

});
