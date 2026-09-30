import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import type { Brand } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';
import { EMPTY_FILTERS, QUICK_FILTERS, SORT_OPTIONS, type Filters } from '@/lib/filters';

type FilterSheetProps = {
  visible: boolean;
  mode: 'filters' | 'sort';
  filters: Filters;
  brands: Brand[];
  onClose: () => void;
  onApply: (filters: Filters) => void;
};

export function FilterSheet(props: FilterSheetProps) {
  // Remount the body each time the sheet opens so the draft starts from the applied filters.
  return (
    <BottomSheet
      visible={props.visible}
      title={props.mode === 'sort' ? 'Sort by' : 'Filters'}
      onClose={props.onClose}>
      {props.visible && <FilterSheetBody {...props} />}
    </BottomSheet>
  );
}

function FilterSheetBody({ mode, filters, brands, onApply }: FilterSheetProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState<Filters>(filters);

  if (mode === 'sort') {
    return (
      <View style={styles.sortList}>
        {SORT_OPTIONS.map((option) => {
          const selected = filters.sort === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onApply({ ...filters, sort: option.id })}
              style={({ pressed }) => [styles.sortRow, pressed && { backgroundColor: theme.surfaceMuted }]}>
              <AppText variant={selected ? 'bodyStrong' : 'body'}>{option.label}</AppText>
              <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.border }]}>
                {selected && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  }

  function toggleBrand(id: string) {
    setDraft((d) => ({
      ...d,
      brandIds: d.brandIds.includes(id) ? d.brandIds.filter((b) => b !== id) : [...d.brandIds, id],
    }));
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="overline" color="textMuted">
          SORT BY
        </AppText>
        <View style={styles.wrap}>
          {SORT_OPTIONS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              selected={draft.sort === option.id}
              onPress={() => setDraft((d) => ({ ...d, sort: option.id }))}
            />
          ))}
        </View>

        <AppText variant="overline" color="textMuted">
          SHOW ONLY
        </AppText>
        <View style={styles.wrap}>
          {QUICK_FILTERS.map((filter) => (
            <Chip
              key={filter.id}
              label={filter.label}
              selected={draft.quick.includes(filter.id)}
              onPress={() =>
                setDraft((d) => ({
                  ...d,
                  quick: d.quick.includes(filter.id)
                    ? d.quick.filter((q) => q !== filter.id)
                    : [...d.quick, filter.id],
                }))
              }
            />
          ))}
        </View>

        {brands.length > 1 && (
          <>
            <AppText variant="overline" color="textMuted">
              BRANDS
            </AppText>
            <View style={[styles.brandList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {brands.map((brand, index) => {
                const checked = draft.brandIds.includes(brand.id);
                return (
                  <Pressable
                    key={brand.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    onPress={() => toggleBrand(brand.id)}
                    style={[
                      styles.brandRow,
                      index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
                    ]}>
                    <BrandMark brand={brand} size={32} />
                    <AppText variant="bodyStrong" style={styles.flex}>
                      {brand.name}
                    </AppText>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: checked ? theme.primary : theme.border,
                          backgroundColor: checked ? theme.primary : 'transparent',
                        },
                      ]}>
                      {checked && <Icon name={Icons.check} color={theme.onPrimary} size={12} weight="bold" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={styles.flex}>
          <Button title="Clear all" variant="secondary" onPress={() => setDraft(EMPTY_FILTERS)} />
        </View>
        <View style={styles.flex}>
          <Button title="Apply" onPress={() => onApply(draft)} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three - 4,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  brandList: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sortList: {
    paddingVertical: Spacing.two,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
