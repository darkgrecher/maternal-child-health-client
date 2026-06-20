/**
 * LoopingVideo
 *
 * Thin wrapper around `expo-video` for the app's decorative, auto-playing
 * looping videos. Encapsulates the `useVideoPlayer` hook so call sites stay
 * declarative. (Replaces the deprecated `expo-av` <Video>, which is no longer
 * bundled in Expo Go.)
 */

import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView, VideoSource } from 'expo-video';

interface LoopingVideoProps {
  source: VideoSource;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain' | 'fill';
  muted?: boolean;
  nativeControls?: boolean;
}

export const LoopingVideo: React.FC<LoopingVideoProps> = ({
  source,
  style,
  contentFit = 'cover',
  muted = true,
  nativeControls = false,
}) => {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = muted;
    p.play();
  });

  return (
    <VideoView
      style={style}
      player={player}
      contentFit={contentFit}
      nativeControls={nativeControls}
    />
  );
};

export default LoopingVideo;
