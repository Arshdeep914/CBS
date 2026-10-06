import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/client';
import { BrandMark } from '@/components/brand-mark';
import { ProductRail } from '@/components/home/product-rail';
import { AddButton } from '@/components/product/add-button';
import { WishlistButton } from '@/components/product/wishlist-button';
import { Price } from '@/components/product/price';
import { RemoteImage } from '@/components/product/product-image';
import { RatingBadge } from '@/components/product/rating-badge';
import { ProductDetailSkeleton } from '@/components/product/skeletons';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { formatINR } from '@/lib/format';
import { shop } from '@/services';
import type { HomeSection, ProductDetail, ProductSummary } from '@/services/types';
import { cartActions, useCartPending, useCartQuantity } from '@/store/cart';

// "You may also like" draws on the home sections (the API has no related-products
// endpoint); cache them briefly so browsing products doesn't refetch every time.
let homeCache: { at: number; promise: Promise<HomeSection[]> } | null = null;
function cachedHome() {
  if (!homeCache || Date.now() - homeCache.at > 120_000) {
    const promise = shop.catalog.home().catch((err) => {
      homeCache = null;
      throw err;
    });
    homeCache = { at: Date.now(), promise };
  }
  return homeCache.promise;
}

export default function ProductScreen() {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, 900);
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useAsync((signal) => shop.catalog.product(id, signal), [id]);

  if (detail.loading) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScrollView scrollEnabled={false}>
          <ProductDetailSkeleton width={width} />
        </ScrollView>
        <FloatingBack />
      </View>
    );
  }

  if (detail.error || !detail.data) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Product" />
        <ErrorState message={detail.error ?? 'This product is not available right now.'} onRetry={detail.reload} />
      </View>
    );
  }

  // keyed so a different product starts with its own default variant
  return <ProductView key={detail.data.id} product={detail.data} width={width} />;
}

