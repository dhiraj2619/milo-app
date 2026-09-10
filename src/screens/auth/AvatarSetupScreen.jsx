import React, {useState} from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Check, Shuffle} from 'lucide-react-native';
import AppButton from '../../components/ui/AppButton';
import ProfileAvatar from '../../components/home/ProfileAvatar';

const AVATARS = [
  {avatarSeed: 'milo-lavender', background: '#B996FF', hair: '#392323', shirt: '#A45EEB'},
  {avatarSeed: 'milo-sunshine', background: '#FFD67B', hair: '#2E2120', shirt: '#EB766E'},
  {avatarSeed: 'milo-ocean', background: '#82C8FF', hair: '#52352B', shirt: '#5B76C8'},
  {avatarSeed: 'milo-rose', background: '#FF9FC6', hair: '#482721', shirt: '#E85F91'},
  {avatarSeed: 'milo-violet', background: '#9A83F8', hair: '#63362D', shirt: '#A58CF4', bun: true},
  {avatarSeed: 'milo-mint', background: '#8EE0C7', hair: '#312520', shirt: '#5BA982'},
];

export default function AvatarSetupScreen({navigation, route}) {
  const [selected, setSelected] = useState(route.params?.profile?.avatarStyle || AVATARS[0]);
  return <SafeAreaView style={styles.screen}>
    <StatusBar barStyle="light-content" />
    <View style={styles.page}>
      <View style={styles.header}><Pressable onPress={() => navigation.goBack()} style={styles.back}><ArrowLeft size={24} color="#FFF" /></Pressable><View style={styles.progress}>{[0, 1, 2, 3].map(item => <View key={item} style={[styles.segment, item === 0 && styles.active]} />)}</View></View>
      <Text style={styles.heading}>Choose your{`\n`}avatar</Text>
      <Text style={styles.copy}>Pick a character that feels like you.{`\n`}You can upload a profile photo later.</Text>
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>{AVATARS.map(item => <Pressable key={item.avatarSeed} onPress={() => setSelected(item)} style={[styles.option, selected.avatarSeed === item.avatarSeed && styles.selected]}><ProfileAvatar {...item} />{selected.avatarSeed === item.avatarSeed && <View style={styles.check}><Check size={14} color="#FFF" strokeWidth={3} /></View>}</Pressable>)}</ScrollView>
      <Pressable onPress={() => setSelected(AVATARS[Math.floor(Math.random() * AVATARS.length)])} style={styles.random}><Shuffle size={16} color="#CA83FF" /><Text style={styles.randomText}>Try a random avatar</Text></Pressable>
      <AppButton title="Continue" onPress={() => navigation.replace('ProfileSetup', {profile: {...route.params?.profile, avatarStyle: selected}})} style={styles.button} />
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({screen:{flex:1,backgroundColor:'#09080F'},page:{flex:1,paddingHorizontal:24,paddingBottom:20},header:{height:66,flexDirection:'row',alignItems:'center'},back:{width:44,height:44,justifyContent:'center'},progress:{flex:1,flexDirection:'row',gap:8,marginLeft:16},segment:{height:7,flex:1,borderRadius:5,backgroundColor:'#3A304F'},active:{backgroundColor:'#9850FF'},heading:{color:'#F7F5FA',fontFamily:'Poppins-SemiBold',fontSize:28,lineHeight:37,marginTop:26},copy:{color:'#C8C3D0',fontFamily:'Poppins-Regular',fontSize:14,lineHeight:22,marginTop:16},grid:{paddingTop:34,flexDirection:'row',flexWrap:'wrap',gap:16,paddingBottom:18},option:{width:'29%',aspectRatio:1,borderRadius:38,overflow:'hidden',borderWidth:2,borderColor:'#393343'},selected:{borderColor:'#AE67FF'},check:{position:'absolute',right:3,bottom:3,width:25,height:25,borderRadius:13,backgroundColor:'#9855FA',alignItems:'center',justifyContent:'center'},random:{alignSelf:'center',flexDirection:'row',alignItems:'center',gap:8,marginTop:'auto',marginBottom:20},randomText:{color:'#CA83FF',fontFamily:'Poppins-Medium',fontSize:14},button:{marginTop:0}});
