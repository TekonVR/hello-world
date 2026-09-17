/** Shared UI pieces. RN primitives only: no component library in the MVP. */

import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colours, radius, space, type } from './theme';

export function Screen({
  children,
  scroll = true,
  style,
}: {
  children?: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const content = <View style={[styles.screenInner, style]}>{children}</View>;
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Heading({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.heading, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Dim({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.dim, style]}>{children}</Text>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{String(children).toUpperCase()}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.ghost, pressed && styles.pressed, style]}
    >
      <Text style={styles.ghostLabel}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipOn, pressed && styles.pressed]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelOn]}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Tag({ label, tone = 'plain' }: { label: string; tone?: 'plain' | 'accent' }) {
  return (
    <View style={[styles.tag, tone === 'accent' && styles.tagAccent]}>
      <Text style={[styles.tagLabel, tone === 'accent' && styles.tagLabelAccent]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colours.bg },
  screenInner: { flex: 1, paddingHorizontal: space.lg, gap: space.md },
  scrollContent: { flexGrow: 1, paddingVertical: space.lg },
  card: {
    backgroundColor: colours.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.line,
    padding: space.lg,
    gap: space.md,
  },
  title: { ...type.title, color: colours.text },
  heading: { ...type.heading, color: colours.text },
  body: { ...type.body, color: colours.text, lineHeight: 22 },
  dim: { ...type.small, color: colours.textDim, lineHeight: 20 },
  eyebrow: { ...type.tiny, color: colours.textFaint },
  primary: {
    backgroundColor: colours.accent,
    borderRadius: radius.pill,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryLabel: { ...type.heading, color: colours.accentInk, fontSize: 17 },
  ghost: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colours.line,
  },
  ghostLabel: { ...type.body, color: colours.textDim },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surfaceHigh,
  },
  chipOn: { borderColor: colours.accent, backgroundColor: 'rgba(110, 231, 168, 0.14)' },
  chipLabel: { ...type.small, color: colours.textDim },
  chipLabelOn: { color: colours.text, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colours.surfaceHigh,
  },
  tagAccent: { backgroundColor: 'rgba(110, 231, 168, 0.14)' },
  tagLabel: { ...type.small, color: colours.textDim, fontSize: 12 },
  tagLabelAccent: { color: colours.accent },
});
