import React, { useMemo } from 'react';
import { Avatar, Style } from '@dicebear/core';
import definition from '@dicebear/styles/avataaars.json';
import { SvgXml } from 'react-native-svg';
import { Image } from 'react-native';

const avatarStyle = new Style(definition);

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
        topVariant: bun
          ? ['bun']
          : gender === 'male'
          ? ['shortFlat', 'shortRound', 'shortWaved']
          : ['straight01', 'straight02', 'curvy', 'bob'],
        accessoriesVariant: ['round'],
        accessoriesProbability: glasses ? 100 : 0,
        facialHairProbability: 0,
        mouthVariant: ['smile'],
        eyesVariant: ['default', 'happy'],
        hairColor: [hair.replace('#', '')],
        clothesColor: [shirt.replace('#', '')],
      }).toString(),
    [name, seed, avatarSeed, background, hair, shirt, gender, glasses, bun],
  );

  if (photoUrl) {
    return <Image source={{uri: photoUrl}} resizeMode="cover" style={styles.photo} />;
  }
  return <SvgXml xml={xml} width="100%" height="100%" />;
}

const styles = {photo: {width: '100%', height: '100%'}};

