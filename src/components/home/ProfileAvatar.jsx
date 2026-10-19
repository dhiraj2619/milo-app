import React, { useMemo } from 'react';
import { Avatar, Style } from '@dicebear/core';
import definition from '@dicebear/styles/personas.json';
import { SvgXml } from 'react-native-svg';
import { Image } from 'react-native';

const avatarStyle = new Style(definition);
const MALE_HAIR = ['buzzcut', 'fade', 'shortCombover', 'shortComboverChops', 'curlyHighTop', 'sideShave'];
const FEMALE_HAIR = ['bobBangs', 'bobCut', 'long', 'extraLong', 'curly', 'pigtails'];
const BUN_HAIR = ['straightBun', 'curlyBun'];

export default function ProfileAvatar({
  name = 'Milo',
  seed,
  avatarSeed,
  background = '#D1B4FF',
  hair = '#302024',
  shirt = '#A58CF4',
  gender = 'female',
  glasses = false,
  bun = false,
  photoUrl,
}) {
  const xml = useMemo(
    () =>
      new Avatar(avatarStyle, {
        seed: seed || avatarSeed || `milo-${name}`,
        size: 160,
        backgroundColor: [background.replace('#', '')],
        borderRadius: 50,
        hairVariant: bun ? BUN_HAIR : gender === 'male' ? MALE_HAIR : FEMALE_HAIR,
        eyesVariant: glasses ? ['glasses'] : ['happy', 'open'],
        mouthVariant: ['smile', 'bigSmile'],
        facialHairProbability: 0,
        hairColor: [hair.replace('#', '')],
        clothingColor: [shirt.replace('#', '')],
      }).toString(),
    [name, seed, avatarSeed, background, hair, shirt, gender, glasses, bun],
  );

  if (photoUrl) {
    return <Image source={{uri: photoUrl}} resizeMode="cover" style={styles.photo} />;
  }
  return <SvgXml xml={xml} width="100%" height="100%" />;
}

const styles = {photo: {width: '100%', height: '100%'}};
