import React, {useEffect, useRef, useState} from 'react';
import {Alert, Keyboard, Pressable, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import AppButton from '../../components/ui/AppButton';
import ProfileBubbles from '../../components/auth/ProfileBubbles';
import {sendPhoneOTP, verifyPhoneOTP} from '../../services/authService';
import {useToast} from '../../components/ui/ToastProvider';

const OTP_LENGTH = 6;

export default function OTPScreen({navigation, route}) {
  const toast = useToast();
  const phone = route?.params?.phone || '';
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const busy = useRef(false);
  const [code, setCode] = useState(Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(58);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }
    const timer = setInterval(() => setSecondsLeft(value => value - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const updateCode = (value, index) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    const nextCode = [...code];
    const start = digits.length === OTP_LENGTH ? 0 : index;
    if (!digits) { nextCode[index] = ''; }
    digits.split('').forEach((digit, offset) => {
      if (start + offset < OTP_LENGTH) { nextCode[start + offset] = digit; }
    });
    setCode(nextCode);
    if (digits) {
      inputRefs.current[Math.min(start + digits.length, OTP_LENGTH - 1)]?.focus();
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendOTP = async () => {
    if (busy.current || secondsLeft > 0) { return; }
    if (!phone) {
      Alert.alert('Missing phone number', 'Go back and enter your mobile number.');
      return;
    }
    busy.current = true;
    setResending(true);
    try {
      await sendPhoneOTP(phone);
      setCode(Array(OTP_LENGTH).fill(''));
      setSecondsLeft(58);
      inputRefs.current[0]?.focus();
    } catch (error) {
      Alert.alert('Unable to resend OTP', error.message || 'Please try again.');
    } finally {
      busy.current = false;
      setResending(false);
    }
  };

  const verifyOTP = async () => {
    if (busy.current) { return; }
    if (!/^\d{6}$/.test(code.join(''))) {
      Alert.alert('Incomplete OTP', 'Please enter the 6-digit OTP to continue.');
      return;
    }
    busy.current = true;
    setVerifying(true);
    Keyboard.dismiss();
    try {
      const result = await verifyPhoneOTP(code.join(''), phone);
      toast('OTP verified successfully');
      if (result.isNewUser || !result.user?.nickname || !result.user?.gender || !result.user?.languages?.length) {
        navigation.replace('ProfileSetup', {profile: result.user || null});
      } else {
        navigation.getParent()?.reset({index: 0, routes: [{name: 'Main'}]});
      }
    } catch (error) {
      const messages = {
        'auth/invalid-verification-code': 'That code is incorrect. Check the OTP and try again.',
        'auth/session-expired': 'This OTP has expired. Request a new code.',
        'auth/too-many-requests': 'Too many attempts. Please wait before trying again.',
      };
      Alert.alert('Verification failed', messages[error.code] || error.response?.data?.message || error.message || 'Please try again.');
    } finally {
      busy.current = false;
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <View style={styles.form}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={10} style={styles.back} onPress={() => navigation.goBack()}>
            <Svg width="25" height="25" viewBox="0 0 24 24"><Path d="M19 12H5 M12 5L5 12L12 19" fill="none" stroke="#F6F3FC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </Pressable>
          <Text style={styles.heading}>Verify Your{ '\n' }Mobile Number</Text>
          <Text style={styles.description}>We&apos;ve sent a 6-digit OTP to your mobile number{ '\n' }(+91 {phone}). Please enter it below to{ '\n' }continue.</Text>

          <View style={styles.otpRow}>
            {code.map((digit, index) => <TextInput
              key={index}
              ref={input => { inputRefs.current[index] = input; }}
              value={digit}
              onChangeText={value => updateCode(value, index)}
              onKeyPress={event => handleKeyPress(event, index)}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              editable={!verifying && !resending}
              textContentType="oneTimeCode"
              autoComplete={index === 0 ? 'sms-otp' : 'off'}
              selectTextOnFocus
              textAlign="center"
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              accessibilityLabel={`OTP digit ${index + 1}`}
            />)}
          </View>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Didn&apos;t receive the code? </Text>
            <Pressable disabled={secondsLeft > 0 || verifying || resending} onPress={resendOTP}>
              <Text style={styles.resendLink}>{resending ? 'Sending...' : 'Resend OTP'}</Text>
            </Pressable>
          </View>
          <View style={styles.timerRow}><Text style={styles.clock}>◷</Text><Text style={styles.timer}>00:{String(secondsLeft).padStart(2, '0')}</Text></View>
          <AppButton title="Verify" onPress={verifyOTP} loading={verifying} disabled={verifying || resending} style={styles.verifyButton} />
        </View>
        <View style={styles.art}><ProfileBubbles /></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#09080F'},
  content: {flex: 1, justifyContent: 'space-between'},
  form: {paddingHorizontal: 34, width: '100%', maxWidth: 460, alignSelf: 'center'},
  back: {width: 44, height: 44, justifyContent: 'center', marginTop: 4, marginBottom: 8},
  heading: {fontFamily: 'Poppins-SemiBold', fontSize: 28, lineHeight: 36, color: '#F7F5FA'},
  description: {fontFamily: 'Poppins-Regular', fontSize: 14, lineHeight: 23, color: '#C4BECD', marginTop: 14},
  otpRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 28},
  otpInput: {width: 54, height: 58, borderWidth: 1.5, borderColor: '#49307E', borderRadius: 11, backgroundColor: '#111020', color: '#FFFFFF', fontFamily: 'Poppins-Medium', fontSize: 22},
  otpInputFilled: {borderColor: '#923FFF', shadowColor: '#7135FF', shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: {width: 0, height: 0}, elevation: 5},
  resendRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 34},
  resendText: {fontFamily: 'Poppins-Regular', fontSize: 12, color: '#A8A0B7'},
  resendLink: {fontFamily: 'Poppins-Medium', fontSize: 12, color: '#A04CFF'},
  timerRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 9},
  clock: {fontSize: 23, lineHeight: 23, color: '#A04CFF'},
  timer: {fontFamily: 'Poppins-Medium', fontSize: 12, color: '#C4BECD'},
  verifyButton: {marginTop: 30, width: '100%', alignSelf: 'stretch'},
  art: {justifyContent: 'flex-end', marginTop: 32, overflow: 'hidden'},
});
