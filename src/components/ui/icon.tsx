import { SymbolView, type SymbolViewProps } from 'expo-symbols';

type SymbolNames = Exclude<SymbolViewProps['name'], string>;

export type IconName = {
  /** SF Symbol name (iOS). */
  ios: NonNullable<SymbolNames['ios']>;
  /** Material Symbol name (Android and web). */
  android: NonNullable<SymbolNames['android']>;
};

type IconProps = {
  name: IconName;
  color: string;
  size?: number;
  weight?: SymbolViewProps['weight'];
};

export function Icon({ name, color, size = 20, weight }: IconProps) {
  return (
    <SymbolView
      name={{ ios: name.ios, android: name.android, web: name.android }}
      size={size}
      tintColor={color}
      weight={weight}
    />
  );
}

/** Icons used across the app, so each platform's name is written once. */
export const Icons = {
  mail: { ios: 'envelope', android: 'mail' },
  lock: { ios: 'lock', android: 'lock' },
  eye: { ios: 'eye', android: 'visibility' },
  eyeOff: { ios: 'eye.slash', android: 'visibility_off' },
  shield: { ios: 'checkmark.shield', android: 'verified_user' },
  alert: { ios: 'exclamationmark.circle', android: 'error' },
  hourglass: { ios: 'hourglass', android: 'hourglass_top' },
  phone: { ios: 'iphone', android: 'smartphone' },
  person: { ios: 'person', android: 'person' },
  clock: { ios: 'clock', android: 'schedule' },
  system: { ios: 'gearshape', android: 'settings' },
  check: { ios: 'checkmark', android: 'check' },
  checkCircle: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh' },
  back: { ios: 'chevron.left', android: 'arrow_back' },
  close: { ios: 'xmark', android: 'close' },
  search: { ios: 'magnifyingglass', android: 'search' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  chevronDown: { ios: 'chevron.down', android: 'keyboard_arrow_down' },
  location: { ios: 'mappin.and.ellipse', android: 'location_on' },
  cart: { ios: 'cart', android: 'shopping_cart' },
  home: { ios: 'house', android: 'home' },
  homeFill: { ios: 'house.fill', android: 'home' },
  categories: { ios: 'square.grid.2x2', android: 'grid_view' },
  categoriesFill: { ios: 'square.grid.2x2.fill', android: 'grid_view' },
  orders: { ios: 'bag', android: 'shopping_bag' },
  ordersFill: { ios: 'bag.fill', android: 'shopping_bag' },
  account: { ios: 'person.crop.circle', android: 'account_circle' },
  accountFill: { ios: 'person.crop.circle.fill', android: 'account_circle' },
  star: { ios: 'star.fill', android: 'star' },
  filter: { ios: 'line.3.horizontal.decrease', android: 'tune' },
  sort: { ios: 'arrow.up.arrow.down', android: 'swap_vert' },
  plus: { ios: 'plus', android: 'add' },
  minus: { ios: 'minus', android: 'remove' },
  trash: { ios: 'trash', android: 'delete' },
  tag: { ios: 'tag', android: 'sell' },
  percent: { ios: 'percent', android: 'percent' },
  truck: { ios: 'truck.box', android: 'local_shipping' },
  box: { ios: 'shippingbox', android: 'inventory_2' },
  call: { ios: 'phone', android: 'call' },
  support: { ios: 'headphones', android: 'support_agent' },
  invoice: { ios: 'doc.text', android: 'receipt_long' },
  document: { ios: 'doc', android: 'description' },
  store: { ios: 'storefront', android: 'storefront' },
  rupee: { ios: 'indianrupeesign.circle', android: 'currency_rupee' },
  bank: { ios: 'building.columns', android: 'account_balance' },
  wallet: { ios: 'wallet.pass', android: 'account_balance_wallet' },
  flame: { ios: 'flame.fill', android: 'local_fire_department' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome' },
  history: { ios: 'clock.arrow.circlepath', android: 'history' },
  trending: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  bell: { ios: 'bell', android: 'notifications' },
  help: { ios: 'questionmark.circle', android: 'help' },
  info: { ios: 'info.circle', android: 'info' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  edit: { ios: 'pencil', android: 'edit' },
  bolt: { ios: 'bolt.fill', android: 'bolt' },
  verified: { ios: 'checkmark.seal.fill', android: 'verified' },
  premium: { ios: 'crown.fill', android: 'workspace_premium' },
  gift: { ios: 'gift', android: 'redeem' },
} satisfies Record<string, IconName>;
