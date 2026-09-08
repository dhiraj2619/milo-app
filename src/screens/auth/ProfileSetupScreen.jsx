import React, {useEffect, useRef, useState} from 'react';
import {BackHandler, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Circle, Path} from 'react-native-svg';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import {useToast} from '../../components/ui/ToastProvider';
import {completeProfile} from '../../services/authService';

const LANGUAGES = ['Hindi', 'Marathi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Gujarati', 'Malayalam', 'Punjabi', 'Urdu', 'Odia', 'Assamese'];
const HEADINGS = ['What should\nwe call you?', 'What’s your\ngender?', 'Which languages\ndo you speak?'];
const DESCRIPTIONS = ['Choose a nickname that represents you.\nYou can always change it later.', 'This helps us connect you with\nbetter matches.', 'Select one or more languages\nyou’re comfortable with.'];

function Icon({kind, color = '#C9C2D6'}) {
  return <Svg width="24" height="24" viewBox="0 0 24 24">
    {kind === 'search' ? <><Circle cx="10" cy="10" r="6" stroke={color} strokeWidth="1.6" fill="none" /><Path d="M15 15L21 21" stroke={color} strokeWidth="1.6" /></> : <><Circle cx="12" cy="7" r="3" stroke={color} strokeWidth="1.6" fill="none" /><Path d="M5 21V18C5 11 19 11 19 18V21" stroke={color} strokeWidth="1.6" fill="none" /></>}
  </Svg>;
}

