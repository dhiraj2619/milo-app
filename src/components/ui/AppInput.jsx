import React, {forwardRef, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';

const AppInput = forwardRef(({label, error, leading, containerStyle, style, onFocus, onBlur, ...props}, ref) => {
  const [focused, setFocused] = useState(false);
  return <View style={containerStyle}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <View style={[styles.field, focused && styles.focused, !!error && styles.invalid]}>
      {leading}
      <TextInput {...props} ref={ref} accessibilityLabel={props.accessibilityLabel || label} placeholderTextColor="#8B8797" selectionColor="#A46AFF" onFocus={event => {setFocused(true); onFocus?.(event);}} onBlur={event => {setFocused(false); onBlur?.(event);}} style={[styles.input, style]} />
    </View>
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
  </View>;
});
const styles = StyleSheet.create({label: {color: '#EDE9F5', marginBottom: 8}, field: {minHeight: 60, borderWidth: 1, borderColor: '#393441', borderRadius: 15, backgroundColor: '#1B1922', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15}, focused: {borderColor: '#A46AFF'}, invalid: {borderColor: '#FF809A'}, input: {flex: 1, minWidth: 0, color: '#F6F3FA', fontFamily: 'Poppins-Regular', fontSize: 16, paddingVertical: 16}, error: {color: '#FF9AAF', fontSize: 12, marginTop: 8}});
export default AppInput;
