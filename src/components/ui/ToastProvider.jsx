import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export default function ToastProvider({children}) {
  const [message, setMessage] = useState('');
  const timer = useRef();
  const insets = useSafeAreaInsets();
  const showToast = useCallback(text => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(''), 3000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return <ToastContext.Provider value={showToast}>
    <View style={styles.root}>
      {children}
      {!!message && <View pointerEvents="none" style={[styles.toast, {bottom: insets.bottom + 18}]}>
        <Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>
      </View>}
    </View>
  </ToastContext.Provider>;
}
const styles = StyleSheet.create({
  root: {flex: 1},
  toast: {position: 'absolute', left: 24, right: 24, borderRadius: 16, backgroundColor: '#2C1947', borderWidth: 1, borderColor: '#965AFF', padding: 16, elevation: 20},
  text: {color: '#FFFFFF', fontFamily: 'Poppins-Medium', textAlign: 'center', fontSize: 14},
});
