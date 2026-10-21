import React, {memo, useMemo} from 'react';
import {Avatar, Style} from '@dicebear/core';
import definition from '@dicebear/styles/avataaars.json';
import {SvgXml} from 'react-native-svg';
import {Image} from 'react-native';
import {extendDefinition} from '../avatar/avatarParts';
import {normalizeAvatar, toDiceBearOptions} from '../avatar/avatarConfig';

const avatarStyle = new Style(extendDefinition(definition));
// Crops of the 280x280 avataaars canvas; "face" zooms in so eyes and lips read clearly in small pickers.
const VIEW_BOXES = {face: '62 58 156 156'};

// Accepts either an avatar config (see avatarConfig.js) or the older
// {avatarSeed, background, hair, shirt, gender, glasses, bun} props, spread directly.
function ProfileAvatar({name = 'Milo', photoUrl, focus, ...style}) {
  const config = normalizeAvatar(style, name);
  const key = JSON.stringify(config);
  const xml = useMemo(() => {
    const svg = new Avatar(avatarStyle, toDiceBearOptions(config, 160)).toString();
    return focus && VIEW_BOXES[focus] ? svg.replace('viewBox="0 0 280 280"', `viewBox="${VIEW_BOXES[focus]}"`) : svg;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, focus]);

  if (photoUrl) {
    return <Image source={{uri: photoUrl}} resizeMode="cover" style={styles.photo} />;
  }
  return <SvgXml xml={xml} width="100%" height="100%" />;
}

export default memo(ProfileAvatar);

const styles = {photo: {width: '100%', height: '100%'}};
