import React, {useRef, useState} from 'react';
import {Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Camera, Check, Ellipsis, ImagePlus, Search, UserRound, X} from 'lucide-react-native';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AvatarBuilder from '../../components/avatar/AvatarBuilder';
import {generateAvatar, normalizeAvatar, toStoredAvatar} from '../../components/avatar/avatarConfig';
import {completeProfile} from '../../services/authService';
import {uploadProfilePhoto} from '../../services/userService';
import {pickPhoto} from '../../services/photoPicker';
import {InterestsEditor, readyToSave} from '../../components/profile/Interests';

const STEPS = [0, 1, 2, 3, 4];
const LAST_STEP = STEPS.length - 1;
const LANGUAGES = ['Hindi', 'Marathi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Gujarati', 'Malayalam', 'Punjabi', 'Urdu', 'Odia', 'Assamese'];

export default function ProfileSetupScreen({navigation, route}) {
  const initial = route.params?.profile;
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState(initial?.nickname || '');
  const [referralCode, setReferralCode] = useState('');
  const [gender, setGender] = useState(initial?.gender || '');
  const [avatar, setAvatar] = useState(initial?.avatarStyle ? normalizeAvatar(initial.avatarStyle, initial.nickname) : null);
  const [photo, setPhoto] = useState(null); // optional real photo, uploaded once the profile exists
  const [languages, setLanguages] = useState(initial?.languages || []);
  const [about, setAbout] = useState({interests: initial?.interests || [], prompts: initial?.prompts || []});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const setGenderAndReset = value => {setGender(value); setAvatar(generateAvatar(value)); setError('');};
  const choosePhoto = async source => {const result = await pickPhoto(source); if (result.asset) {setPhoto(result.asset); setError('');} else if (result.error) setError(result.error);};
  const next = async () => {
    if (busy.current) return;
    if (step === 0 && !nickname.trim()) return setError('Please enter your nickname.');
    if (step === 1 && !gender) return setError('Please select your gender.');
    if (step === 2 && !avatar && !photo) return setError('Please choose an avatar or profile photo.');
    if (step === 3 && !languages.length) return setError('Select at least one language.');
    const extras = readyToSave(about, {requireInterest: true});
    if (step === 4 && extras.error) return setError(extras.error);
    Keyboard.dismiss(); setError('');
    if (step === 1 && !avatar) setAvatar(generateAvatar(gender));
    if (step < LAST_STEP) return setStep(value => value + 1);
    busy.current = true; setSaving(true);
    try {const result = await completeProfile({nickname: nickname.trim(), gender, languages, avatarSeed: avatar?.seed || `milo-${gender}-photo`, avatarStyle: avatar ? toStoredAvatar({...avatar, gender}) : {avatarSeed: `milo-${gender}-photo`, gender}, referralCode: referralCode.trim() || undefined, interests: extras.interests, prompts: extras.prompts}); let photoFailed = false;
      // The account is already created, so a failed upload must not block signup; it can be retried from the profile screen.
      if (photo) await uploadProfilePhoto(photo).catch(() => {photoFailed = true;});
      navigation.reset({index: 0, routes: [{name: 'ProfileSuccess', params: {nickname: result.user?.nickname || nickname.trim(), photoFailed}}]});} catch (err) {setError(err.response?.data?.message || err.message || 'Unable to save your profile. Please try again.');} finally {busy.current = false; setSaving(false);}
  };
  const heading = ['What should\nwe call you?', 'What’s your\ngender?', 'Choose your\navatar', 'Which languages\ndo you speak?', 'What are\nyou into?'][step];
  return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={styles.page}>
    <View style={styles.header}><Pressable onPress={() => step ? setStep(value => value - 1) : navigation.goBack()} disabled={saving} style={styles.back}><ArrowLeft color="#FFF" size={25} /></Pressable><View style={styles.progress}>{STEPS.map(index => <View key={index} style={[styles.segment, index <= step && styles.active]} />)}</View></View>
    <Text style={styles.heading}>{heading}</Text>
    <Text style={styles.description}>{step === 2 ? 'Make an avatar that looks like you. Match your skin tone with a selfie, then pick your hair, eyes and lips.' : step === 0 ? 'Choose a nickname that represents you. You can always change it later.' : step === 1 ? 'This helps us connect you with better matches.' : step === 3 ? 'Select one or more languages you’re comfortable with.' : 'Pick what you love talking about. It gives people an easy way to start a conversation.'}</Text>
    {step === 0 && <View style={styles.body}><AppInput placeholder="Your Nickname" value={nickname} onChangeText={value => {setNickname(value); setError('');}} maxLength={20} leading={<UserRound size={20} color="#C9C2D6" style={styles.inputIcon} />} /><Text style={styles.counter}>{nickname.length}/20</Text><AppInput placeholder="Referral code (optional)" value={referralCode} onChangeText={value => {setReferralCode(value.toUpperCase().replace(/\s/g, '')); setError('');}} autoCapitalize="characters" maxLength={12} /></View>}
    {step === 1 && <View style={styles.body}>{[{value:'male',label:'Male',symbol:'♂'}, {value:'female',label:'Female',symbol:'♀'}, {value:'other',label:'Other'}].map(item => <Pressable key={item.value} onPress={() => setGenderAndReset(item.value)} style={[styles.genderCard, gender === item.value && styles.selected]}>{item.value === 'other' ? <View style={styles.symbolIcon}><Ellipsis size={32} color="#C56AFF" strokeWidth={3} /></View> : <Text numberOfLines={1} style={styles.symbol}>{item.symbol}</Text>}<Text style={styles.optionText}>{item.label}</Text>{gender === item.value && <View style={styles.cornerCheck}><Check size={13} color="#FFF" /></View>}</Pressable>)}</View>}
    {step === 2 && <ScrollView contentContainerStyle={styles.avatarBody} showsVerticalScrollIndicator={false}>{avatar && <AvatarBuilder gender={gender} value={avatar} onChange={value => {setAvatar(value); setError('');}} onUsePhoto={asset => {setPhoto(asset); setError('');}} photoUri={photo?.uri} />}
      <View style={styles.photoCard}>
        <Text style={styles.photoTitle}>Profile photo <Text style={styles.optional}>(optional)</Text></Text>
        <Text style={styles.photoHint}>Others see your photo instead of the avatar. You can change it any time.</Text>
        {photo ? <View style={styles.photoPreview}><Image source={{uri: photo.uri}} style={styles.photo} /><Text style={styles.photoText}>Profile photo selected</Text><Pressable accessibilityRole="button" accessibilityLabel="Remove photo" hitSlop={8} onPress={() => setPhoto(null)} style={styles.removePhoto}><X size={16} color="#F2EAFE" /></Pressable></View> : null}
        <View style={styles.photoButtons}>
          <Pressable onPress={() => choosePhoto('camera')} style={[styles.upload, styles.uploadPrimary]}><Camera size={18} color="#FFF" /><Text style={styles.uploadText}>Take selfie</Text></Pressable>
          <Pressable onPress={() => choosePhoto('library')} style={styles.upload}><ImagePlus size={18} color="#E4C4FF" /><Text style={styles.uploadText}>{photo ? 'Change photo' : 'From gallery'}</Text></Pressable>
        </View>
      </View></ScrollView>}
    {step === 3 && <><AppInput placeholder="Search languages" value={search} onChangeText={setSearch} containerStyle={styles.search} leading={<Search size={20} color="#C9C2D6" style={styles.inputIcon} />} /><ScrollView contentContainerStyle={styles.languages}>{LANGUAGES.filter(item => item.toLowerCase().includes(search.toLowerCase())).map(language => {const selected = languages.includes(language); return <Pressable key={language} onPress={() => {setLanguages(current => selected ? current.filter(item => item !== language) : [...current, language]); setError('');}} style={[styles.languageRow, selected && styles.selected]}><Text style={styles.optionText}>{language}</Text><View style={styles.circle}>{selected && <Check size={13} color="#FFF" />}</View></Pressable>;})}</ScrollView></>}
    {step === 4 && <ScrollView contentContainerStyle={styles.aboutBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><InterestsEditor value={about} onChange={value => {setAbout(value); setError('');}} /></ScrollView>}
    {!!error && <Text style={styles.error}>{error}</Text>}<AppButton title="Continue" onPress={next} loading={saving} disabled={saving} style={styles.button} />
  </View></KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({screen:{flex:1,backgroundColor:'#09080F'},flex:{flex:1},page:{flex:1,paddingHorizontal:24,maxWidth:500,width:'100%',alignSelf:'center'},header:{height:70,flexDirection:'row',alignItems:'center'},back:{width:44,height:44,justifyContent:'center'},progress:{flex:1,flexDirection:'row',gap:8,marginLeft:18},segment:{flex:1,height:7,borderRadius:5,backgroundColor:'#3A304F'},active:{backgroundColor:'#9850FF'},heading:{color:'#F7F5FA',fontFamily:'Poppins-SemiBold',fontSize:28,lineHeight:37,marginTop:20},description:{color:'#C8C3D0',fontFamily:'Poppins-Regular',fontSize:14,lineHeight:22,marginTop:14},body:{paddingTop:36,gap:14},inputIcon:{marginRight:12},counter:{textAlign:'right',color:'#B9B1C5',fontSize:12},genderCard:{minHeight:78,borderRadius:17,borderWidth:1,borderColor:'#38323F',backgroundColor:'#1B1923',paddingHorizontal:20,flexDirection:'row',alignItems:'center',gap:16},selected:{borderColor:'#9957FF',backgroundColor:'#1B142E'},symbol:{color:'#C56AFF',fontSize:36,width:40,textAlign:'center',includeFontPadding:false},symbolIcon:{width:40,height:40,alignItems:'center',justifyContent:'center'},optionText:{fontFamily:'Poppins-Regular',color:'#F0EBF6',fontSize:16},cornerCheck:{position:'absolute',right:10,top:10,width:21,height:21,borderRadius:11,backgroundColor:'#9855FA',alignItems:'center',justifyContent:'center'},avatarBody:{paddingTop:24,paddingBottom:12},aboutBody:{paddingTop:22,paddingBottom:12},photoCard:{marginTop:18,borderRadius:18,borderWidth:1,borderColor:'#3D2C5C',backgroundColor:'#17122A',padding:14},photoTitle:{color:'#F7F2FD',fontFamily:'Poppins-SemiBold',fontSize:15},optional:{color:'#B9B1C5',fontFamily:'Poppins-Regular',fontSize:12},photoHint:{color:'#B9B1C5',fontFamily:'Poppins-Regular',fontSize:11.5,lineHeight:16,marginTop:2},photoButtons:{flexDirection:'row',gap:10,marginTop:12},upload:{flex:1,minHeight:44,borderRadius:12,borderWidth:1,borderColor:'#5B3F8C',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},uploadPrimary:{backgroundColor:'#8B40EE',borderColor:'#8B40EE'},uploadText:{fontFamily:'Poppins-Medium',fontSize:13,color:'#FFF'},photoPreview:{marginTop:12,flexDirection:'row',alignItems:'center',gap:12,padding:7,borderRadius:14,backgroundColor:'#1A1821'},photo:{width:56,height:56,borderRadius:28},photoText:{flex:1,color:'#F2EAFE',fontSize:14},removePhoto:{width:30,height:30,borderRadius:15,backgroundColor:'#2A1D45',alignItems:'center',justifyContent:'center'},search:{marginTop:20,marginBottom:12},languages:{gap:10,paddingBottom:10},languageRow:{minHeight:49,borderRadius:14,borderWidth:1,borderColor:'#38323F',backgroundColor:'#191820',paddingHorizontal:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},circle:{width:21,height:21,borderRadius:11,borderWidth:1,borderColor:'#77707F',alignItems:'center',justifyContent:'center'},error:{color:'#FF9AAF',fontSize:13,marginTop:8},button:{marginTop:10,marginBottom:18}});
