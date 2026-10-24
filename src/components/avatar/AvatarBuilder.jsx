import React, {useState} from 'react';
import {ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Camera, Check, ImagePlus, ScanFace, Shuffle, UserRoundCheck} from 'lucide-react-native';
import ProfileAvatar from '../home/ProfileAvatar';
import {
  BACKGROUNDS, BROWS, EYES, FACIAL_HAIR, GLASSES, HAIR_COLORS, HEADWEAR_COLORS, IRIS_COLORS, LIP_COLORS,
  MOUTHS, OUTFITS, OUTFIT_COLORS, SKIN_TONES, generateAvatar, hairStylesFor,
} from './avatarConfig';
import {detectSkinTone} from './faceTone';
import {pickPhoto} from '../../services/photoPicker';

const TABS = [
  {key: 'skin', label: 'Skin tone'},
  {key: 'hair', label: 'Hair'},
  {key: 'eyes', label: 'Eyes'},
  {key: 'brows', label: 'Brows'},
  {key: 'lips', label: 'Lips'},
  {key: 'beard', label: 'Beard', hideFor: 'female'},
  {key: 'glasses', label: 'Glasses'},
  {key: 'outfit', label: 'Outfit'},
  {key: 'background', label: 'Background'},
];

function Swatches({colors, selected, onSelect}) {
  return <View style={styles.swatches}>{colors.map(item => {
    const color = item.value || item;
    const active = selected?.toLowerCase() === color.toLowerCase();
    return <Pressable key={color} accessibilityRole="button" accessibilityLabel={item.label || color} accessibilityState={{selected: active}} onPress={() => onSelect(color)} style={styles.swatchItem}>
      <View style={[styles.swatchRing, active && styles.swatchRingActive]}><View style={[styles.swatch, {backgroundColor: color}]}>{active && <Check size={14} color={color === '#E6E6E6' || color === '#F5D0B0' ? '#3B2A55' : '#FFF'} strokeWidth={3} />}</View></View>
      {!!item.label && <Text style={[styles.swatchLabel, active && styles.labelActive]}>{item.label}</Text>}
    </Pressable>;
  })}</View>;
}

function Choices({options, field, value, onChange, focus}) {
  return <View style={styles.choices}>{options.map(option => {
    const active = value[field] === option.value;
    return <Pressable key={option.value} accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{selected: active}} onPress={() => onChange({...value, [field]: option.value})} style={styles.choice}>
      <View style={[styles.choiceFrame, active && styles.choiceFrameActive]}><ProfileAvatar {...value} {...{[field]: option.value}} focus={focus} />{active && <View style={styles.choiceCheck}><Check size={11} color="#FFF" strokeWidth={3} /></View>}</View>
      <Text numberOfLines={1} style={[styles.choiceLabel, active && styles.labelActive]}>{option.label}</Text>
    </Pressable>;
  })}</View>;
}

const SubTitle = ({children}) => <Text style={styles.subTitle}>{children}</Text>;

