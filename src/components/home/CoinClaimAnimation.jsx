import React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Coin } from './HomeDecor';

const COIN_SIZE = 28;
const COIN_COUNT = 8;
const FLIGHT_DURATION = 820;
const STAGGER = 75;
const SAMPLES = 16;
const SAMPLE_STEPS = Array.from({ length: SAMPLES + 1 }, (_, index) => index / SAMPLES);

// Quadratic bezier from the claim button to the header coin. Each coin gets its own
// control point so the coins fan out on launch and converge on the target.
function buildFlightPath(from, to, index) {
  const spread = COIN_COUNT > 1 ? index / (COIN_COUNT - 1) - 0.5 : 0;
  const start = { x: from.x + spread * 36, y: from.y };
  const control = { x: from.x + spread * 260, y: to.y + (from.y - to.y) * 0.3 };
  const point = t => {
    const inverse = 1 - t;
    return {
      x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * to.x,
      y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * to.y,
    };
  };
  const points = SAMPLE_STEPS.map(point);
  return {
    translateX: points.map(({ x }) => x - from.x),
    translateY: points.map(({ y }) => y - from.y),
  };
}

export function CoinFlight({ from, to, onDone }) {
  const progress = React.useRef(Array.from({ length: COIN_COUNT }, () => new Animated.Value(0))).current;
  const paths = React.useMemo(() => progress.map((_, index) => buildFlightPath(from, to, index)), [from, to, progress]);
  const onDoneRef = React.useRef(onDone);
  onDoneRef.current = onDone;
  React.useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onDoneRef.current?.();
    };
    progress.forEach(value => value.setValue(0));
    const flight = Animated.stagger(STAGGER, progress.map(value => Animated.timing(value, {
      toValue: 1,
      duration: FLIGHT_DURATION,
      easing: Easing.bezier(0.45, 0, 0.25, 1),
      useNativeDriver: true,
    })));
    flight.start(finish);
    return () => { flight.stop(); finish(); };
  }, [progress]);
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {progress.map((value, index) => <Animated.View
      key={index}
      style={[styles.coin, {
        left: from.x - COIN_SIZE / 2,
        top: from.y - COIN_SIZE / 2,
        opacity: value.interpolate({ inputRange: [0, 0.06, 0.88, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateX: value.interpolate({ inputRange: SAMPLE_STEPS, outputRange: paths[index].translateX }) },
          { translateY: value.interpolate({ inputRange: SAMPLE_STEPS, outputRange: paths[index].translateY }) },
          { scale: value.interpolate({ inputRange: [0, 0.12, 0.8, 1], outputRange: [0.5, 1.05, 0.85, 0.5] }) },
        ],
      }]}
    ><Coin size={COIN_SIZE} /></Animated.View>)}
  </View>;
}

export function CountUpBalance({ value, style }) {
  const [shown, setShown] = React.useState(value);
  const previous = React.useRef(value);
  React.useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from == null || value == null || from === value) { setShown(value); return undefined; }
    const counter = new Animated.Value(from);
    const listener = counter.addListener(({ value: current }) => setShown(Math.round(current)));
    Animated.timing(counter, { toValue: value, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(() => setShown(value));
    return () => { counter.removeListener(listener); counter.stopAnimation(); };
  }, [value]);
  return <Text style={style}>{shown ?? 0}</Text>;
}

const styles = StyleSheet.create({
  coin: { position: 'absolute', width: COIN_SIZE, height: COIN_SIZE },
});
