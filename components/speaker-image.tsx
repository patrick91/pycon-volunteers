import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Dimensions, Modal, TouchableOpacity } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const ImageModal = ({
  visible,
  imageUri,
  onClose,
}: {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}) => {
  const { height: screenHeight } = Dimensions.get('window');
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Reset values when modal becomes visible
    if (visible) {
      translateY.value = 0;
      scale.value = 1;
      opacity.value = 1;
    }
  }, [visible, opacity, scale, translateY]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Allow dragging in both directions
      translateY.value = event.translationY;

      // Calculate absolute drag distance for scaling and opacity
      const dragDistance = Math.abs(event.translationY);

      // Reduce scale as user drags in either direction
      scale.value = interpolate(
        dragDistance,
        [0, screenHeight * 0.5],
        [1, 0.8],
        Extrapolation.CLAMP,
      );

      // Reduce opacity as user drags in either direction
      opacity.value = interpolate(
        dragDistance,
        [0, screenHeight * 0.5],
        [1, 0.2],
        Extrapolation.CLAMP,
      );
    })
    .onEnd((event) => {
      // If dragged more than 20% of screen height in either direction, close the modal
      if (Math.abs(event.translationY) > screenHeight * 0.2) {
        // Determine direction to animate off screen
        const direction = event.translationY > 0 ? 1 : -1;
        translateY.value = withTiming(direction * screenHeight, {
          duration: 250,
        });
        opacity.value = withTiming(0, { duration: 250 }, () => {
          runOnJS(onClose)();
        });
      } else {
        // Otherwise, snap back to original position
        translateY.value = withTiming(0, { duration: 250 });
        scale.value = withTiming(1, { duration: 250 });
        opacity.value = withTiming(1, { duration: 250 });
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    translateY.value = withTiming(50, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
  });

  const composedGestures = Gesture.Exclusive(panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        Math.abs(translateY.value),
        [0, screenHeight * 0.5],
        [1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView className="flex-1">
        <GestureDetector gesture={tapGesture}>
          <Animated.View
            style={[backgroundAnimatedStyle]}
            className="bg-black/80"
          >
            <GestureDetector gesture={composedGestures}>
              <Animated.View
                style={[
                  {
                    width: width,
                    height: height,
                  },
                  animatedStyle,
                ]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: width, height: height }}
                  contentFit="contain"
                />
              </Animated.View>
            </GestureDetector>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
};

export function SpeakerImage({
  imageUri,
  size = 64,
}: {
  imageUri: string;
  size?: number;
}) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size }}
        />
      </TouchableOpacity>
      <ImageModal
        visible={modalVisible}
        imageUri={imageUri}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}