// Lets users build an avatar that resembles them: match skin tone from a selfie,
// then fine-tune hair, eyes, brows, lips, beard, glasses and outfit.
// With onUsePhoto, the same selfie can also become the profile photo (it is only uploaded then).
export default function AvatarBuilder({value, onChange, gender, showPreview = true, onUsePhoto, photoUri}) {
  const [tab, setTab] = useState('skin');
  const [matching, setMatching] = useState(false);
  const [status, setStatus] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const tabs = TABS.filter(item => item.hideFor !== gender);
  const hairStyles = hairStylesFor(gender);
  const headwear = hairStyles.find(item => item.value === value.top)?.headwear;
  const hasLipColor = String(value.mouth).startsWith('lips');
  const hasIrisColor = value.eyes === 'bright' || value.eyes === 'soft';

  const matchFace = async source => {
    setStatus(null);
    const result = await pickPhoto(source, {base64: true});
    if (result.cancelled) return;
    if (result.error) {
      setStatus({error: true, text: result.error, openSettings: result.openSettings});
      return;
    }
    setSelfie(result.asset);
    setMatching(true);
    // Let the spinner render before decoding the image on the JS thread.
    await new Promise(resolve => setTimeout(resolve, 30));
    const tone = result.asset.base64 ? detectSkinTone(result.asset.base64) : null;
    setMatching(false);
    if (!tone) {
      setStatus({error: true, text: 'We couldn’t see your face clearly. Use a well-lit selfie with your face in the centre.'});
      return;
    }
    onChange({...value, skin: tone.value});
    setTab('skin');
    setStatus({error: false, text: `Matched your skin tone: ${tone.label}. Fine-tune anything below.`});
  };

  const panel = () => {
    switch (tab) {
      case 'skin': return <Swatches colors={SKIN_TONES} selected={value.skin} onSelect={skin => onChange({...value, skin})} />;
      case 'hair': return <><Choices options={hairStyles} field="top" value={value} onChange={onChange} />
        <SubTitle>{headwear ? 'Colour' : 'Hair colour'}</SubTitle>
        {headwear ? <Swatches colors={HEADWEAR_COLORS} selected={value.hatColor} onSelect={hatColor => onChange({...value, hatColor})} /> : <Swatches colors={HAIR_COLORS} selected={value.hairColor} onSelect={hairColor => onChange({...value, hairColor})} />}</>;
      case 'eyes': return <><Choices options={EYES} field="eyes" value={value} onChange={onChange} focus="face" />
        {hasIrisColor && <><SubTitle>Eye colour</SubTitle><Swatches colors={IRIS_COLORS} selected={value.iris} onSelect={iris => onChange({...value, iris})} /></>}</>;
      case 'brows': return <Choices options={BROWS} field="brows" value={value} onChange={onChange} focus="face" />;
      case 'lips': return <><Choices options={MOUTHS} field="mouth" value={value} onChange={onChange} focus="face" />
        {hasLipColor && <><SubTitle>Lip colour</SubTitle><Swatches colors={LIP_COLORS} selected={value.lips} onSelect={lips => onChange({...value, lips})} /></>}</>;
      case 'beard': return <Choices options={FACIAL_HAIR} field="facialHair" value={value} onChange={onChange} focus="face" />;
      case 'glasses': return <Choices options={GLASSES} field="glasses" value={value} onChange={onChange} focus="face" />;
      case 'outfit': return <><Choices options={OUTFITS} field="clothes" value={value} onChange={onChange} />
        <SubTitle>Outfit colour</SubTitle><Swatches colors={OUTFIT_COLORS} selected={value.clothesColor} onSelect={clothesColor => onChange({...value, clothesColor})} /></>;
      case 'background': return <Swatches colors={BACKGROUNDS} selected={value.background} onSelect={background => onChange({...value, background})} />;
      default: return null;
    }
  };

  const shuffle = () => {setStatus(null); onChange({...generateAvatar(gender), skin: value.skin});};
  return <View>
    {showPreview ? <View style={styles.previewRow}>
      <View style={styles.preview}><ProfileAvatar {...value} /></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Random avatar" onPress={shuffle} style={styles.shuffle}><Shuffle size={18} color="#E4C4FF" /></Pressable>
    </View> : <Pressable accessibilityRole="button" onPress={shuffle} style={styles.shuffleRow}><Shuffle size={16} color="#C77CFF" /><Text style={styles.shuffleText}>Try a random look</Text></Pressable>}

    <View style={styles.matchCard}>
      <View style={styles.matchHeader}><View style={styles.matchIcon}><ScanFace size={22} color="#E4C4FF" /></View><View style={styles.matchCopy}><Text style={styles.matchTitle}>Match my skin tone</Text><Text style={styles.matchHint}>{onUsePhoto ? 'Take a selfie in good light. It is read on your phone, and only uploaded if you use it as your profile photo.' : 'Take a selfie in good light. It is only read on your phone and is not uploaded.'}</Text></View></View>
      <View style={styles.matchButtons}>
        <Pressable disabled={matching} onPress={() => matchFace('camera')} style={[styles.matchButton, styles.matchPrimary]}><Camera size={17} color="#FFF" /><Text style={styles.matchButtonText}>Take selfie</Text></Pressable>
        <Pressable disabled={matching} onPress={() => matchFace('library')} style={styles.matchButton}><ImagePlus size={17} color="#E4C4FF" /><Text style={styles.matchButtonText}>Choose photo</Text></Pressable>
      </View>
      {matching && <View style={styles.statusRow}><ActivityIndicator size="small" color="#C77CFF" /><Text style={styles.statusText}>Reading your skin tone…</Text></View>}
      {!!status && !matching && <Text style={[styles.statusText, status.error && styles.statusError]}>{status.text}</Text>}
      {!!status?.openSettings && !matching && <Pressable onPress={status.openSettings}><Text style={styles.settingsLink}>Open Settings</Text></Pressable>}
      {!!onUsePhoto && !!selfie && !matching && <View style={styles.selfieRow}>
        <Image source={{uri: selfie.uri}} style={styles.selfieThumb} />
        {photoUri === selfie.uri
          ? <View style={styles.selfieUsed}><UserRoundCheck size={16} color="#A7F3D0" /><Text style={styles.selfieUsedText}>Using this as your profile photo</Text></View>
          : <Pressable accessibilityRole="button" onPress={() => onUsePhoto(selfie)} style={styles.selfieButton}><Text style={styles.matchButtonText}>Use as my profile photo</Text></Pressable>}
      </View>}
    </View>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{tabs.map(item => <Pressable key={item.key} onPress={() => setTab(item.key)} style={[styles.tab, tab === item.key && styles.tabActive]}><Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text></Pressable>)}</ScrollView>
    <View style={styles.panel}>{panel()}</View>
  </View>;
}

