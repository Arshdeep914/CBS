import Constants from 'expo-constants';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Env } from '@/config/env';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isDemo } from '@/services';
import { useSession } from '@/store/session';

function comingSoon(feature: string) {
  Alert.alert(feature, 'This will be available in an upcoming update.');
}

export default function AccountScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useSession();
  const initials = (user?.name || user?.email || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function confirmSignOut() {
    if (Platform.OS === 'web') {
      void signOut();
      return;
    }
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={[styles.hero, { backgroundColor: theme.primary, paddingTop: insets.top + Spacing.four }]}>
        <View style={[styles.heroCircle, styles.heroCircleLarge]} />
        <View style={styles.heroContent}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <AppText variant="title" color="primary">
                {initials}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="title" color="#FFFFFF" numberOfLines={1}>
                {user?.name || 'Your account'}
              </AppText>
              <AppText color="rgba(255,255,255,0.85)" numberOfLines={1}>
                {user?.email}
              </AppText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={[styles.tiles, styles.raised]}>
          <Tile icon={Icons.orders} label="Orders" onPress={() => router.navigate('/orders')} />
          <Tile icon={Icons.location} label="Addresses" onPress={() => router.push('/addresses')} />
          <Tile icon={Icons.heart} label="Wishlist" onPress={() => router.push('/wishlist')} />
          <Tile icon={Icons.support} label="Help" onPress={() => comingSoon('Help & support')} />
        </View>

        <MenuSection title="ACCOUNT">
          <MenuRow icon={Icons.location} label="Saved addresses" detail="Manage where we deliver" onPress={() => router.push('/addresses')} />
          <MenuRow icon={Icons.orders} label="My orders" detail="Track, view and get help" onPress={() => router.navigate('/orders')} />
          <MenuRow icon={Icons.heart} label="Wishlist" detail="Products you've saved for later" onPress={() => router.push('/wishlist')} />
          <MenuRow icon={Icons.bell} label="Notifications" detail="Order updates and offers" onPress={() => router.push('/notifications')} />
        </MenuSection>

        <MenuSection title="SUPPORT">
          <MenuRow icon={Icons.help} label="Help & FAQs" onPress={() => comingSoon('Help & FAQs')} />
          <MenuRow icon={Icons.refresh} label="Returns & refunds" onPress={() => comingSoon('Returns & refunds')} />
          <MenuRow icon={Icons.document} label="Terms & privacy" onPress={() => comingSoon('Terms & privacy')} />
          <MenuRow icon={Icons.info} label="About CBS Kitchenware" detail="Designer for your kitchen, since 1976" onPress={() => comingSoon('About CBS')} />
        </MenuSection>

        <Button title="Sign out" icon={Icons.logout} variant="secondary" onPress={confirmSignOut} />

        <View style={styles.footer}>
          <BrandLogo size={56} />
          <AppText variant="caption" color="textMuted">
            CBS Kitchenware v{Constants.expoConfig?.version ?? '1.0.0'}
          </AppText>
          <AppText variant="micro" color="textMuted">
            {Env.offline
              ? 'OFFLINE DEMO'
              : `${isDemo ? 'DEMO PRODUCTS' : 'LIVE'} · ${Env.apiUrl.replace(/^https?:\/\//, '')}`}
          </AppText>
        </View>
      </View>
    </ScrollView>
  );
}

function Tile({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && { opacity: 0.7 }]}>
      <View style={[styles.tileIcon, { backgroundColor: theme.primarySoft }]}>
        <Icon name={icon} color={theme.primary} size={20} />
      </View>
      <AppText variant="captionStrong">{label}</AppText>
    </Pressable>
  );
}

function MenuSection({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <AppText variant="overline" color="textMuted" style={styles.sectionTitle}>
        {title}
      </AppText>
      <View style={[styles.menu, { backgroundColor: theme.surface, borderColor: theme.border }]}>{children}</View>
    </View>
  );
}

function MenuRow({ icon, label, detail, onPress }: { icon: IconName; label: string; detail?: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, { borderBottomColor: theme.border }, pressed && { backgroundColor: theme.surfaceMuted }]}>
      <Icon name={icon} color={theme.textSecondary} size={20} />
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{label}</AppText>
        {detail && (
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {detail}
          </AppText>
        )}
      </View>
      <Icon name={Icons.chevronRight} color={theme.textMuted} size={12} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingBottom: Spacing.six,
  },
  hero: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroCircleLarge: {
    width: 300,
    height: 300,
    top: -140,
    right: -100,
  },
  heroContent: {
    width: '100%',
    maxWidth: MaxFormWidth + 200,
    alignSelf: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    width: '100%',
    maxWidth: MaxFormWidth + 200,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    marginTop: -Spacing.five,
    gap: Spacing.three,
  },
  raised: {
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.three - 2,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
  },
  menu: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
});
