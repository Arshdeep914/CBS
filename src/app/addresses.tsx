import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/api/client';
import { CardListSkeleton } from '@/components/product/skeletons';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Icon, Icons } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Address } from '@/services/types';
import { addressActions, formatAddress, useAddresses } from '@/store/addresses';

export default function AddressesScreen() {
  const theme = useTheme();
  const addresses = useAddresses();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    addressActions.ensureLoaded();
  }, []);

  async function refresh() {
    setRefreshing(true);
    await addressActions.load().catch(() => {});
    setRefreshing(false);
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Saved addresses" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} colors={[theme.primary]} />}
        contentContainerStyle={styles.content}>
        {addresses.status === 'loading' || addresses.status === 'idle' ? (
          <CardListSkeleton count={2} height={130} />
        ) : addresses.status === 'error' ? (
          <ErrorState message={addresses.error ?? 'Couldn’t load your addresses.'} onRetry={() => addressActions.load().catch(() => {})} />
        ) : addresses.items.length === 0 ? (
          <EmptyState icon={Icons.location} title="No saved addresses" message="Add one now to check out faster." />
        ) : (
          addresses.items.map((address) => <AddressCard key={address.id} address={address} />)
        )}
        <Button title="Add a new address" icon={Icons.plus} onPress={() => router.push('/address-form')} />
      </ScrollView>
    </View>
  );
}

function AddressCard({ address }: { address: Address }) {
  const theme = useTheme();
  const [working, setWorking] = useState(false);

  async function run(action: () => Promise<void>, done: string, fallback: string) {
    setWorking(true);
    try {
      await action();
      toast.show(done, 'success');
    } catch (err) {
      toast.show(errorMessage(err, fallback), 'error');
    } finally {
      setWorking(false);
    }
  }

  function confirmDelete() {
    const remove = () => run(() => addressActions.remove(address.id), 'Address removed', "Couldn't remove that address.");
    if (Platform.OS === 'web') return void remove();
    Alert.alert('Remove this address?', formatAddress(address), [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void remove() },
    ]);
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: address.isPrimary ? theme.primary : theme.border }]}>
      <View style={styles.cardTop}>
        <Icon name={Icons.location} color={theme.primary} size={18} />
        <AppText variant="bodyStrong" style={styles.flex}>
          {address.fullName}
        </AppText>
        {address.isPrimary && (
          <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
            <AppText variant="micro" color="primary">
              DEFAULT
            </AppText>
          </View>
        )}
        {working && <ActivityIndicator size="small" color={theme.primary} />}
      </View>
      <AppText color="textSecondary">{formatAddress(address)}</AppText>
      <AppText variant="caption" color="textMuted">
        {address.mobile}
        {address.email ? ` · ${address.email}` : ''}
      </AppText>
      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        <Action label="Edit" onPress={() => router.push({ pathname: '/address-form', params: { id: address.id } })} disabled={working} />
        {!address.isPrimary && (
          <Action
            label="Set as default"
            onPress={() => run(() => addressActions.setPrimary(address.id), 'Default address updated', "Couldn't update that.")}
            disabled={working}
          />
        )}
        <Action label="Remove" danger onPress={confirmDelete} disabled={working} />
      </View>
    </View>
  );
}

function Action({ label, onPress, danger, disabled }: { label: string; onPress: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8} style={disabled && styles.disabled}>
      <AppText variant="captionStrong" color={danger ? 'danger' : 'primary'}>
        {label.toUpperCase()}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxFormWidth + 200,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three - 4,
    paddingBottom: Spacing.six,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.two,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.four,
    paddingTop: Spacing.three - 4,
    marginTop: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  disabled: {
    opacity: 0.4,
  },
});
