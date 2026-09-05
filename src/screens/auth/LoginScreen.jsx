import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import ProfileBubbles from '../../components/auth/ProfileBubbles';

export default function LoginScreen({navigation}) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const sendOTP = () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setError('');
    Alert.alert('Coming soon', 'Phone verification will be available soon. No OTP has been sent.');
  };
  return <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
    <StatusBar barStyle="light-content" />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={10} style={styles.back} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.getParent()?.navigate('Main')}>
            <Svg width="25" height="25" viewBox="0 0 24 24"><Path d="M19 12H5 M12 5L5 12L12 19" fill="none" stroke="#F6F3FC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </Pressable>
          <Text style={styles.heading}>Enter Your{'\n'}Mobile Number</Text>
          <Text style={styles.description}>We'll send you a one-time password{'\n'}(OTP) to verify your number.</Text>
          <AppInput containerStyle={styles.phoneField} accessibilityLabel="Mobile number" placeholder="98765 43210" value={phone}
            onChangeText={value => {setPhone(value.replace(/\D/g, '').slice(0, 10)); setError('');}}
            keyboardType="phone-pad" autoComplete="tel-national" textContentType="telephoneNumber" returnKeyType="done" onSubmitEditing={sendOTP} error={error}
            leading={<View style={styles.prefix}><Text style={styles.flag}>🇮🇳</Text><Text style={styles.countryCode}>+91</Text><View style={styles.divider} /></View>} />
          <AppButton title="Send OTP" onPress={sendOTP} style={styles.sendButton} />
          <Text style={styles.terms}>By continuing, you agree to our{'\n'}<Text style={styles.termsHighlight}>Terms & Privacy Policy</Text></Text>
        </View>
        <View style={styles.art}><ProfileBubbles /></View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#09080F'}, flex: {flex: 1}, content: {flexGrow: 1},
  form: {paddingHorizontal: 24, width: '100%', maxWidth: 460, alignSelf: 'center'},
  back: {width: 44, height: 44, justifyContent: 'center', marginTop: 4, marginBottom: 4},
  heading: {fontFamily: 'Poppins-SemiBold', fontSize: 28, lineHeight: 36, color: '#F7F5FA'},
  description: {fontFamily: 'Poppins-Regular', fontSize: 14, lineHeight: 23, color: '#C4BECD', marginTop: 14},
  phoneField: {marginTop: 36}, prefix: {flexDirection: 'row', alignItems: 'center'},
  flag: {fontSize: 22, marginRight: 8}, countryCode: {fontFamily: 'Poppins-Medium', fontSize: 16, color: '#F6F3FA'},
  divider: {width: 1, height: 22, backgroundColor: '#48414F', marginHorizontal: 12},
  sendButton: {marginTop: 30},
  terms: {textAlign: 'center', color: '#A8A0B7', fontFamily: 'Poppins-Regular', fontSize: 12, lineHeight: 19, marginTop: 34}, termsHighlight: {color: '#DBCEFA'},
  art: {flex: 1, justifyContent: 'flex-end', marginTop: 30, overflow: 'hidden'},
});