function ProductView({ product, width }: { product: ProductDetail; width: number }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [variantIndex, setVariantIndex] = useState(product.defaultVariantIndex);
  const [imageIndex, setImageIndex] = useState(0);
  const variant = product.variants[variantIndex] ?? product.variants[0];
  const imageHeight = Math.round(width * 0.92);

  const related = useAsync(async () => {
    const sections = await cachedHome();
    const seen = new Set<string>([product.id, ...product.variants.map((v) => v.id)]);
    return sections.flatMap((s) => s.products).filter((p) => !seen.has(p.id) && seen.add(p.id)).slice(0, 12);
  }, [product.id]);

  const cartItem = { id: variant.id, variationCode: variant.variationCode, isOutOfStock: variant.isOutOfStock, name: product.name };
  // what the wishlist stores for this variant, so the saved row shows straight away
  const summary: ProductSummary = {
    id: variant.id,
    variationCode: variant.variationCode,
    name: variant.label ? `${product.name} (${variant.label})` : product.name,
    brand: product.brand,
    price: variant.price,
    mrp: variant.mrp,
    rating: variant.rating || product.rating,
    image: variant.images[0] ?? null,
    isOutOfStock: variant.isOutOfStock,
  };
  const quantity = useCartQuantity(variant.id);
  const pending = useCartPending(variant.id);

  function addToCart() {
    cartActions
      .add(cartItem)
      .then(() => toast.show('Added to cart', 'success'))
      .catch((err) => toast.show(errorMessage(err, "Couldn't add that to your cart."), 'error'));
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Gallery */}
        <View style={{ height: imageHeight, backgroundColor: '#FFFFFF' }}>
          <ScrollView
            key={variant.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {(variant.images.length > 0 ? variant.images : [null]).map((uri, index) => (
              <RemoteImage
                key={uri ?? index}
                uri={uri}
                width={width}
                height={imageHeight}
                fit="contain"
                dimmed={variant.isOutOfStock}
                style={styles.galleryImage}
              />
            ))}
          </ScrollView>
          <View style={[styles.topBar, { top: insets.top + Spacing.two }]}>
            <RoundButton icon={Icons.back} label="Go back" onPress={() => router.back()} />
            <View style={styles.topRight}>
              <WishlistButton product={summary} size={38} />
              <RoundButton
                icon={Icons.share}
                label="Share"
                onPress={() => Share.share({ message: `${product.name} — ${formatINR(variant.price)} at CBS Kitchenware` })}
              />
              <RoundButton icon={Icons.cart} label="Cart" onPress={() => router.push('/cart')} />
            </View>
          </View>
          {variant.images.length > 1 && (
            <View style={styles.dots}>
              {variant.images.map((uri, index) => (
                <View
                  key={uri}
                  style={[styles.dot, { backgroundColor: index === imageIndex ? theme.primary : theme.border }, index === imageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          {/* Title */}
          <View style={styles.block}>
            {product.brand && (
              <Pressable
                onPress={() => router.push({ pathname: '/brand/[name]', params: { name: product.brand! } })}
                style={styles.brandLink}>
                <BrandMark name={product.brand} size={28} />
                <AppText variant="captionStrong" color="primary">
                  {product.brand}
                </AppText>
                <Icon name={Icons.chevronRight} color={theme.primary} size={10} weight="bold" />
              </Pressable>
            )}
            <AppText variant="title">{product.name}</AppText>
            <View style={styles.ratingRow}>
              {product.rating > 0 && <RatingBadge rating={product.rating} size="md" />}
              {product.reviewCount > 0 && (
                <AppText variant="caption" color="textSecondary">
                  {product.reviewCount.toLocaleString('en-IN')} ratings
                </AppText>
              )}
              <StockPill outOfStock={variant.isOutOfStock} available={variant.available} />
            </View>
          </View>

          {/* Price */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Price price={variant.price} mrp={variant.mrp} size="lg" />
            <AppText variant="caption" color="textSecondary">
              Inclusive of all taxes
            </AppText>
          </View>

          {/* Variants */}
          {product.variants.length > 1 && (
            <View style={styles.block}>
              <AppText variant="heading">Choose an option</AppText>
              <View style={styles.variants}>
                {product.variants.map((v, index) => {
                  const selected = index === variantIndex;
                  return (
                    <Pressable
                      key={v.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => {
                        setVariantIndex(index);
                        setImageIndex(0);
                      }}
                      style={[
                        styles.variant,
                        { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primarySoft : theme.surface },
                        v.isOutOfStock && styles.variantSoldOut,
                      ]}>
                      <AppText variant="bodyStrong" color={selected ? 'primary' : 'text'} numberOfLines={1}>
                        {v.label ?? `Option ${index + 1}`}
                      </AppText>
                      <AppText variant="caption" color="textSecondary">
                        {v.isOutOfStock ? 'Sold out' : formatINR(v.price)}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Description */}
          {product.description.length > 0 && (
            <View style={styles.block}>
              <AppText variant="heading">About this product</AppText>
              {product.description.map((paragraph, index) => (
                <View key={index} style={styles.highlight}>
                  <View style={[styles.check, { backgroundColor: theme.successSoft }]}>
                    <Icon name={Icons.check} color={theme.success} size={11} weight="bold" />
                  </View>
                  <AppText style={styles.flex}>{paragraph}</AppText>
                </View>
              ))}
            </View>
          )}

          {/* Specifications */}
          {product.attributes.length > 0 && (
            <View style={styles.block}>
              <AppText variant="heading">Specifications</AppText>
              <View style={[styles.specs, { borderColor: theme.border }]}>
                {product.attributes.map((attr, index) => (
                  <View key={attr.name} style={[styles.specRow, { backgroundColor: index % 2 === 0 ? theme.surface : theme.background }]}>
                    <AppText variant="caption" color="textSecondary" style={styles.specLabel}>
                      {attr.name}
                    </AppText>
                    <AppText variant="bodyStrong" style={styles.flex}>
                      {attr.values.join(', ')}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.assurance, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Assurance icon={Icons.truck} title="Fast delivery" text="Dispatched in 24–48 hrs" />
            <Assurance icon={Icons.refresh} title="Easy returns" text="On damaged items" />
            <Assurance icon={Icons.shield} title="Secure payment" text="UPI, cards & COD" />
          </View>
        </View>

        {(related.data?.length ?? 0) > 0 && (
          <View style={styles.rails}>
            <ProductRail title="You may also like" products={related.data!} />
          </View>
        )}
      </ScrollView>

      {/* Sticky purchase bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.bottomInner}>
          {quantity > 0 ? (
            <>
              <AddButton product={cartItem} size="lg" max={variant.available} />
              <View style={styles.flex}>
                <Button title="Go to cart" icon={Icons.cart} onPress={() => router.push('/cart')} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.flex}>
                <AppText variant="heading">{formatINR(variant.price)}</AppText>
                <AppText variant="caption" color="textMuted">
                  {variant.isOutOfStock ? 'Currently unavailable' : 'Free delivery on eligible orders'}
                </AppText>
              </View>
              <View style={styles.addWrap}>
                <Button
                  title={variant.isOutOfStock ? 'Out of stock' : 'Add to cart'}
                  icon={variant.isOutOfStock ? undefined : Icons.cart}
                  disabled={variant.isOutOfStock}
                  loading={pending}
                  onPress={addToCart}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function FloatingBack() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { top: insets.top + Spacing.two }]}>
      <RoundButton icon={Icons.back} label="Go back" onPress={() => router.back()} />
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

function StockPill({ outOfStock, available }: { outOfStock: boolean; available: number | null }) {
  const theme = useTheme();
  const low = !outOfStock && available !== null && available > 0 && available <= 5;
  const config = outOfStock
    ? { label: 'OUT OF STOCK', bg: theme.primarySoft, fg: theme.danger }
    : low
      ? { label: `ONLY ${available} LEFT`, bg: theme.warningSoft, fg: theme.warning }
      : { label: 'IN STOCK', bg: theme.successSoft, fg: theme.success };
  return (
    <View style={[styles.stockPill, { backgroundColor: config.bg }]}>
      <AppText variant="micro" color={config.fg}>
        {config.label}
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
  galleryImage: {
    backgroundColor: '#FFFFFF',
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
  },
  dotActive: {
    width: 18,
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
  brandLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
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
    gap: Spacing.one,
  },
  variants: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  variant: {
    minWidth: 96,
    maxWidth: '48%',
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: 2,
  },
  variantSoldOut: {
    opacity: 0.55,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two + 2,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
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
