import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Headphones, Mic, MoreHorizontal, PhoneOff, Volume2} from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';

export default function AudioRoomScreen({navigation, route}) {
  const first = route.params?.person || {};
  const candidates = useMemo(() => (route.params?.availablePeople || []).filter(p => p._id !== first._id), [first._id, route.params?.availablePeople]);
  const [person, setPerson] = useState(first);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const ripple = useRef(new Animated.Value(0)).current;
  const bars = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const r = Animated.loop(Animated.timing(ripple, {toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true}));
    const b = Animated.loop(Animated.sequence([Animated.timing(bars,{toValue:1,duration:420,useNativeDriver:true}),Animated.timing(bars,{toValue:0,duration:420,useNativeDriver:true})]));
    r.start(); b.start(); return () => {r.stop(); b.stop();};
  }, [bars, ripple]);
  useEffect(() => {
    if (!candidates.length) { const t=setTimeout(()=>setConnected(true),1800); return ()=>clearTimeout(t); }
    const busyTimer=setTimeout(()=>setBusy(true),3500);
    const swapTimer=setTimeout(()=>{ const next=candidates[Math.floor(Math.random()*candidates.length)]; setPerson(next); setBusy(false); setConnected(true); },5600);
    return ()=>{clearTimeout(busyTimer);clearTimeout(swapTimer);};
  }, [candidates]);

  const name=person.nickname || 'MILO member';
  const ringStyle=i=>({opacity:ripple.interpolate({inputRange:[0,1],outputRange:[.34,0]}),transform:[{scale:ripple.interpolate({inputRange:[0,1],outputRange:[1+i*.18,1.65+i*.18]})}]});
  return <SafeAreaView style={s.screen}><StatusBar barStyle="light-content" backgroundColor="#050014" />
    <View style={s.orbTop}/><View style={s.orbRight}/><View style={s.orbBottom}/>
    <View style={s.header}><Pressable onPress={()=>navigation.goBack()} style={s.circleBtn}><ArrowLeft size={18} color="#D8D2EF"/></Pressable><Pressable onPress={()=>navigation.goBack()} style={[s.circleBtn,s.endSmall]}><PhoneOff size={17} color="#FF5D91"/></Pressable></View>
    <View style={s.remoteWrap}><View style={s.rings}>{[0,1,2].map(i=><Animated.View key={i} style={[s.ring,ringStyle(i)]}/>)}</View><View style={s.remoteFrame}><View style={s.remoteAvatar}><ProfileAvatar {...(person.avatarStyle||person)} name={name} photoUrl={person.photoUrl}/></View><View style={s.online}/></View><Text style={s.name}>{name}</Text><View style={s.equalizer}>{[8,16,11,22,13,18,8].map((h,i)=><Animated.View key={i} style={[s.bar,{height:bars.interpolate({inputRange:[0,1],outputRange:[h,h+10+(i%3)*5]})}]}/>)}</View>{busy&&<View style={s.busy}><Headphones size={12} color="#D9C9F5"/><Text style={s.busyText}>{first.nickname || 'They'} just got busy</Text></View>}<Text style={s.sub}>{connected?'Connected':'Calling...'}</Text></View>
    <View style={s.you}><View style={s.youAvatar}><ProfileAvatar name="You"/></View><Text style={s.youText}>You</Text></View>
    <View style={s.controls}><Control icon={<Mic size={20} color="#EEE9FA"/>} label="Mic" active={muted} onPress={()=>setMuted(!muted)}/><Control icon={<Volume2 size={20} color="#EEE9FA"/>} label="Speaker" active={speaker} onPress={()=>setSpeaker(!speaker)}/><Pressable onPress={()=>navigation.goBack()} style={s.hang}><PhoneOff size={27} color="#fff" fill="#fff"/></Pressable><Control icon={<MoreHorizontal size={21} color="#EEE9FA"/>} label="More"/></View>
  </SafeAreaView>;
}
function Control({icon,label,onPress,active}) {return <Pressable onPress={onPress} style={[s.control,active&&s.controlActive]}>{icon}<Text style={s.controlLabel}>{label}</Text></Pressable>;}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#060016',overflow:'hidden'},orbTop:{position:'absolute',left:-100,top:-130,width:210,height:210,borderRadius:105,backgroundColor:'#200049'},orbRight:{position:'absolute',right:-145,top:90,width:220,height:300,borderRadius:160,backgroundColor:'#21005A'},orbBottom:{position:'absolute',left:-85,bottom:-80,width:255,height:380,borderRadius:160,backgroundColor:'#2B006B'},header:{height:65,paddingHorizontal:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},circleBtn:{width:29,height:29,borderRadius:15,backgroundColor:'rgba(80,59,116,.46)',borderWidth:1,borderColor:'#483466',alignItems:'center',justifyContent:'center'},endSmall:{backgroundColor:'rgba(89,12,50,.58)',borderColor:'#8B2354'},remoteWrap:{alignItems:'center',marginTop:14,height:285},rings:{position:'absolute',top:-30,width:270,height:270,alignItems:'center',justifyContent:'center'},ring:{position:'absolute',width:115,height:115,borderRadius:60,borderWidth:1,borderColor:'rgba(164,72,255,.38)'},remoteFrame:{width:112,height:112,borderRadius:56,padding:4,backgroundColor:'#7C2CDE',shadowColor:'#A44EFF',shadowOpacity:.8,shadowRadius:24,elevation:12},remoteAvatar:{flex:1,borderRadius:52,overflow:'hidden',borderWidth:2,borderColor:'#F1D4FF'},online:{position:'absolute',right:1,bottom:5,width:15,height:15,borderRadius:8,borderWidth:2,borderColor:'#180040',backgroundColor:'#20E891'},name:{color:'#fff',fontFamily:'Poppins-SemiBold',fontSize:18,marginTop:10},equalizer:{height:26,flexDirection:'row',alignItems:'center',gap:3,marginTop:6},bar:{width:3,borderRadius:2,backgroundColor:'#F165E9'},busy:{flexDirection:'row',gap:6,alignItems:'center',paddingHorizontal:13,height:28,borderRadius:15,backgroundColor:'#23123F',marginTop:6},busyText:{color:'#D9C9F5',fontFamily:'Poppins-Medium',fontSize:9},sub:{color:'#968CAF',fontFamily:'Poppins-Regular',fontSize:10},you:{alignItems:'center',marginTop:10},youAvatar:{width:58,height:58,borderRadius:29,padding:2,borderWidth:1.5,borderColor:'#B77AFF',overflow:'hidden'},youText:{color:'#fff',fontFamily:'Poppins-Medium',fontSize:10,marginTop:4},controls:{position:'absolute',bottom:13,left:9,right:9,height:70,borderRadius:15,backgroundColor:'rgba(19,14,48,.96)',borderWidth:1,borderColor:'#312750',flexDirection:'row',alignItems:'center',justifyContent:'space-around'},control:{width:48,alignItems:'center',gap:4,paddingVertical:6,borderRadius:18},controlActive:{backgroundColor:'#332153'},controlLabel:{color:'#E5DFF0',fontFamily:'Poppins-Regular',fontSize:8},hang:{width:52,height:52,borderRadius:26,backgroundColor:'#F52362',alignItems:'center',justifyContent:'center'}});