import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchImageLibrary} from 'react-native-image-picker';
import {ArrowLeft, Camera, Check, Pencil, RefreshCw} from 'lucide-react-native';
import AppButton from '../../components/ui/AppButton';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import {getMyProfile, updateMyProfile} from '../../services/userService';
import {useToast} from '../../components/ui/ToastProvider';

const AVATARS = [
  {avatarSeed: 'milo-lavender', background: '#B996FF', hair: '#392323', shirt: '#A45EEB'},
  {avatarSeed: 'milo-sunshine', background: '#FFD67B', hair: '#2E2120', shirt: '#EB766E'},
  {avatarSeed: 'milo-ocean', background: '#82C8FF', hair: '#52352B', shirt: '#5B76C8'},
  {avatarSeed: 'milo-rose', background: '#FF9FC6', hair: '#482721', shirt: '#E85F91'},
  {avatarSeed: 'milo-violet', background: '#9A83F8', hair: '#63362D', shirt: '#A58CF4', bun: true},
  {avatarSeed: 'milo-mint', background: '#8EE0C7', hair: '#312520', shirt: '#5BA982'},
];

export default function ProfileScreen({navigation}) {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localPhoto, setLocalPhoto] = useState(null);

  const load = useCallback(async () => {
    try { setProfile(await getMyProfile()); }
    catch (error) { toast(error.response?.data?.message || 'Unable to load your profile.'); }
    finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const choosePhoto = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', selectionLimit: 1, quality: 0.8, maxWidth: 1200, maxHeight: 1200});
    if (result.didCancel) { return; }
    const asset = result.assets?.[0];
    if (!asset?.uri) { Alert.alert('Photo unavailable', 'Please choose another image.'); return; }
    setLocalPhoto(asset.uri);
    toast('Photo selected. Saving it needs server upload enabled.');
  };

  const saveAvatar = async () => {
    if (!selected) { return; }
    setSaving(true);
    try { setProfile(await updateMyProfile({avatarSeed: selected.avatarSeed, avatarStyle: selected})); setSelected(null); toast('Avatar updated'); }
    catch (error) { Alert.alert('Could not save avatar', error.response?.data?.message || 'Please try again.'); }
    finally { setSaving(false); }
  };

  const avatar = selected || profile?.avatarStyle || {avatarSeed: profile?.avatarSeed || 'milo-user'};
  return <SafeAreaView style={styles.screen}>
    <StatusBar barStyle="light-content" />
    <View style={styles.header}><Pressable onPress={() => navigation.goBack()} style={styles.back}><ArrowLeft color="#FFF" /></Pressable><Text style={styles.title}>My Profile</Text><View style={styles.back} /></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.photoWrap}><ProfileAvatar {...avatar} photoUrl={localPhoto || profile?.photoUrl} /><Pressable disabled={saving} onPress={choosePhoto} style={styles.camera}><Camera size={18} color="#FFF" /></Pressable></View>
      <Text style={styles.name}>{profile?.nickname || (loading ? 'Loading…' : 'MILO user')}</Text>
      <Text style={styles.phone}>{profile?.phone || ''}</Text>
      <Text style={styles.sectionTitle}>Choose your avatar</Text>
      <Text style={styles.copy}>Pick a character now. You can upload your own photo anytime.</Text>
      <View style={styles.avatarGrid}>{AVATARS.map(item => <Pressable key={item.avatarSeed} onPress={() => setSelected(item)} style={[styles.avatarOption, (selected?.avatarSeed || profile?.avatarSeed) === item.avatarSeed && styles.selected]}><ProfileAvatar {...item} /><View style={styles.check}>{(selected?.avatarSeed || profile?.avatarSeed) === item.avatarSeed && <Check size={13} color="#FFF" strokeWidth={3} />}</View></Pressable>)}</View>
      <AppButton title="Save avatar" onPress={saveAvatar} loading={saving} disabled={!selected || saving} style={styles.button} />
      <View style={styles.info}><View><Text style={styles.infoLabel}>Gender</Text><Text style={styles.infoValue}>{profile?.gender || '—'}</Text></View><View><Text style={styles.infoLabel}>Languages</Text><Text style={styles.infoValue}>{profile?.languages?.join(', ') || '—'}</Text></View><Pencil size={17} color="#B275FF" /></View>
      <Pressable onPress={() => {setSelected(AVATARS[Math.floor(Math.random() * AVATARS.length)]);}} style={styles.random}><RefreshCw size={16} color="#C77CFF" /><Text style={styles.randomText}>Try a random avatar</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#09080F'}, header:{height:58,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, back:{width:40,height:40,alignItems:'center',justifyContent:'center'}, title:{color:'#FFF',fontFamily:'Poppins-SemiBold',fontSize:19}, content:{padding:24,paddingTop:14,paddingBottom:40,alignItems:'center'}, photoWrap:{width:142,height:142,borderRadius:71,overflow:'hidden',borderWidth:3,borderColor:'#A95CFF',backgroundColor:'#211933'}, camera:{position:'absolute',right:3,bottom:3,width:39,height:39,borderRadius:20,backgroundColor:'#8B40EE',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#09080F'}, name:{color:'#FFF',fontFamily:'Poppins-SemiBold',fontSize:25,marginTop:17}, phone:{color:'#BDB5CB',fontSize:13,marginTop:3}, sectionTitle:{alignSelf:'stretch',color:'#F7F2FD',fontFamily:'Poppins-SemiBold',fontSize:20,marginTop:38}, copy:{alignSelf:'stretch',color:'#B9B1C5',fontSize:13,lineHeight:20,marginTop:5}, avatarGrid:{alignSelf:'stretch',flexDirection:'row',flexWrap:'wrap',gap:14,marginTop:20}, avatarOption:{width:'29%',aspectRatio:1,borderRadius:35,overflow:'hidden',borderWidth:2,borderColor:'#373040'}, selected:{borderColor:'#B66BFF'}, check:{position:'absolute',right:2,bottom:2,width:23,height:23,borderRadius:12,backgroundColor:'#9350F5',alignItems:'center',justifyContent:'center'}, button:{marginTop:26}, info:{alignSelf:'stretch',marginTop:30,backgroundColor:'#17141F',borderColor:'#342E3F',borderWidth:1,borderRadius:18,padding:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, infoLabel:{color:'#AFA6BF',fontSize:11}, infoValue:{color:'#FFF',fontSize:14,textTransform:'capitalize',marginTop:4,maxWidth:210}, random:{marginTop:24,flexDirection:'row',gap:8,alignItems:'center'}, randomText:{color:'#C77CFF',fontFamily:'Poppins-Medium',fontSize:14},
});
