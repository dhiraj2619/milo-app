import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export const AVATAR_SIZE = 124;
export const SELF_AVATAR_SIZE = 74;
export const REMOTE_VIDEO_AVATAR_SIZE = 168;
export const formatDuration = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function Control({ icon, label, active, disabled, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!active, disabled: !!disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.controlWrap, pressed && styles.pressed, disabled && styles.controlDisabled]}>
      <View style={[styles.controlButton, active && styles.controlActive]}>{icon}</View>
      <Text numberOfLines={1} style={styles.controlLabel}>{label}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#05001c' },
  background: { ...StyleSheet.absoluteFillObject },
  backgroundGlow: { position: 'absolute', top: '18%', alignSelf: 'center', width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(124,58,237,0.16)' },
  safeArea: { flex: 1, paddingHorizontal: 20 },
  topBar: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(156,130,210,0.22)', borderWidth: 1, borderColor: 'rgba(196,181,253,0.18)', alignItems: 'center', justifyContent: 'center' },
  titleBlock: { alignItems: 'center' },
  roomTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5, paddingHorizontal: 10, height: 22, borderRadius: 11, backgroundColor: 'rgba(196,181,253,0.14)' },
  statusPillLive: { backgroundColor: 'rgba(33,230,161,0.14)' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e879f9' },
  statusDotLive: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#21e6a1' },
  statusPillText: { color: '#ede9fe', fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
  titleSpacer: { width: 38 },
  callArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  oppositeBlock: { alignItems: 'center', width: '100%' },
  ripple: { position: 'absolute', top: -8, width: AVATAR_SIZE + 16, height: AVATAR_SIZE + 16, borderRadius: (AVATAR_SIZE + 16) / 2, borderWidth: 1.5, borderColor: '#a855f7' },
  avatarHalo: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, shadowColor: '#bb43ff', shadowOpacity: 0.8, shadowRadius: 22, elevation: 14 },
  avatarFrame: { flex: 1, borderRadius: AVATAR_SIZE / 2, borderWidth: 3, borderColor: '#a855f7', backgroundColor: '#25104b', overflow: 'hidden' },
  avatarFrameLive: { borderColor: '#c084fc' },
  onlineDot: { position: 'absolute', right: 6, bottom: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: '#21e6a1', borderWidth: 3, borderColor: '#170032' },
  personName: { marginTop: 18, color: '#fff', fontSize: 24, fontWeight: '700', maxWidth: '80%' },
  callingText: { marginTop: 6, color: '#c4b5fd', fontSize: 14 },
  audioStatus: { height: 44, flexDirection: 'row', alignItems: 'center', columnGap: 4, marginTop: 14 },
  bar: { width: 4, borderRadius: 2, backgroundColor: '#ec49dc' },
  connectedText: { color: '#c4b5fd', fontSize: 13, marginTop: 10 },
  connector: { alignItems: 'center', gap: 8, marginVertical: 22 },
  connectorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e879f9' },
  selfBlock: { alignItems: 'center' },
  selfBlockConnected: { marginTop: 44 },
  selfFrame: { width: SELF_AVATAR_SIZE, height: SELF_AVATAR_SIZE, borderRadius: SELF_AVATAR_SIZE / 2, borderWidth: 2, borderColor: 'rgba(196,181,253,0.7)', backgroundColor: '#25104b', overflow: 'hidden' },
  selfMuted: { position: 'absolute', top: SELF_AVATAR_SIZE - 22, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fa2468', borderWidth: 2, borderColor: '#0b0225', alignItems: 'center', justifyContent: 'center' },
  selfName: { color: '#ddd6fe', fontSize: 13, fontWeight: '600', marginTop: 8 },
  searchCard: { alignSelf: 'center', width: '100%', maxWidth: 340, marginBottom: 18, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 18, backgroundColor: 'rgba(18,4,54,0.72)', borderWidth: 1, borderColor: 'rgba(137,77,201,0.32)', alignItems: 'center' },
  searchLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchText: { color: '#ede9fe', fontSize: 13, fontWeight: '500' },
  progressTrack: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 14, backgroundColor: 'rgba(196,181,253,0.18)' },
  progressFill: { width: '100%', height: '100%', borderRadius: 3, backgroundColor: '#b83cff', transformOrigin: 'left' },
  videoStage: { flex: 1, marginTop: 6, marginBottom: 16 },
  remoteVideo: { flex: 1, borderRadius: 28, overflow: 'hidden', backgroundColor: 'rgba(30,10,72,0.78)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.38)', alignItems: 'center', justifyContent: 'center' },
  remoteVideoRing: { width: REMOTE_VIDEO_AVATAR_SIZE + 24, height: REMOTE_VIDEO_AVATAR_SIZE + 24, borderRadius: (REMOTE_VIDEO_AVATAR_SIZE + 24) / 2, backgroundColor: 'rgba(168,85,247,0.16)', alignItems: 'center', justifyContent: 'center' },
  remoteVideoAvatar: { width: REMOTE_VIDEO_AVATAR_SIZE, height: REMOTE_VIDEO_AVATAR_SIZE, borderRadius: REMOTE_VIDEO_AVATAR_SIZE / 2, overflow: 'hidden', borderWidth: 3, borderColor: '#c084fc' },
  remoteVideoFooter: { position: 'absolute', left: 18, bottom: 18, right: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, height: 24, borderRadius: 12, backgroundColor: 'rgba(5,0,28,0.6)' },
  liveBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  remoteVideoName: { color: '#ffffff', fontSize: 20, fontWeight: '700', flexShrink: 1 },
  selfPreview: { position: 'absolute', top: 14, right: 14, width: 96, height: 132, borderRadius: 18, overflow: 'hidden', backgroundColor: '#1b0b3d', borderWidth: 2, borderColor: 'rgba(196,181,253,0.55)', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  selfPreviewAvatar: { flex: 1 },
  mirrored: { transform: [{ scaleX: -1 }] },
  selfPreviewOff: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  selfPreviewOffText: { color: '#c4b5fd', fontSize: 10, fontWeight: '600' },
  selfPreviewMuted: { position: 'absolute', left: 7, bottom: 7, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fa2468', alignItems: 'center', justifyContent: 'center' },
  bottomControls: { alignSelf: 'center', width: '100%', maxWidth: 360, marginBottom: 12, minHeight: 86, borderRadius: 28, paddingHorizontal: 14, backgroundColor: 'rgba(18,4,54,0.92)', borderWidth: 1, borderColor: 'rgba(137,77,201,0.46)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  controlWrap: { width: 58, alignItems: 'center' },
  controlButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(123,92,172,0.25)', borderWidth: 1, borderColor: 'rgba(196,181,253,0.12)', alignItems: 'center', justifyContent: 'center' },
  controlActive: { backgroundColor: 'rgba(161,87,242,0.78)', borderColor: 'rgba(233,213,255,0.5)' },
  controlDisabled: { opacity: 0.4 },
  controlLabel: { color: '#ede9fe', fontSize: 10, fontWeight: '500', marginTop: 6 },
  endButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fa2468', alignItems: 'center', justifyContent: 'center', shadowColor: '#fa2468', shadowOpacity: 0.7, shadowRadius: 14, elevation: 8 },
  pressed: { transform: [{ scale: 0.94 }] },
});
