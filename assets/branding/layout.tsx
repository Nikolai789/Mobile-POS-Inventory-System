import { StyleSheet } from 'react-native';
import { Colors } from './color_scheme';
export const general_layout = StyleSheet.create({
  layout: {
    flex: 1,
    gap: 12,
    padding: 12,
    flexDirection: 'column'
  }

});

export const hero_card = StyleSheet.create({
  card: {
    width: '48%',
    aspectRatio:1,         // grows if content needs it (replaces aspectRatio)
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  label: {
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 30,
    flexShrink: 1,
    flex: 1,                 // label takes the leftover space, so the arrow can't be pushed out
    fontFamily: 'SpaceGrotesk',
  },
  chevron: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    alignSelf: 'flex-end',
    fontSize: 45.3,
    fontFamily: 'ZenOld',
  },
});

export const dock = StyleSheet.create({
  dock: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.BGColorWhiteTone,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 14,
  },
  itemActive: { backgroundColor: 'rgba(0,0,0,0.08)' },
  label: { fontSize: 12, fontWeight: '500', color: Colors.BGColorBlack },
});

export const main_card = StyleSheet.create({
  card: {
    backgroundColor: Colors.BGColorWhiteTone,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'ZenOld', fontSize: 24, color: Colors.BGColorBlack },
  more: { fontFamily: 'ZenOld', fontSize: 11, textDecorationLine: 'underline', color: Colors.BGColorBlack },

  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  colName: { flex: 2 },
  colSold: { flex: 1 },
  colProfit: { flex: 2 },

  pill: { borderRadius: 6, paddingVertical: 4, alignItems: 'center' },
  pillText: { fontFamily: 'ZenOld', fontSize: 17 },

  cell: { fontFamily: 'ZenOld', fontSize: 12, textAlign: 'center', paddingVertical: 4, color: Colors.BGColorBlack },
});
