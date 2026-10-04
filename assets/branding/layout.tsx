import { StyleSheet } from 'react-native';
const general_layout = StyleSheet.create({


});

export const hero_card = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 130,          // grows if content needs it (replaces aspectRatio)
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
    lineHeight: 20,
    flexShrink: 1,
    flex: 1,                 // label takes the leftover space, so the arrow can't be pushed out
    fontFamily: 'SpaceGrotesk'
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
