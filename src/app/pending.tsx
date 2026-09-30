import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { MaxFormWidth, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getDeviceInfo } from '@/lib/device';
import { formatDateTime } from '@/lib/format';
import { useSession } from '@/store/session';

/** Demo mode: the admin "approves" the sign-in after this long. */
const AUTO_APPROVE_MS = 5000;
/** Pause on the "Approved" state before entering the app. */
const APPROVED_HOLD_MS = 1200;

export default function PendingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const device = getDeviceInfo();
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const approveTimer = setTimeout(() => setApproved(true), AUTO_APPROVE_MS);
    return () => clearTimeout(approveTimer);
  }, []);

  useEffect(() => {
    if (!approved) return;
    const enterTimer = setTimeout(session.approve, APPROVED_HOLD_MS);
    return () => clearTimeout(enterTimer);
  }, [approved, session.approve]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.four },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.brandRow}>
            <BrandLogo size={48} />
            <View>
              <Text style={[styles.brandName, { color: theme.text }]}>CBS Kitchenware</Text>
              <Text style={[styles.brandTag, { color: theme.textMuted }]}>Trade Portal</Text>
            </View>
          </View>

          <View style={styles.hero}>
            {approved ? <ApprovedBadge theme={theme} /> : <PulseBadge theme={theme} />}

            <View style={[styles.pill, { backgroundColor: approved ? theme.successSoft : theme.warningSoft }]}>
              <View style={[styles.pillDot, { backgroundColor: approved ? theme.success : theme.warning }]} />
              <Text style={[styles.pillText, { color: approved ? theme.success : theme.warning }]}>
                {approved ? 'Approved' : 'Pending approval'}
              </Text>
            </View>

            <Text style={[styles.title, { color: theme.text }]}>
              {approved ? 'You’re all set!' : 'Waiting for approval'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {approved
                ? 'The CBS team approved this device. Taking you to the catalogue…'
                : 'We’ve sent your sign-in request to the CBS team. You’ll get access as soon as an administrator approves this device.'}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.textMuted }]}>REQUEST DETAILS</Text>
            <DetailRow theme={theme} icon={Icons.person} label="Account" value={session.email ?? '—'} />
            <DetailRow theme={theme} icon={Icons.phone} label="Device" value={device.model} />
            <DetailRow theme={theme} icon={Icons.system} label="System" value={device.os} />
            <DetailRow
              theme={theme}
              icon={Icons.clock}
              label="Requested"
              value={formatDateTime(session.requestedAt ?? new Date().toISOString())}
              last
            />
          </View>

          <View style={styles.steps}>
            <Step theme={theme} state="done" title="Request sent" />
            <StepConnector theme={theme} done />
            <Step theme={theme} state={approved ? 'done' : 'active'} title="Admin review" />
            <StepConnector theme={theme} done={approved} />
            <Step theme={theme} state={approved ? 'done' : 'upcoming'} title="Access granted" />
          </View>

          <View style={styles.actions}>
            {!approved && <ReviewProgress theme={theme} />}
            <Button title="Use a different account" variant="ghost" onPress={session.signOut} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Thin bar that fills while the (simulated) admin review runs. */
function ReviewProgress({ theme }: { theme: ThemeColors }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(1, { duration: AUTO_APPROVE_MS, easing: Easing.inOut(Easing.quad) }));
  }, [progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));

  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
        <Animated.View style={[styles.progressFill, { backgroundColor: theme.primary }, fillStyle]} />
      </View>
      <Text style={[styles.progressText, { color: theme.textMuted }]}>Admin is reviewing your request…</Text>
    </View>
  );
}

function ApprovedBadge({ theme }: { theme: ThemeColors }) {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.badge}>
      <View style={[styles.badgeOuter, { backgroundColor: theme.successSoft }]}>
        <Animated.View
          entering={ZoomIn.springify().damping(12)}
          style={[styles.badgeInner, { backgroundColor: theme.success }]}>
          <Icon name={Icons.check} color="#FFFFFF" size={38} weight="bold" />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function PulseBadge({ theme }: { theme: ThemeColors }) {
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.badge}>
      {!reduceMotion && (
        <>
          <PulseRing color={theme.primary} delay={0} />
          <PulseRing color={theme.primary} delay={1200} />
        </>
      )}
      <View style={[styles.badgeOuter, { backgroundColor: theme.primarySoft }]}>
        <View style={[styles.badgeInner, { backgroundColor: theme.primary }]}>
          <Icon name={Icons.hourglass} color={theme.onPrimary} size={34} weight="semibold" />
        </View>
      </View>
    </View>
  );
}

function PulseRing({ color, delay }: { color: string; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1, false),
      ),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - progress.get()),
    transform: [{ scale: 1 + progress.get() * 0.7 }],
  }));

  return <Animated.View style={[styles.ring, { borderColor: color }, animatedStyle]} />;
}

type DetailRowProps = {
  theme: ThemeColors;
  icon: IconName;
  label: string;
  value: string;
  last?: boolean;
};

function DetailRow({ theme, icon, label, value, last }: DetailRowProps) {
  return (
    <View
      style={[
        styles.detailRow,
        !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      <View style={[styles.detailIcon, { backgroundColor: theme.surfaceMuted }]}>
        <Icon name={icon} color={theme.textSecondary} size={16} />
      </View>
      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

type StepState = 'done' | 'active' | 'upcoming';

function Step({ theme, state, title }: { theme: ThemeColors; state: StepState; title: string }) {
  const dotColor =
    state === 'done' ? theme.success : state === 'active' ? theme.primary : theme.border;

  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepDot,
          { backgroundColor: state === 'upcoming' ? theme.surface : dotColor, borderColor: dotColor },
        ]}>
        {state === 'done' && <Icon name={Icons.check} color="#FFFFFF" size={12} weight="bold" />}
        {state === 'active' && <View style={styles.stepActiveCore} />}
      </View>
      <Text
        style={[
          styles.stepTitle,
          { color: state === 'upcoming' ? theme.textMuted : theme.text },
          state === 'active' && styles.stepTitleActive,
        ]}>
        {title}
      </Text>
    </View>
  );
}

function StepConnector({ theme, done }: { theme: ThemeColors; done?: boolean }) {
  return (
    <View style={[styles.connector, { backgroundColor: done ? theme.success : theme.border }]} />
  );
}

const BADGE_SIZE = 112;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxFormWidth,
    alignSelf: 'center',
    gap: Spacing.four,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - Spacing.one,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
  },
  brandTag: {
    fontSize: 12,
    fontWeight: '500',
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.three - Spacing.one,
    paddingTop: Spacing.four,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  ring: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: 2,
  },
  badgeOuter: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three - Spacing.one,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: Spacing.one,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - Spacing.one,
    paddingVertical: Spacing.three - Spacing.one,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.two,
  },
  step: {
    alignItems: 'center',
    gap: Spacing.two,
    width: 88,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActiveCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepTitleActive: {
    fontWeight: '700',
  },
  connector: {
    flex: 1,
    height: 2,
    marginTop: 11,
    marginHorizontal: -Spacing.four,
    borderRadius: 1,
  },
  actions: {
    marginTop: 'auto',
    gap: Spacing.three,
  },
  progressWrap: {
    gap: Spacing.two,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
