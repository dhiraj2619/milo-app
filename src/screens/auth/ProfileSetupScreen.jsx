import React, {useMemo, useRef, useState} from 'react';
import {Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchImageLibrary} from 'react-native-image-picker';
import {ArrowLeft, Check, ImagePlus, Search, UserRound} from 'lucide-react-native';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import {completeProfile} from '../../services/authService';

const LANGUAGES = ['Hindi', 'Marathi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Gujarati', 'Malayalam', 'Punjabi', 'Urdu', 'Odia', 'Assamese'];
const BACKGROUNDS = ['#F7A0C5', '#B9A0FF', '#FFD787', '#8DC9FF', '#FFAFA5', '#A7E5CE', '#E3AAFF', '#FFC49C', '#9BD2D0', '#F2B0DE', '#C4B2FF', '#F5D991', '#ABDAFF', '#F4A7B8', '#B3E1B3', '#E0B3F6'];
const avatarOptions = gender => BACKGROUNDS.map((background, index) => ({avatarSeed: `milo-${gender}-${index + 1}`, background, gender, hair: gender === 'male' ? ['#33221E', '#4A2B22', '#24242C'][index % 3] : ['#392323', '#63362D', '#2E2120'][index % 3], shirt: gender === 'male' ? ['#5275BE', '#4A8C77', '#7457A4'][index % 3] : ['#E56D9A', '#A58CF4', '#C768E3'][index % 3], bun: gender === 'female' && index % 5 === 0, glasses: index % 7 === 0}));

