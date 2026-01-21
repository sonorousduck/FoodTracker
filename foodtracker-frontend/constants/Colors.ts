/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#67C090';
const tintColorDark = '#67C090';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#DDF4E7',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#26667F',
    tabIconSelected: tintColorLight,
    modal: '#FFFFFF',
    modalSecondary: '#E7E8E9',
    card: '#FFFFFF',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    modal: '#1E1E1E',
    modalSecondary: 'rgba(255, 255, 255, 0.3)',
    card: '#1E1E1E',
  },
};
