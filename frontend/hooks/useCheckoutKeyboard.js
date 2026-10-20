import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Keyboard, Platform } from 'react-native';

export default function useCheckoutKeyboard() {
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const cashFocusedRef = useRef(false);
  const keyboardVisibleRef = useRef(false);
  const scrollFrameRef = useRef(null);
  const listHeightRef = useRef(0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const cancelScroll = useCallback(() => {
    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
  }, []);

  const scrollToCash = useCallback(() => {
    if (Platform.OS === 'web' || !cashFocusedRef.current || !keyboardVisibleRef.current) return;
    cancelScroll();
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      if (cashFocusedRef.current && keyboardVisibleRef.current) {
        listRef.current?.scrollToEnd({ animated: true });
      }
    });
  }, [cancelScroll]);

  const onContainerLayout = useCallback(() => {
    if (Platform.OS === 'web') return;
    // Measure outside the avoiding view so keyboard padding cannot change the header offset.
    containerRef.current?.measureInWindow((_x, y) => {
      setKeyboardOffset(Math.max(0, y));
    });
  }, []);

  const onListLayout = useCallback((event) => {
    const height = event.nativeEvent.layout.height;
    const previousHeight = listHeightRef.current;
    listHeightRef.current = height;
    if (height < previousHeight) scrollToCash();
  }, [scrollToCash]);

  const onCashFocus = useCallback(() => {
    cashFocusedRef.current = true;
    scrollToCash();
  }, [scrollToCash]);

  const onCashBlur = useCallback(() => {
    cashFocusedRef.current = false;
    cancelScroll();
  }, [cancelScroll]);

  useFocusEffect(useCallback(() => {
    if (Platform.OS === 'web') return;
    keyboardVisibleRef.current = Keyboard.isVisible();
    onContainerLayout();
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      keyboardVisibleRef.current = true;
      scrollToCash();
    });
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboardVisibleRef.current = false;
        cancelScroll();
      },
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      cashFocusedRef.current = false;
      keyboardVisibleRef.current = false;
      cancelScroll();
    };
  }, [cancelScroll, onContainerLayout, scrollToCash]));

  return {
    containerRef,
    listRef,
    keyboardOffset,
    onContainerLayout,
    onListLayout,
    onCashFocus,
    onCashBlur,
    scrollToCash,
  };
}