export default function ProfileSetupScreen({navigation, route}) {
  const initial = route.params?.profile;
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState(initial?.nickname || '');
  const [gender, setGender] = useState(initial?.gender || '');
  const [avatar, setAvatar] = useState(initial?.avatarStyle || null);
  const [photoUri, setPhotoUri] = useState(null);
  const [languages, setLanguages] = useState(initial?.languages || []);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const options = useMemo(() => avatarOptions(gender), [gender]);
  const setGenderAndReset = value => {setGender(value); setAvatar(null); setPhotoUri(null); setError('');};
  const uploadPhoto = async () => {const result = await launchImageLibrary({mediaType: 'photo', selectionLimit: 1, quality: 0.8, maxWidth: 1200, maxHeight: 1200}); const selected = result.assets?.[0]; if (selected?.uri) {setPhotoUri(selected.uri); setAvatar(null); setError('');}};
  const next = async () => {
    if (busy.current) return;
    if (step === 0 && !nickname.trim()) return setError('Please enter your nickname.');
    if (step === 1 && !gender) return setError('Please select your gender.');
    if (step === 2 && !avatar && !photoUri) return setError('Please choose an avatar or profile photo.');
    if (step === 3 && !languages.length) return setError('Select at least one language.');
    Keyboard.dismiss(); setError('');
    if (step < 3) return setStep(value => value + 1);
    busy.current = true; setSaving(true);
    try {await completeProfile({nickname: nickname.trim(), gender, languages, avatarSeed: avatar?.avatarSeed || `milo-${gender}-photo`, avatarStyle: avatar || {avatarSeed: `milo-${gender}-photo`, gender}}); navigation.reset({index: 0, routes: [{name: 'ProfileSuccess'}]});} catch (err) {setError(err.response?.data?.message || err.message || 'Unable to save your profile. Please try again.');} finally {busy.current = false; setSaving(false);}
  };
  const heading = ['What should\nwe call you?', 'What’s your\ngender?', 'Choose your\navatar', 'Which languages\ndo you speak?'][step];
  return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={styles.page}>
    <View style={styles.header}><Pressable onPress={() => step ? setStep(value => value - 1) : navigation.goBack()} disabled={saving} style={styles.back}><ArrowLeft color="#FFF" size={25} /></Pressable><View style={styles.progress}>{[0,1,2,3].map(index => <View key={index} style={[styles.segment, index <= step && styles.active]} />)}</View></View>
    <Text style={styles.heading}>{heading}</Text>
    <Text style={styles.description}>{step === 2 ? `Choose from 16 ${gender || 'profile'} avatars, or add your own profile photo.` : step === 0 ? 'Choose a nickname that represents you. You can always change it later.' : step === 1 ? 'This helps us connect you with better matches.' : 'Select one or more languages you’re comfortable with.'}</Text>
    {step === 0 && <View style={styles.body}><AppInput placeholder="Your Nickname" value={nickname} onChangeText={value => {setNickname(value); setError('');}} maxLength={20} leading={<UserRound size={20} color="#C9C2D6" style={styles.inputIcon} />} /><Text style={styles.counter}>{nickname.length}/20</Text></View>}
    {step === 1 && <View style={styles.body}>{[{value:'male',label:'Male',symbol:'♂'}, {value:'female',label:'Female',symbol:'♀'}, {value:'other',label:'Other',symbol:'•••'}].map(item => <Pressable key={item.value} onPress={() => setGenderAndReset(item.value)} style={[styles.genderCard, gender === item.value && styles.selected]}><Text style={styles.symbol}>{item.symbol}</Text><Text style={styles.optionText}>{item.label}</Text>{gender === item.value && <View style={styles.cornerCheck}><Check size={13} color="#FFF" /></View>}</Pressable>)}</View>}
    {step === 2 && <ScrollView contentContainerStyle={styles.avatarBody} showsVerticalScrollIndicator={false}><View style={styles.avatarGrid}>{options.map(item => <Pressable key={item.avatarSeed} onPress={() => {setAvatar(item); setPhotoUri(null); setError('');}} style={[styles.avatarChoice, avatar?.avatarSeed === item.avatarSeed && styles.selected]}><ProfileAvatar {...item} />{avatar?.avatarSeed === item.avatarSeed && <View style={styles.cornerCheck}><Check size={13} color="#FFF" /></View>}</Pressable>)}</View>{photoUri && <View style={styles.photoPreview}><Image source={{uri: photoUri}} style={styles.photo} /><Text style={styles.photoText}>Profile photo selected</Text></View>}<Pressable onPress={uploadPhoto} style={styles.upload}><ImagePlus size={20} color="#E4C4FF" /><Text style={styles.uploadText}>Upload profile photo</Text></Pressable></ScrollView>}
    {step === 3 && <><AppInput placeholder="Search languages" value={search} onChangeText={setSearch} containerStyle={styles.search} leading={<Search size={20} color="#C9C2D6" style={styles.inputIcon} />} /><ScrollView contentContainerStyle={styles.languages}>{LANGUAGES.filter(item => item.toLowerCase().includes(search.toLowerCase())).map(language => {const selected = languages.includes(language); return <Pressable key={language} onPress={() => {setLanguages(current => selected ? current.filter(item => item !== language) : [...current, language]); setError('');}} style={[styles.languageRow, selected && styles.selected]}><Text style={styles.optionText}>{language}</Text><View style={styles.circle}>{selected && <Check size={13} color="#FFF" />}</View></Pressable>;})}</ScrollView></>}
    {!!error && <Text style={styles.error}>{error}</Text>}<AppButton title="Continue" onPress={next} loading={saving} disabled={saving} style={styles.button} />
  </View></KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({screen:{flex:1,backgroundColor:'#09080F'},flex:{flex:1},page:{flex:1,paddingHorizontal:24,maxWidth:500,width:'100%',alignSelf:'center'},header:{height:70,flexDirection:'row',alignItems:'center'},back:{width:44,height:44,justifyContent:'center'},progress:{flex:1,flexDirection:'row',gap:8,marginLeft:18},segment:{flex:1,height:7,borderRadius:5,backgroundColor:'#3A304F'},active:{backgroundColor:'#9850FF'},heading:{color:'#F7F5FA',fontFamily:'Poppins-SemiBold',fontSize:28,lineHeight:37,marginTop:20},description:{color:'#C8C3D0',fontFamily:'Poppins-Regular',fontSize:14,lineHeight:22,marginTop:14},body:{paddingTop:36,gap:14},inputIcon:{marginRight:12},counter:{textAlign:'right',color:'#B9B1C5',fontSize:12},genderCard:{minHeight:78,borderRadius:17,borderWidth:1,borderColor:'#38323F',backgroundColor:'#1B1923',paddingHorizontal:20,flexDirection:'row',alignItems:'center',gap:16},selected:{borderColor:'#9957FF',backgroundColor:'#1B142E'},symbol:{color:'#C56AFF',fontSize:36,width:36},optionText:{fontFamily:'Poppins-Regular',color:'#F0EBF6',fontSize:16},cornerCheck:{position:'absolute',right:10,top:10,width:21,height:21,borderRadius:11,backgroundColor:'#9855FA',alignItems:'center',justifyContent:'center'},avatarBody:{paddingTop:24,paddingBottom:12},avatarGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},avatarChoice:{width:'21%',aspectRatio:1,borderRadius:28,overflow:'hidden',borderWidth:2,borderColor:'#393343'},upload:{marginTop:20,minHeight:56,borderRadius:16,borderWidth:1,borderColor:'#9C5CFF',borderStyle:'dashed',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,backgroundColor:'#1A112A'},uploadText:{fontFamily:'Poppins-Medium',fontSize:14,color:'#E4C4FF'},photoPreview:{height:74,marginTop:16,flexDirection:'row',alignItems:'center',gap:12,padding:7,borderRadius:14,backgroundColor:'#1A1821'},photo:{width:60,height:60,borderRadius:30},photoText:{color:'#F2EAFE',fontSize:14},search:{marginTop:20,marginBottom:12},languages:{gap:10,paddingBottom:10},languageRow:{minHeight:49,borderRadius:14,borderWidth:1,borderColor:'#38323F',backgroundColor:'#191820',paddingHorizontal:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},circle:{width:21,height:21,borderRadius:11,borderWidth:1,borderColor:'#77707F',alignItems:'center',justifyContent:'center'},error:{color:'#FF9AAF',fontSize:13,marginTop:8},button:{marginTop:10,marginBottom:18}});
