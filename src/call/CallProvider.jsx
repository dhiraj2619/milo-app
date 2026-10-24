import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import InCallManager from 'react-native-incall-manager';
import { RTCIceCandidate, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import { disconnectSocket, getSocket } from '../services/socketService';
import { navigateToMain } from '../navigation/navigationRef';
import { getLocalStream, requestCallPermissions, stopStream } from './media';
import { registerForPush } from '../services/pushService';

// Call lifecycle:
//   outgoing: idle -> starting -> ringing -> connecting -> connected -> ended
//   incoming: idle -> incoming -> connecting -> connected -> ended
// The caller sends the WebRTC offer once the callee accepts; the callee answers.

const ACK_TIMEOUT_MS = 10000;
const ENDED_RESET_MS = 2000;
const IDLE_CALL = {
  status: 'idle',
  direction: null,
  callId: null,
  callType: null,
  peer: null,
  // 'ringing' once the callee's phone shows the call, 'calling' while they only have a push notification.
  delivery: null,
  endReason: null,
  connectedAt: null,
  remoteMedia: { muted: false, cameraOff: false },
};
const DEFAULT_CONTROLS = { muted: false, cameraOff: false, speaker: false };

const CallContext = createContext(null);
export const useCall = () => useContext(CallContext);

export default function CallProvider({ enabled, onIncomingCall, children }) {
  const [call, setCall] = useState(IDLE_CALL);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [controls, setControls] = useState(DEFAULT_CONTROLS);
  const callRef = useRef(IDLE_CALL);
  const controlsRef = useRef(DEFAULT_CONTROLS);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceServersRef = useRef([]);
  const pendingCandidatesRef = useRef([]);
  const resetTimerRef = useRef(null);

  const updateCall = useCallback(patch => {
    callRef.current = { ...callRef.current, ...patch };
    setCall(callRef.current);
  }, []);

  const updateControls = useCallback(patch => {
    controlsRef.current = { ...controlsRef.current, ...patch };
    setControls(controlsRef.current);
  }, []);

  const isBusy = () => !['idle', 'ended'].includes(callRef.current.status);

  const emitSignal = useCallback(payload => {
    const { callId } = callRef.current;
    if (callId) getSocket().emit('call:signal', { callId, ...payload });
  }, []);

  // Tears down media and marks the call ended; the UI shows the reason briefly, then resets.
  const finish = useCallback(reason => {
    if (callRef.current.status === 'ended' || callRef.current.status === 'idle') return;
    pcRef.current?.close();
    pcRef.current = null;
    stopStream(localStreamRef.current);
    localStreamRef.current = null;
    pendingCandidatesRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    InCallManager.stopRingtone();
    InCallManager.stopRingback();
    InCallManager.stop();
    updateCall({ status: 'ended', endReason: reason });
    clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      if (callRef.current.status === 'ended') updateCall(IDLE_CALL);
    }, ENDED_RESET_MS);
  }, [updateCall]);

  const prepareLocalMedia = useCallback(async (callType, { ringback = false } = {}) => {
    if (!(await requestCallPermissions(callType))) throw Object.assign(new Error('permission'), { reason: 'permission_denied' });
    const stream = await getLocalStream(callType);
    // The call may have been hung up while the permission dialog was open.
    if (callRef.current.status === 'ended' || callRef.current.status === 'idle') {
      stopStream(stream);
      return null;
    }
    localStreamRef.current = stream;
    setLocalStream(stream);
    InCallManager.start(ringback ? { media: callType, ringback: '_DTMF_' } : { media: callType });
    InCallManager.setForceSpeakerphoneOn(callType === 'video');
    return stream;
  }, []);

  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    pcRef.current = pc;
    pc.addEventListener('icecandidate', event => {
      if (!event.candidate) return;
      const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
      emitSignal({ candidate: { candidate, sdpMid, sdpMLineIndex } });
    });
    pc.addEventListener('track', event => {
      const [stream] = event.streams || [];
      if (stream) setRemoteStream(stream);
    });
    pc.addEventListener('iceconnectionstatechange', () => {
      if (pcRef.current !== pc) return;
      const state = pc.iceConnectionState;
      if ((state === 'connected' || state === 'completed') && callRef.current.status !== 'connected') {
        updateCall({ status: 'connected', connectedAt: Date.now() });
        // Share our starting mute/camera state with the other side.
        const { muted, cameraOff } = controlsRef.current;
        emitSignal({ media: { muted, cameraOff } });
      } else if (state === 'failed') {
        getSocket().emit('call:end', { callId: callRef.current.callId });
        finish('failed');
      }
    });
    localStreamRef.current?.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    return pc;
  }, [emitSignal, finish, updateCall]);

  const flushCandidates = async pc => {
    const queued = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const candidate of queued) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => { });
  };

  const startCall = useCallback(async (person, callType) => {
    if (isBusy() || !person?._id) return;
    clearTimeout(resetTimerRef.current);
    updateCall({ ...IDLE_CALL, status: 'starting', direction: 'outgoing', callType, peer: person });
    updateControls({ ...DEFAULT_CONTROLS, speaker: callType === 'video' });
    try {
      if (!(await prepareLocalMedia(callType, { ringback: true }))) return;
    } catch (error) {
      finish(error.reason || 'media_error');
      return;
    }
    getSocket().timeout(ACK_TIMEOUT_MS).emit('call:invite', { calleeId: person._id, callType }, (error, ack) => {
      if (callRef.current.status === 'ended') {
        // Hung up before the server answered; cancel the call it created.
        if (ack?.callId) getSocket().emit('call:end', { callId: ack.callId });
        return;
      }
      if (error) return finish('network');
      if (!ack?.ok) return finish(ack?.reason || 'error');
      iceServersRef.current = ack.iceServers || [];
      updateCall({ status: 'ringing', callId: ack.callId, delivery: ack.delivery || 'ringing', peer: { ...person, ...ack.callee } });
    });
  }, [finish, prepareLocalMedia, updateCall, updateControls]);

  const acceptCall = useCallback(async () => {
    if (callRef.current.status !== 'incoming') return;
    const { callId, callType } = callRef.current;
    InCallManager.stopRingtone();
    updateCall({ status: 'connecting' });
    updateControls({ ...DEFAULT_CONTROLS, speaker: callType === 'video' });
    try {
      if (!(await prepareLocalMedia(callType))) return;
    } catch (error) {
      getSocket().emit('call:reject', { callId });
      finish(error.reason || 'media_error');
      return;
    }
    createPeer();
    getSocket().timeout(ACK_TIMEOUT_MS).emit('call:accept', { callId }, (error, ack) => {
      if (error) finish('network');
      else if (!ack?.ok) finish(ack?.reason || 'error');
    });
  }, [createPeer, finish, prepareLocalMedia, updateCall, updateControls]);

  const rejectCall = useCallback(() => {
    if (callRef.current.status !== 'incoming') return;
    getSocket().emit('call:reject', { callId: callRef.current.callId });
    finish('declined');
  }, [finish]);

  const endCall = useCallback(() => {
    if (!isBusy()) return;
    if (callRef.current.callId) getSocket().emit('call:end', { callId: callRef.current.callId });
    finish('ended');
  }, [finish]);

  const setTrackEnabled = (kind, isEnabled) => {
    localStreamRef.current?.getTracks().forEach(track => {
      if (track.kind === kind) track.enabled = isEnabled;
    });
  };

  const toggleMute = useCallback(() => {
    const muted = !controlsRef.current.muted;
    setTrackEnabled('audio', !muted);
    updateControls({ muted });
    emitSignal({ media: { muted, cameraOff: controlsRef.current.cameraOff } });
  }, [emitSignal, updateControls]);

  const toggleCamera = useCallback(() => {
    const cameraOff = !controlsRef.current.cameraOff;
    setTrackEnabled('video', !cameraOff);
    updateControls({ cameraOff });
    emitSignal({ media: { muted: controlsRef.current.muted, cameraOff } });
  }, [emitSignal, updateControls]);

  const switchCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(track => track._switchCamera?.());
  }, []);

  const toggleSpeaker = useCallback(() => {
    const speaker = !controlsRef.current.speaker;
    InCallManager.setForceSpeakerphoneOn(speaker);
    updateControls({ speaker });
  }, [updateControls]);

  // Socket handlers read the latest callbacks through this ref.
  const handlersRef = useRef({});
  handlersRef.current = {
    incoming: ({ callId, callType, caller, iceServers }) => {
      if (isBusy()) return; // The server already blocks this; guards multi-device races.
      clearTimeout(resetTimerRef.current);
      iceServersRef.current = iceServers || [];
      updateCall({ ...IDLE_CALL, status: 'incoming', direction: 'incoming', callId, callType, peer: caller });
      InCallManager.startRingtone('_DEFAULT_');
      onIncomingCall?.();
      navigateToMain('IncomingCall');
    },
    accepted: async ({ callId }) => {
      if (callId !== callRef.current.callId || callRef.current.direction !== 'outgoing') return;
      InCallManager.stopRingback();
      updateCall({ status: 'connecting' });
      const pc = createPeer();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      emitSignal({ description: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
    },
    signal: async ({ callId, description, candidate, media }) => {
      const pc = pcRef.current;
      if (callId !== callRef.current.callId) return;
      if (media) updateCall({ remoteMedia: { muted: !!media.muted, cameraOff: !!media.cameraOff } });
      if (!pc) return;
      try {
        if (description) {
          await pc.setRemoteDescription(new RTCSessionDescription(description));
          await flushCandidates(pc);
          if (description.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            emitSignal({ description: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
          }
        }
        if (candidate) {
          if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(candidate));
          else pendingCandidatesRef.current.push(candidate);
        }
      } catch (error) {
        console.warn('Call signaling failed:', error?.message || error);
      }
    },
    // The callee opened the app from the notification, so their phone is now ringing.
    ringing: ({ callId }) => {
      if (callId === callRef.current.callId && callRef.current.status === 'ringing') updateCall({ delivery: 'ringing' });
    },
    ended: ({ callId, reason }) => {
      if (callId === callRef.current.callId) finish(reason);
    },
  };

  useEffect(() => {
    if (!enabled) return undefined;
    const socket = getSocket();
    const events = {
      'call:incoming': payload => handlersRef.current.incoming(payload),
      'call:accepted': payload => handlersRef.current.accepted(payload).catch(() => finish('failed')),
      'call:signal': payload => handlersRef.current.signal(payload),
      'call:ringing': payload => handlersRef.current.ringing(payload),
      'call:ended': payload => handlersRef.current.ended(payload),
    };
    Object.entries(events).forEach(([event, handler]) => socket.on(event, handler));
    const stopPush = registerForPush();
    return () => {
      stopPush();
      Object.entries(events).forEach(([event, handler]) => socket.off(event, handler));
      // Signed out: hang up and close the shared connection.
      finish('ended');
      disconnectSocket();
    };
  }, [enabled, finish]);

  useEffect(() => () => clearTimeout(resetTimerRef.current), []);

  const value = useMemo(() => ({
    call,
    controls,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera,
    toggleSpeaker,
  }), [acceptCall, call, controls, endCall, localStream, rejectCall, remoteStream, startCall, switchCamera, toggleCamera, toggleMute, toggleSpeaker]);

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}
