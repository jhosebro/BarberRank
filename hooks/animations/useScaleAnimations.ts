import { useRef } from "react";
import { Animated } from "react-native";

export const useScaleAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;

  const onFocus = () => {
    Animated.spring(scale, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
  };

  const onBlur = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return { scale, onFocus, onBlur };
};