export default function ProfileSetupScreen({navigation, route}) {
  const initial = route.params?.profile;
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState(initial?.nickname || '');
  const [gender, setGender] = useState(initial?.gender || '');
  const [languages, setLanguages] = useState(initial?.languages || []);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const toast = useToast();

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!busy.current && step > 0) {setStep(value => value - 1); setError('');}
      else if (!busy.current) {navigation.goBack();}
      return true;
    });
    return () => subscription.remove();
  }, [step, navigation]);

  const back = () => {
    if (saving) {return;}
    setError('');
    if (step > 0) {setStep(step - 1);} else {navigation.goBack();}
  };
  const next = async () => {
    if (busy.current) {return;}
    if (step === 0 && !nickname.trim()) {setError('Please enter your nickname.'); return;}
    if (step === 1 && !gender) {setError('Please select your gender.'); return;}
    if (step === 2 && !languages.length) {setError('Select at least one language.'); return;}
    Keyboard.dismiss();
    setError('');
    if (step < 2) {setStep(step + 1); return;}
    busy.current = true;
    setSaving(true);
    try {
      await completeProfile({nickname: nickname.trim(), gender, languages});
      toast('Profile completed successfully');
      navigation.getParent()?.reset({index: 0, routes: [{name: 'Main'}]});
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to save your profile. Please try again.');
    } finally {busy.current = false; setSaving(false);}
  };

  return <SafeAreaView style={styles.screen}>
    <StatusBar barStyle="light-content" />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable onPress={back} disabled={saving} accessibilityRole="button" accessibilityLabel="Previous step" style={styles.back}>
            <Svg width="25" height="25" viewBox="0 0 24 24"><Path d="M19 12H5M12 5L5 12L12 19" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </Pressable>
          <View style={styles.progress} accessible accessibilityLabel={`Profile setup step ${step + 1} of 3`}>
            {[0, 1, 2, 3].map(index => <View key={index} style={[styles.segment, index <= step + 1 && styles.activeSegment]} />)}
          </View>
        </View>
        <Text style={styles.heading}>{HEADINGS[step]}</Text>
        <Text style={styles.description}>{DESCRIPTIONS[step]}</Text>
        {step === 0 ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.nicknameContent}>
          <AppInput accessibilityLabel="Your nickname" placeholder="Your Nickname" value={nickname} onChangeText={text => {setNickname(text); setError('');}} maxLength={20} autoCapitalize="words" returnKeyType="next" onSubmitEditing={next} leading={<View style={styles.inputIcon}><Icon kind="user" /></View>} />
          <Text style={styles.counter}>{nickname.length}/20</Text>
          {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
          <AppButton title="Continue" onPress={next} style={styles.nicknameButton} />
        </ScrollView> : <>
          {step === 1 ? <ScrollView contentContainerStyle={styles.genderContent}>
            {[{value: 'male', label: 'Male', symbol: '♂'}, {value: 'female', label: 'Female', symbol: '♀'}, {value: 'other', label: 'Other', symbol: '•••'}].map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{checked: gender === option.value}} onPress={() => {setGender(option.value); setError('');}} style={[styles.genderCard, gender === option.value && styles.selected]}>
              <Text style={[styles.genderSymbol, option.value === 'female' && styles.pink, option.value === 'other' && styles.other]}>{option.symbol}</Text>
              <Text style={styles.optionText}>{option.label}</Text>
              {gender === option.value && <Text style={styles.genderCheck}>✓</Text>}
            </Pressable>)}
          </ScrollView> : <>
            <AppInput accessibilityLabel="Search languages" placeholder="Search languages" value={search} onChangeText={setSearch} containerStyle={styles.search} leading={<View style={styles.inputIcon}><Icon kind="search" /></View>} />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.languages}>
              {LANGUAGES.filter(language => language.toLowerCase().includes(search.trim().toLowerCase())).map(language => {
                const selected = languages.includes(language);
                return <Pressable key={language} disabled={saving} accessibilityRole="checkbox" accessibilityState={{checked: selected}} onPress={() => {setLanguages(current => selected ? current.filter(item => item !== language) : [...current, language]); setError('');}} style={[styles.languageRow, selected && styles.selected]}>
                  <Text style={styles.optionText}>{language}</Text><View style={[styles.check, selected && styles.checked]}>{selected && <Text style={styles.tick}>✓</Text>}</View>
                </Pressable>;
              })}
              {!LANGUAGES.some(language => language.toLowerCase().includes(search.trim().toLowerCase())) && <Text style={styles.description}>No languages found.</Text>}
            </ScrollView>
          </>}
          {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
          <AppButton title="Continue" onPress={next} loading={saving} disabled={saving} style={styles.footerButton} />
        </>}
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#09080F'}, flex: {flex: 1},
  page: {flex: 1, paddingHorizontal: 24, width: '100%', maxWidth: 480, alignSelf: 'center'},
  header: {flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 28}, back: {width: 44, height: 44, justifyContent: 'center'},
  progress: {flex: 1, flexDirection: 'row', gap: 8, marginLeft: 18}, segment: {flex: 1, height: 7, borderRadius: 5, backgroundColor: '#3A304F'}, activeSegment: {backgroundColor: '#9850FF'},
  heading: {color: '#F7F5FA', fontFamily: 'Poppins-SemiBold', fontSize: 28, lineHeight: 37},
  description: {color: '#C8C3D0', fontFamily: 'Poppins-Regular', fontSize: 14, lineHeight: 23, marginTop: 16},
  nicknameContent: {paddingTop: 48, paddingBottom: 24}, inputIcon: {marginRight: 12}, counter: {textAlign: 'right', color: '#B9B1C5', fontSize: 12, marginTop: 10, fontFamily: 'Poppins-Regular'}, nicknameButton: {marginTop: 36},
  genderContent: {paddingTop: 32, paddingBottom: 24, gap: 16},
  genderCard: {minHeight: 94, borderWidth: 1, borderColor: '#38323F', borderRadius: 18, backgroundColor: '#1B1923', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24},
  selected: {borderColor: '#9957FF', backgroundColor: '#1B142E', borderWidth: 1.5},
  genderSymbol: {color: '#A253FF', fontSize: 50, width: 68}, pink: {color: '#E15CF2'}, other: {color: '#D6CFDF', fontSize: 24},
  optionText: {fontFamily: 'Poppins-Regular', color: '#F0EBF6', fontSize: 16}, genderCheck: {position: 'absolute', right: 12, top: 12, color: '#FFFFFF', backgroundColor: '#9855FA', borderRadius: 12, width: 21, height: 21, textAlign: 'center'},
  search: {marginTop: 22, marginBottom: 16}, languages: {gap: 12, paddingBottom: 14},
  languageRow: {minHeight: 49, borderRadius: 14, borderWidth: 1, borderColor: '#38323F', backgroundColor: '#191820', paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  check: {width: 21, height: 21, borderRadius: 11, borderWidth: 1, borderColor: '#77707F', alignItems: 'center', justifyContent: 'center'}, checked: {backgroundColor: '#9855FA', borderColor: '#B891FF'}, tick: {fontSize: 14, color: '#FFFFFF'},
  error: {color: '#FF9AAF', fontSize: 13, marginVertical: 10}, footerButton: {marginTop: 10, marginBottom: 18},
});
