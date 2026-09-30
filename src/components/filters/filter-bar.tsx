import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { FilterSheet } from '@/components/filters/filter-sheet';
import { Chip } from '@/components/ui/chip';
import { Icons } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import type { Brand } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';
import { activeFilterCount, QUICK_FILTERS, SORT_OPTIONS, type Filters, type QuickFilter } from '@/lib/filters';

type FilterBarProps = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  /** Brands offered in the filter sheet. Hidden when empty (e.g. on a brand page). */
  brands: Brand[];
  /** Background behind the chips, so the bar can be sticky. */
  sticky?: boolean;
};

/** Zomato-style horizontal filter chips with a full filter sheet. */
export function FilterBar({ filters, onChange, brands, sticky }: FilterBarProps) {
  const theme = useTheme();
  const [sheet, setSheet] = useState<'filters' | 'sort' | null>(null);
  const sortLabel = SORT_OPTIONS.find((o) => o.id === filters.sort)?.label;

  function toggleQuick(id: QuickFilter) {
    const quick = filters.quick.includes(id)
      ? filters.quick.filter((q) => q !== id)
      : [...filters.quick, id];
    onChange({ ...filters, quick });
  }

  return (
    <View style={sticky && { backgroundColor: theme.background }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        <Chip
          label="Filters"
          icon={Icons.filter}
          count={activeFilterCount(filters)}
          selected={activeFilterCount(filters) > 0}
          onPress={() => setSheet('filters')}
        />
        <Chip
          label={filters.sort === 'relevance' ? 'Sort by' : (sortLabel ?? 'Sort by')}
          selected={filters.sort !== 'relevance'}
          dropdown
          onPress={() => setSheet('sort')}
        />
        {QUICK_FILTERS.map((filter) => (
          <Chip
            key={filter.id}
            label={filter.label}
            selected={filters.quick.includes(filter.id)}
            removable
            onPress={() => toggleQuick(filter.id)}
          />
        ))}
      </ScrollView>

      <FilterSheet
        visible={sheet !== null}
        mode={sheet ?? 'filters'}
        filters={filters}
        brands={brands}
        onClose={() => setSheet(null)}
        onApply={(next) => {
          onChange(next);
          setSheet(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
});
