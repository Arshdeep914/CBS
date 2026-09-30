import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { demoAccount } from '@/data/account';
import { useTheme } from '@/hooks/use-theme';
import { formatCompactINR } from '@/lib/format';
import { cartActions } from '@/store/cart';
import { useOrders } from '@/store/orders';
import { useSession } from '@/store/session';

function comingSoon(feature: string) {
  Alert.alert(feature, 'This will be available in the full release of the CBS Kitchenware app.');
}

export default function AccountScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const { orders } = useOrders();

  const purchased = orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);

  function signOut() {
    const doSignOut = () => {
      cartActions.clear();
      session.signOut();
    };
    if (Platform.OS === 'web') {
      doSignOut();
      return;
    }
    Alert.alert('Sign out?', 'You’ll need admin approval to sign in on this device again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: doSignOut },
    ]);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}>
      {/* Profile hero */}
      <View style={[styles.hero, { backgroundColor: theme.primary, paddingTop: insets.top + Spacing.four }]}>
        <View style={[styles.heroCircle, styles.heroCircleLarge]} />
        <View style={styles.heroContent}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <AppText variant="title" color="primary">
                RS
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="title" color="#FFFFFF" numberOfLines={1}>
                {demoAccount.businessName}
              </AppText>
              <AppText color="rgba(255,255,255,0.85)">
                {demoAccount.ownerName} · {session.email}
              </AppText>
            </View>
          </View>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Icon name={Icons.premium} color="#FFD36B" size={13} />
              <AppText variant="captionStrong" color="#FFFFFF">
                {demoAccount.tier}
              </AppText>
            </View>
            <View style={styles.badge}>
              <Icon name={Icons.verified} color="#FFFFFF" size={13} />
              <AppText variant="captionStrong" color="#FFFFFF">
                GST verified
              </AppText>
            </View>
            <View style={styles.badge}>
              <AppText variant="captionStrong" color="#FFFFFF">
                ID {demoAccount.customerId}
              </AppText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* Business summary */}
        <View style={[styles.card, styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Summary value={orders.length.toString()} label="Orders" />
          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
          <Summary value={formatCompactINR(purchased)} label="Purchased" />
          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
          <Summary value={demoAccount.memberSince.toString()} label="Partner since" />
        </View>

        {/* Quick tiles */}
        <View style={styles.tiles}>
          <Tile icon={Icons.orders} label="Orders" meta={`${orders.length}`} onPress={() => router.navigate('/orders')} />
          <Tile icon={Icons.invoice} label="Invoices" onPress={() => comingSoon('Invoices')} />
          <Tile icon={Icons.location} label="Addresses" meta={`${demoAccount.addresses.length}`} onPress={() => comingSoon('Addresses')} />
          <Tile icon={Icons.gift} label="Offers" onPress={() => router.push({ pathname: '/search', params: { tag: 'bulk-deal' } })} />
        </View>

        {/* Business */}
        <MenuSection title="BUSINESS">
          <MenuRow icon={Icons.store} label="Business details" detail={`GSTIN ${demoAccount.gstin}`} onPress={() => comingSoon('Business details')} />
          {demoAccount.addresses.map((address) => (
            <MenuRow
              key={address.id}
              icon={Icons.location}
              label={address.label + (address.isDefault ? ' · Default' : '')}
              detail={`${address.line1}, ${address.line2}`}
              onPress={() => comingSoon('Addresses')}
            />
          ))}
        </MenuSection>

        <MenuSection title="PREFERENCES">
          <MenuRow icon={Icons.bell} label="Notifications" detail="Order updates, offers, price drops" onPress={() => comingSoon('Notifications')} />
          <MenuRow icon={Icons.shield} label="Approved devices" detail="Manage where you’re signed in" onPress={() => comingSoon('Approved devices')} />
        </MenuSection>

        <MenuSection title="SUPPORT">
          <MenuRow icon={Icons.help} label="Help & FAQs" onPress={() => comingSoon('Help & FAQs')} />
          <MenuRow icon={Icons.document} label="Terms & privacy" onPress={() => comingSoon('Terms & privacy')} />
          <MenuRow icon={Icons.info} label="About CBS Kitchenware" detail="Designer for your kitchen, since 1976" onPress={() => comingSoon('About CBS')} />
        </MenuSection>

        <Button title="Sign out" icon={Icons.logout} variant="secondary" onPress={signOut} />

        <View style={styles.footer}>
          <BrandLogo size={56} />
          <AppText variant="caption" color="textMuted">
            CBS Kitchenware v{Constants.expoConfig?.version ?? '1.0.0'} · Demo build
          </AppText>
        </View>
      </View>
    </ScrollView>
  );
}

function Summary({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryItem}>
      <AppText variant="heading">{value}</AppText>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
    </View>
  );
}

function Tile({ icon, label, meta, onPress }: { icon: IconName; label: string; meta?: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && { opacity: 0.7 },
      ]}>
      <View style={[styles.tileIcon, { backgroundColor: theme.primarySoft }]}>
        <Icon name={icon} color={theme.primary} size={20} />
      </View>
      <AppText variant="captionStrong">{label}</AppText>
      {meta && (
        <AppText variant="micro" color="textMuted">
          {meta}
        </AppText>
      )}
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
    paddingBottom: Spacing.six + Spacing.two,
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
    gap: Spacing.three,
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
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  body: {
    width: '100%',
    maxWidth: MaxFormWidth + 200,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    marginTop: -Spacing.six,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
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
