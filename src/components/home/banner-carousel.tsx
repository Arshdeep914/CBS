import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { RemoteImage } from '@/components/product/product-image';
import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { banners } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';

const HEIGHT = 168;
const GAP = Spacing.three - 4;

export function BannerCarousel() {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, 900) - Spacing.three * 2;
  const scrollRef = useRef<ScrollView>(null);
  const [active, setActive] = useState(0);

  // Auto-advance every few seconds.
  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => {
        const next = (current + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * (width + GAP), animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [width]);

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={width + GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.track}
        onMomentumScrollEnd={(event) =>
          setActive(Math.round(event.nativeEvent.contentOffset.x / (width + GAP)))
        }>
        {banners.map((banner) => (
          <Pressable
            key={banner.id}
            accessibilityRole="button"
            accessibilityLabel={banner.title.replace('\n', ' ')}
            onPress={() => router.push(banner.href)}
            style={[styles.banner, { width, backgroundColor: banner.color }]}>
            <RemoteImage image={banner.image} width={width * 0.5} height={HEIGHT} style={styles.image} />
            <View style={[styles.fade, { backgroundColor: banner.color }]} />
            <View style={styles.copy}>
              <AppText variant="overline" color="rgba(255,255,255,0.8)">
                {banner.eyebrow}
              </AppText>
              <AppText variant="title" color="#FFFFFF">
                {banner.title}
              </AppText>
              <View style={styles.cta}>
                <AppText variant="captionStrong" color={banner.color}>
                  {banner.cta}
                </AppText>
                <Icon name={Icons.chevronRight} color={banner.color} size={10} weight="bold" />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {banners.map((banner, index) => (
          <View
            key={banner.id}
            style={[
              styles.dot,
              { backgroundColor: index === active ? theme.primary : theme.border },
              index === active && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.two + 2,
  },
  track: {
    gap: GAP,
    paddingHorizontal: Spacing.three,
  },
  banner: {
    height: HEIGHT,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  image: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '50%',
  },
  fade: {
    position: 'absolute',
    right: '38%',
    top: 0,
    bottom: 0,
    width: 60,
    opacity: 0.9,
    transform: [{ skewX: '-12deg' }],
  },
  copy: {
    width: '62%',
    paddingHorizontal: Spacing.four - 4,
    gap: Spacing.two,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    marginTop: 2,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
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
});
