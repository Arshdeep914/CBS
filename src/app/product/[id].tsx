import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { ProductRail } from '@/components/home/product-rail';
import { AddButton } from '@/components/product/add-button';
import { RemoteImage } from '@/components/product/product-image';
import { RatingBadge } from '@/components/product/rating-badge';
import { TagBadge } from '@/components/product/tag-badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import {
  discountPercent,
  getBrand,
  getCategory,
  getProduct,
  productsByBrand,
  similarProducts,
  unitPriceFor,
} from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';
import { formatINR } from '@/lib/format';
import { cartActions, useCartQuantity } from '@/store/cart';

export default function ProductScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = getProduct(id);
  const quantity = useCartQuantity(id);
  const [imageIndex, setImageIndex] = useState(0);

  if (!product) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Product" />
        <EmptyState icon={Icons.box} title="Product not found" message="It may have been discontinued." />
      </View>
    );
  }

  const brand = getBrand(product.brandId);
  const category = getCategory(product.categoryId);
  const subcategory = category?.subcategories.find((s) => s.id === product.subcategoryId);
  const width = Math.min(windowWidth, 900);
  const imageHeight = Math.round(width * 0.92);
  const unitPrice = unitPriceFor(product, Math.max(quantity, product.moq));
  const margin = product.mrp - product.price;
  const soldOut = product.stock === 'out-of-stock';
  const moreFromBrand = productsByBrand(product.brandId).filter((p) => p.id !== product.id);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Gallery */}
        <View style={{ height: imageHeight }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => setImageIndex(Math.round(event.nativeEvent.contentOffset.x / width))}>
            {product.images.map((image) => (
              <RemoteImage key={image} image={image} width={width} height={imageHeight} dimmed={soldOut} />
            ))}
          </ScrollView>
          <View style={[styles.topBar, { top: insets.top + Spacing.two }]}>
            <RoundButton icon={Icons.back} label="Go back" onPress={() => router.back()} />
            <View style={styles.topRight}>
              <RoundButton
                icon={Icons.share}
                label="Share"
                onPress={() => Share.share({ message: `${product.name} — ${formatINR(product.price)} on CBS Kitchenware` })}
              />
              <RoundButton icon={Icons.cart} label="Cart" onPress={() => router.push('/cart')} />
            </View>
          </View>
          {product.images.length > 1 && (
            <View style={styles.dots}>
              {product.images.map((image, index) => (
                <View
                  key={image}
                  style={[styles.dot, index === imageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          {/* Title block */}
          <View style={styles.block}>
            <View style={styles.brandRow}>
              {brand && (
                <Pressable
                  onPress={() => router.push({ pathname: '/brand/[id]', params: { id: brand.id } })}
                  style={styles.brandLink}>
                  <BrandMark brand={brand} size={28} />
                  <AppText variant="captionStrong" color="primary">
                    {brand.name}
                  </AppText>
                  <Icon name={Icons.chevronRight} color={theme.primary} size={10} weight="bold" />
                </Pressable>
              )}
              <View style={styles.tags}>
                {product.tags.slice(0, 2).map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
              </View>
            </View>
            <AppText variant="title">{product.name}</AppText>
            <View style={styles.ratingRow}>
              <RatingBadge rating={product.rating} size="md" />
              <AppText variant="caption" color="textSecondary">
                {product.ratingCount.toLocaleString('en-IN')} retailer ratings
              </AppText>
              <StockPill stock={product.stock} />
            </View>
            {category && subcategory && (
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/category/[id]', params: { id: category.id, sub: subcategory.id } })
                }>
                <AppText variant="caption" color="textMuted">
                  {category.name} › {subcategory.name}
                </AppText>
              </Pressable>
            )}
          </View>

          {/* Price */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.priceRow}>
              <AppText variant="display">{formatINR(product.price)}</AppText>
              <AppText variant="caption" color="textSecondary">
                per {product.unit.replace(/s$/, '')} · excl. GST
              </AppText>
            </View>
            <View style={styles.priceRow}>
              <AppText color="textMuted" style={styles.strike}>
                MRP {formatINR(product.mrp)}
              </AppText>
              <View style={[styles.marginPill, { backgroundColor: theme.successSoft }]}>
                <AppText variant="captionStrong" color="success">
                  {discountPercent(product)}% margin · earn {formatINR(margin)}/{product.unit.replace(/s$/, '')}
                </AppText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <AppText variant="overline" color="textMuted">
              BULK PRICING
            </AppText>
            {product.tiers.map((tier, index) => {
              const next = product.tiers[index + 1];
              const effectiveQty = Math.max(quantity, product.moq);
              const active = effectiveQty >= tier.minQty && (!next || effectiveQty < next.minQty);
              const saving = Math.round(((product.price - tier.price) / product.price) * 100);
              return (
                <Pressable
                  key={tier.minQty}
                  disabled={soldOut}
                  onPress={() => cartActions.setQuantity(product, tier.minQty)}
                  style={[
                    styles.tier,
                    { borderColor: active ? theme.primary : theme.border },
                    active && { backgroundColor: theme.primarySoft },
                  ]}>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">
                      {next ? `${tier.minQty}–${next.minQty - 1}` : `${tier.minQty}+`} {product.unit}
                    </AppText>
                    <AppText variant="caption" color="textMuted">
                      {index === 0 ? 'Minimum order' : `Tap to order ${tier.minQty}`}
                    </AppText>
                  </View>
                  {saving > 0 && (
                    <AppText variant="captionStrong" color="success">
                      Save {saving}%
                    </AppText>
                  )}
                  <AppText variant="subheading">{formatINR(tier.price)}</AppText>
                </Pressable>
              );
            })}
          </View>

          {/* Trade facts */}
          <View style={styles.facts}>
            <Fact icon={Icons.box} label="MOQ" value={`${product.moq} ${product.unit}`} />
            <Fact icon={Icons.store} label="Case pack" value={`${product.casePack} ${product.unit}`} />
            <Fact icon={Icons.percent} label="GST" value={`${product.gstRate}%`} />
            <Fact icon={Icons.truck} label="Dispatch" value={soldOut ? 'Restocking' : '24 hrs'} />
          </View>

          {/* Highlights */}
          <View style={styles.block}>
            <AppText variant="heading">Why retailers stock it</AppText>
            {product.highlights.map((highlight) => (
              <View key={highlight} style={styles.highlight}>
                <View style={[styles.check, { backgroundColor: theme.successSoft }]}>
                  <Icon name={Icons.check} color={theme.success} size={11} weight="bold" />
                </View>
                <AppText style={styles.flex}>{highlight}</AppText>
              </View>
            ))}
          </View>

          {/* Specs */}
          <View style={styles.block}>
            <AppText variant="heading">Specifications</AppText>
            <View style={[styles.specs, { borderColor: theme.border }]}>
              {product.specs.map((spec, index) => (
                <View
                  key={spec.label}
                  style={[
                    styles.specRow,
                    { backgroundColor: index % 2 === 0 ? theme.surface : theme.background },
                  ]}>
                  <AppText variant="caption" color="textSecondary" style={styles.specLabel}>
                    {spec.label}
                  </AppText>
                  <AppText variant="bodyStrong" style={styles.flex}>
                    {spec.value}
                  </AppText>
                </View>
              ))}
            </View>
          </View>

          {/* Assurance */}
          <View style={[styles.assurance, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Assurance icon={Icons.truck} title="Free delivery" text="On orders above ₹25,000" />
            <Assurance icon={Icons.refresh} title="Easy returns" text="7 days on damaged goods" />
            <Assurance icon={Icons.shield} title="Genuine stock" text="Direct from brand" />
          </View>
        </View>

        <View style={styles.rails}>
          <ProductRail title="Similar products" products={similarProducts(product)} />
          {brand && moreFromBrand.length > 0 && (
            <ProductRail
              title={`More from ${brand.name}`}
              products={moreFromBrand.slice(0, 8)}
              onSeeAll={() => router.push({ pathname: '/brand/[id]', params: { id: brand.id } })}
            />
          )}
        </View>
      </ScrollView>

      {/* Sticky purchase bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.two },
        ]}>
        <View style={styles.bottomInner}>
          {quantity > 0 ? (
            <>
              <AddButton product={product} size="lg" />
              <View style={styles.flex}>
                <Button title={`View cart · ${formatINR(unitPrice * quantity)}`} onPress={() => router.push('/cart')} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.flex}>
                <AppText variant="heading">{formatINR(product.price * product.moq)}</AppText>
                <AppText variant="caption" color="textMuted">
                  for {product.moq} {product.unit} (MOQ)
                </AppText>
              </View>
              <View style={styles.addWrap}>
                <Button
                  title={soldOut ? 'Out of stock' : 'Add to cart'}
                  icon={soldOut ? undefined : Icons.cart}
                  disabled={soldOut}
                  onPress={() => cartActions.add(product)}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function RoundButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.round}>
      <Icon name={icon} color="#1B1A19" size={17} weight="semibold" />
    </Pressable>
  );
}

function StockPill({ stock }: { stock: 'in-stock' | 'low-stock' | 'out-of-stock' }) {
  const theme = useTheme();
  const config = {
    'in-stock': { label: 'In stock', bg: theme.successSoft, fg: theme.success },
    'low-stock': { label: 'Few cartons left', bg: theme.warningSoft, fg: theme.warning },
    'out-of-stock': { label: 'Out of stock', bg: theme.primarySoft, fg: theme.danger },
  }[stock];

  return (
    <View style={[styles.stockPill, { backgroundColor: config.bg }]}>
      <AppText variant="micro" color={config.fg}>
        {config.label.toUpperCase()}
      </AppText>
    </View>
  );
}

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.fact, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Icon name={icon} color={theme.primary} size={18} />
      <AppText variant="micro" color="textMuted">
        {label.toUpperCase()}
      </AppText>
      <AppText variant="captionStrong" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

function Assurance({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.assuranceItem}>
      <View style={[styles.assuranceIcon, { backgroundColor: theme.primarySoft }]}>
        <Icon name={icon} color={theme.primary} size={16} />
      </View>
      <AppText variant="captionStrong" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="micro" color="textMuted" style={styles.center}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  topBar: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topRight: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  round: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  dots: {
    position: 'absolute',
    bottom: 34,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },
  sheet: {
    marginTop: -22,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
  },
  block: {
    gap: Spacing.two,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tags: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  stockPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  marginPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.two,
  },
  tier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  facts: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  fact: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: Spacing.three - 4,
    paddingHorizontal: 4,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specs: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two + 2,
    gap: Spacing.three - 4,
  },
  specLabel: {
    width: 110,
  },
  assurance: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  assuranceItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  assuranceIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  rails: {
    paddingTop: Spacing.five,
    gap: Spacing.five - 4,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.06)',
  },
  bottomInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    width: '100%',
    maxWidth: MaxFormWidth + 200,
    alignSelf: 'center',
  },
  addWrap: {
    minWidth: 170,
  },
});
