import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Platform, Text, type OpaqueColorValue, type TextStyle } from 'react-native';

type AppIconName =
  | 'calendar'
  | 'person.crop.circle'
  | 'qrcode'
  | 'storefront'
  | 'magnifyingglass'
  | 'chevron.down';

const FALLBACK_GLYPHS: Record<AppIconName, string> = {
  calendar: '📅',
  'person.crop.circle': '👤',
  qrcode: '▦',
  storefront: '🏬',
  magnifyingglass: '⌕',
  'chevron.down': '⌄',
};

export function AppIcon({
  name,
  size = 24,
  color,
}: {
  name: AppIconName;
  size?: number;
  color: string | OpaqueColorValue;
}) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={name as SymbolViewProps['name']}
        tintColor={color}
        resizeMode="scaleAspectFit"
        style={{ width: size, height: size }}
      />
    );
  }

  const fallbackStyle: TextStyle = {
    color: typeof color === 'string' ? color : '#000',
    fontSize: size * 0.8,
    lineHeight: size,
    textAlign: 'center',
  };

  return <Text style={fallbackStyle}>{FALLBACK_GLYPHS[name] ?? '•'}</Text>;
}