const styles = StyleSheet.create({
  previewRow: {alignItems: 'center', marginTop: 4},
  preview: {width: 132, height: 132, borderRadius: 66, overflow: 'hidden', borderWidth: 3, borderColor: '#A95CFF', backgroundColor: '#211933'},
  shuffle: {position: 'absolute', top: 88, left: '50%', marginLeft: 40, width: 40, height: 40, borderRadius: 20, backgroundColor: '#2A1D45', borderWidth: 2, borderColor: '#09080F', alignItems: 'center', justifyContent: 'center'},
  shuffleRow: {flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start'},
  shuffleText: {color: '#C77CFF', fontFamily: 'Poppins-Medium', fontSize: 14},
  matchCard: {marginTop: 18, borderRadius: 18, borderWidth: 1, borderColor: '#3D2C5C', backgroundColor: '#17122A', padding: 14},
  matchHeader: {flexDirection: 'row', alignItems: 'center', gap: 12},
  matchIcon: {width: 42, height: 42, borderRadius: 13, backgroundColor: '#2A1D45', alignItems: 'center', justifyContent: 'center'},
  matchCopy: {flex: 1},
  matchTitle: {color: '#F7F2FD', fontFamily: 'Poppins-SemiBold', fontSize: 15},
  matchHint: {color: '#B9B1C5', fontFamily: 'Poppins-Regular', fontSize: 11.5, lineHeight: 16, marginTop: 2},
  matchButtons: {flexDirection: 'row', gap: 10, marginTop: 12},
  matchButton: {flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#5B3F8C', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  matchPrimary: {backgroundColor: '#8B40EE', borderColor: '#8B40EE'},
  matchButtonText: {color: '#FFF', fontFamily: 'Poppins-Medium', fontSize: 13},
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10},
  statusText: {color: '#A7F3D0', fontFamily: 'Poppins-Regular', fontSize: 12, lineHeight: 17, marginTop: 10},
  statusError: {color: '#FF9AAF'},
  settingsLink: {color: '#D9B3FF', fontFamily: 'Poppins-Medium', fontSize: 12.5, marginTop: 6, textDecorationLine: 'underline'},
  selfieRow: {flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2E2348'},
  selfieThumb: {width: 46, height: 46, borderRadius: 23, backgroundColor: '#211933'},
  selfieButton: {flex: 1, minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: '#8B40EE', alignItems: 'center', justifyContent: 'center'},
  selfieUsed: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8},
  selfieUsedText: {color: '#A7F3D0', fontFamily: 'Poppins-Medium', fontSize: 12.5},
  tabs: {gap: 8, paddingTop: 18, paddingBottom: 4},
  tab: {paddingHorizontal: 14, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#38323F', backgroundColor: '#191820', justifyContent: 'center'},
  tabActive: {borderColor: '#9957FF', backgroundColor: '#2A1A4A'},
  tabText: {color: '#C8C3D0', fontFamily: 'Poppins-Medium', fontSize: 13},
  tabTextActive: {color: '#FFF'},
  panel: {paddingTop: 14},
  subTitle: {color: '#E9E3F5', fontFamily: 'Poppins-Medium', fontSize: 13, marginTop: 16, marginBottom: 10},
  choices: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  choice: {width: '22.5%', alignItems: 'center'},
  choiceFrame: {width: '100%', aspectRatio: 1, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: '#393343'},
  choiceFrameActive: {borderColor: '#AE67FF'},
  choiceCheck: {position: 'absolute', right: 3, bottom: 3, width: 19, height: 19, borderRadius: 10, backgroundColor: '#9855FA', alignItems: 'center', justifyContent: 'center'},
  choiceLabel: {color: '#B9B1C5', fontFamily: 'Poppins-Regular', fontSize: 10.5, marginTop: 4},
  labelActive: {color: '#F2E5FF'},
  swatches: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  swatchItem: {alignItems: 'center', minWidth: 46},
  swatchRing: {width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center'},
  swatchRingActive: {borderColor: '#AE67FF'},
  swatch: {width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF22'},
  swatchLabel: {color: '#B9B1C5', fontFamily: 'Poppins-Regular', fontSize: 10.5, marginTop: 3},
});
