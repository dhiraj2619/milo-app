import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Modal, Pressable, ScrollView, Share, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Camera, Gift, ImagePlus, LogOut, Pencil, Share2, Trash2} from 'lucide-react-native';
import AppButton from '../../components/ui/AppButton';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import AvatarBuilder from '../../components/avatar/AvatarBuilder';
import {normalizeAvatar, toStoredAvatar} from '../../components/avatar/avatarConfig';
import {getMyProfile, removeProfilePhoto, updateMyProfile, uploadProfilePhoto} from '../../services/userService';
import {pickPhoto} from '../../services/photoPicker';
import {useToast} from '../../components/ui/ToastProvider';
import {logout} from '../../services/authService';

// route.params.section === 'avatar' scrolls straight to the avatar editor (the pencil on Home).
export default function ProfileScreen({navigation, route}) {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localPhoto, setLocalPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const scrollRef = useRef(null);
  const scrolledToAvatar = useRef(false);

  const load = useCallback(async () => {
    try { setProfile(await getMyProfile()); }
    catch (error) { toast(error.response?.data?.message || 'Unable to load your profile.'); }
    finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  // Shows the new photo straight away; if the upload fails the old one comes back.
  const savePhoto = async asset => {
    if (uploading) { return; }
    setLocalPhoto(asset.uri);
    setUploading(true);
    try { setProfile(await uploadProfilePhoto(asset)); toast('Profile photo updated'); }
    catch (error) { toast(error.response?.data?.message || error.message || 'Could not upload your photo. Please try again.'); }
    finally { setLocalPhoto(null); setUploading(false); }
  };
  const choosePhoto = async source => {
    setPhotoSheet(false);
    const result = await pickPhoto(source);
    if (result.asset) { savePhoto(result.asset); return; }
    if (result.error) {
      Alert.alert('Photo unavailable', result.error, result.openSettings ? [{text: 'Cancel', style: 'cancel'}, {text: 'Open Settings', onPress: result.openSettings}] : undefined);
    }
  };
  const removePhoto = async () => {
    setPhotoSheet(false);
    setUploading(true);
    try { setProfile(await removeProfilePhoto()); toast('Photo removed. Your avatar is shown now.'); }
    catch (error) { toast(error.response?.data?.message || 'Could not remove your photo. Please try again.'); }
    finally { setUploading(false); }
  };

  const saveAvatar = async () => {
    if (!draft) { return; }
    setSaving(true);
    try { setProfile(await updateMyProfile({avatarSeed: draft.seed, avatarStyle: toStoredAvatar({...draft, gender: profile?.gender || draft.gender})})); setDraft(null); toast('Avatar updated'); }
    catch (error) { Alert.alert('Could not save avatar', error.response?.data?.message || 'Please try again.'); }
    finally { setSaving(false); }
  };

  const handleLogout = () => {
    if (loggingOut) { return; }
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', style: 'destructive', onPress: async () => {
        setLoggingOut(true);
        try { await logout(); }
        catch (error) { setLoggingOut(false); Alert.alert('Logout failed', error.message || 'Please try again.'); }
      }},
    ]);
  };
  const shareReferral = async () => {
    if (!profile?.referralCode) { return; }
    try {
      await Share.share({message: `Join me on MILO! Use my referral code ${profile.referralCode} when you register. You get 100 bonus coins and I get 200 coins.`});
    } catch (_) {}
  };

  const hasPhoto = Boolean(localPhoto || profile?.photoUrl);
  const avatar = draft || normalizeAvatar(profile?.avatarStyle || {avatarSeed: profile?.avatarSeed || 'milo-user', gender: profile?.gender}, profile?.nickname);
  return <SafeAreaView style={styles.screen}>
    <StatusBar barStyle="light-content" />
    <View style={styles.header}><Pressable onPress={() => navigation.goBack()} style={styles.back}><ArrowLeft color="#FFF" /></Pressable><Text style={styles.title}>My Profile</Text><View style={styles.back} /></View>
    <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View>
        <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" disabled={uploading || loading} onPress={() => setPhotoSheet(true)} style={styles.photoWrap}>
          <ProfileAvatar {...avatar} photoUrl={localPhoto || profile?.photoUrl} />
          {uploading && <View style={styles.photoBusy}><ActivityIndicator color="#FFF" /></View>}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" disabled={uploading || loading} onPress={() => setPhotoSheet(true)} style={styles.camera}><Camera size={18} color="#FFF" /></Pressable>
      </View>
      <Text style={styles.name}>{profile?.nickname || (loading ? 'Loading…' : 'MILO user')}</Text>
      <Text style={styles.phone}>{profile?.phone || ''}</Text>
      <View style={styles.coinCard}><Gift size={22} color="#FFD84E" /><View style={styles.coinCopy}><Text style={styles.coinLabel}>MILO coins</Text><Text style={styles.coinBalance}>{profile?.coinBalance ?? 0}</Text></View></View>
      {!!profile?.referralCode && <Pressable onPress={shareReferral} style={styles.referralCard}><View><Text style={styles.referralLabel}>Invite friends · earn 200 coins</Text><Text style={styles.referralCode}>{profile.referralCode}</Text><Text style={styles.referralHint}>Your friend receives 100 bonus coins.</Text></View><Share2 size={21} color="#FFFFFF" /></Pressable>}
      <Text style={styles.sectionTitle} onLayout={event => {
        if (route?.params?.section !== 'avatar' || scrolledToAvatar.current || loading) { return; }
        scrolledToAvatar.current = true;
        scrollRef.current?.scrollTo({y: Math.max(event.nativeEvent.layout.y - 12, 0), animated: true});
      }}>Your avatar</Text>
      <Text style={styles.copy}>{hasPhoto ? 'Your photo is shown instead of your avatar. Remove the photo to show the avatar again.' : 'Make it look like you: match your skin tone with a selfie, then style your hair, eyes and lips.'}</Text>
      <View style={styles.builder}>{!loading && <AvatarBuilder gender={profile?.gender} value={avatar} onChange={setDraft} showPreview={hasPhoto} onUsePhoto={savePhoto} photoUri={localPhoto || undefined} />}</View>
      <AppButton title="Save avatar" onPress={saveAvatar} loading={saving} disabled={!draft || saving} style={styles.button} />
      <View style={styles.info}><View><Text style={styles.infoLabel}>Gender</Text><Text style={styles.infoValue}>{profile?.gender || '—'}</Text></View><View><Text style={styles.infoLabel}>Languages</Text><Text style={styles.infoValue}>{profile?.languages?.join(', ') || '—'}</Text></View><Pencil size={17} color="#B275FF" /></View>
      <Pressable disabled={loggingOut} onPress={handleLogout} style={[styles.logoutButton, loggingOut && styles.disabled]}><LogOut size={18} color="#FF7894" /><Text style={styles.logoutText}>{loggingOut ? 'Logging out...' : 'Logout'}</Text></Pressable>
    </ScrollView>
    <Modal visible={photoSheet} transparent animationType="slide" onRequestClose={() => setPhotoSheet(false)}>
      <Pressable style={styles.sheetBackdrop} onPress={() => setPhotoSheet(false)}>
        <Pressable style={styles.sheet}>
          <Text style={styles.sheetTitle}>Profile photo</Text>
          <Pressable onPress={() => choosePhoto('camera')} style={styles.sheetRow}><Camera size={20} color="#E4C4FF" /><Text style={styles.sheetText}>Take a selfie</Text></Pressable>
          <Pressable onPress={() => choosePhoto('library')} style={styles.sheetRow}><ImagePlus size={20} color="#E4C4FF" /><Text style={styles.sheetText}>Choose from photos</Text></Pressable>
          {!!profile?.photoUrl && <Pressable onPress={removePhoto} style={styles.sheetRow}><Trash2 size={20} color="#FF7894" /><Text style={[styles.sheetText, styles.sheetDanger]}>Remove photo, use my avatar</Text></Pressable>}
          <Pressable onPress={() => setPhotoSheet(false)} style={styles.sheetCancel}><Text style={styles.sheetText}>Cancel</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#09080F'}, header:{height:58,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, back:{width:40,height:40,alignItems:'center',justifyContent:'center'}, title:{color:'#FFF',fontFamily:'Poppins-SemiBold',fontSize:19}, content:{padding:24,paddingTop:14,paddingBottom:40,alignItems:'center'}, photoWrap:{width:142,height:142,borderRadius:71,overflow:'hidden',borderWidth:3,borderColor:'#A95CFF',backgroundColor:'#211933'}, photoBusy:{...StyleSheet.absoluteFillObject,backgroundColor:'#0009',alignItems:'center',justifyContent:'center'}, sheetBackdrop:{flex:1,backgroundColor:'#000A',justifyContent:'flex-end'}, sheet:{backgroundColor:'#17141F',borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,paddingBottom:30,gap:6}, sheetTitle:{color:'#FFF',fontFamily:'Poppins-SemiBold',fontSize:17,marginBottom:8}, sheetRow:{minHeight:52,flexDirection:'row',alignItems:'center',gap:14,paddingHorizontal:6}, sheetText:{color:'#F2EAFE',fontFamily:'Poppins-Medium',fontSize:15}, sheetDanger:{color:'#FF7894'}, sheetCancel:{minHeight:50,marginTop:8,borderRadius:14,backgroundColor:'#231E2D',alignItems:'center',justifyContent:'center'}, camera:{position:'absolute',right:3,bottom:3,width:39,height:39,borderRadius:20,backgroundColor:'#8B40EE',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#09080F'}, name:{color:'#FFF',fontFamily:'Poppins-SemiBold',fontSize:25,marginTop:17}, phone:{color:'#BDB5CB',fontSize:13,marginTop:3}, coinCard:{alignSelf:'stretch',marginTop:22,borderRadius:16,borderWidth:1,borderColor:'#76562A',backgroundColor:'#281F14',padding:15,flexDirection:'row',alignItems:'center',gap:11},coinCopy:{flex:1},coinLabel:{color:'#D8C7A4',fontSize:12},coinBalance:{color:'#FFE160',fontFamily:'Poppins-SemiBold',fontSize:23,marginTop:1},referralCard:{alignSelf:'stretch',marginTop:12,borderRadius:16,backgroundColor:'#7130D0',padding:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},referralLabel:{color:'#F2E5FF',fontFamily:'Poppins-Medium',fontSize:13},referralCode:{color:'#FFFFFF',fontFamily:'Poppins-SemiBold',fontSize:20,letterSpacing:1,marginTop:4},referralHint:{color:'#E2CBFF',fontSize:10,marginTop:3}, sectionTitle:{alignSelf:'stretch',color:'#F7F2FD',fontFamily:'Poppins-SemiBold',fontSize:20,marginTop:38}, copy:{alignSelf:'stretch',color:'#B9B1C5',fontSize:13,lineHeight:20,marginTop:5}, builder:{alignSelf:'stretch',marginTop:18}, avatarOption:{width:'29%',aspectRatio:1,borderRadius:35,overflow:'hidden',borderWidth:2,borderColor:'#373040'}, selected:{borderColor:'#B66BFF'}, check:{position:'absolute',right:2,bottom:2,width:23,height:23,borderRadius:12,backgroundColor:'#9350F5',alignItems:'center',justifyContent:'center'}, button:{marginTop:26}, info:{alignSelf:'stretch',marginTop:30,backgroundColor:'#17141F',borderColor:'#342E3F',borderWidth:1,borderRadius:18,padding:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, infoLabel:{color:'#AFA6BF',fontSize:11}, infoValue:{color:'#FFF',fontSize:14,textTransform:'capitalize',marginTop:4,maxWidth:210}, random:{marginTop:24,flexDirection:'row',gap:8,alignItems:'center'}, randomText:{color:'#C77CFF',fontFamily:'Poppins-Medium',fontSize:14},
  logoutButton:{height:54,alignSelf:'stretch',marginTop:38,marginBottom:18,borderRadius:16,borderWidth:1,borderColor:'#633047',backgroundColor:'#281522',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9}, logoutText:{color:'#FF7894',fontFamily:'Poppins-Medium',fontSize:15}, disabled:{opacity:0.55},
});
