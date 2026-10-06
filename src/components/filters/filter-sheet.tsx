import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  EMPTY_FILTERS,
  isSelected,
  PRICE_RANGES,
  QUICK_FILTERS,
  SORT_OPTIONS,
  toggleSelection,
  type Filters,
} from '@/lib/filters';
import type { FilterGroup } from '@/services/types';

type FilterSheetProps = {
  visible: boolean;
  mode: 'filters' | 'sort';
  filters: Filters;
  groups: FilterGroup[];
  showPrice: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
};

export function FilterSheet(props: FilterSheetProps) {
  // Remount the body each time the sheet opens so the draft starts from the applied filters.
  return (
    <BottomSheet visible={props.visible} title={props.mode === 'sort' ? 'Sort by' : 'Filters'} onClose={props.onClose}>
      {props.visible && <FilterSheetBody {...props} />}
    </BottomSheet>
  );
}

function FilterSheetBody({ mode, filters, groups, showPrice, onApply }: FilterSheetProps) {
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

  const brandGroup = groups.find((g) => g.code.toUpperCase() === 'BRAND');
  const otherGroups = groups.filter((g) => g !== brandGroup);

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
                  quick: d.quick.includes(filter.id) ? d.quick.filter((q) => q !== filter.id) : [...d.quick, filter.id],
                }))
              }
            />
          ))}
        </View>

        {showPrice && (
          <>
            <AppText variant="overline" color="textMuted">
              PRICE
            </AppText>
            <View style={styles.wrap}>
              {PRICE_RANGES.map((range) => (
                <Chip
                  key={range.label}
                  label={range.label}
                  selected={draft.price?.label === range.label}
                  onPress={() =>
                    setDraft((d) => ({ ...d, price: d.price?.label === range.label ? null : range }))
                  }
                />
              ))}
            </View>
          </>
        )}

        {brandGroup && brandGroup.options.length > 1 && (
          <>
            <AppText variant="overline" color="textMuted">
              {brandGroup.name.toUpperCase()}
            </AppText>
            <View style={[styles.brandList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {brandGroup.options.map((name, index) => {
                const checked = isSelected(draft, brandGroup.code, name);
                return (
                  <Pressable
                    key={name}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    onPress={() => setDraft((d) => toggleSelection(d, brandGroup.code, name))}
                    style={[
                      styles.brandRow,
                      index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
                    ]}>
                    <BrandMark name={name} size={32} />
                    <AppText variant="bodyStrong" style={styles.flex}>
                      {name}
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

        {otherGroups.map((group) => (
          <View key={group.code}>
            <AppText variant="overline" color="textMuted" style={styles.groupTitle}>
              {group.name.toUpperCase()}
            </AppText>
            <View style={styles.wrap}>
              {group.options.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={isSelected(draft, group.code, option)}
                  onPress={() => setDraft((d) => toggleSelection(d, group.code, option))}
                />
              ))}
            </View>
          </View>
        ))}
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
  groupTitle: {
    marginBottom: Spacing.three - 4,
  },
  brandList: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: Spacing.three,
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
