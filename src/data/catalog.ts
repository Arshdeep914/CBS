/**
 * Demo catalogue, used when EXPO_PUBLIC_USE_DEMO_PRODUCTS=true. Brands,
 * products and prices are illustrative only.
 */
import type { ImageKey } from '@/data/images';

export type Subcategory = {
  id: string;
  name: string;
  image: ImageKey;
};

export type Category = {
  id: string;
  name: string;
  tagline: string;
  image: ImageKey;
  /** Soft background behind the category tile. */
  tint: string;
  subcategories: Subcategory[];
};

export type Brand = {
  id: string;
  name: string;
  tagline: string;
  /** Brand colour used for the monogram and brand page header. */
  color: string;
  monogram: string;
  since: number;
  origin: string;
  cover: ImageKey;
  featured?: boolean;
};

export type ProductTag = 'bestseller' | 'new' | 'bulk-deal' | 'trending';

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export type Product = {
  id: string;
  name: string;
  brandId: string;
  categoryId: string;
  subcategoryId: string;
  images: ImageKey[];
  /** Printed retail price. */
  mrp: number;
  /** Selling price. */
  price: number;
  rating: number;
  ratingCount: number;
  tags: ProductTag[];
  stock: StockStatus;
  highlights: string[];
  specs: { label: string; value: string }[];
};

export const categories: Category[] = [
  {
    id: 'cookware',
    name: 'Cookware',
    tagline: 'Cookers, kadais, pans & sets',
    image: 'cookSet5',
    tint: '#FDECEA',
    subcategories: [
      { id: 'pressure-cookers', name: 'Pressure Cookers', image: 'pressureCooker2' },
      { id: 'kadai-woks', name: 'Kadai & Woks', image: 'wok2' },
      { id: 'fry-pans', name: 'Fry Pans', image: 'fryPan1' },
      { id: 'tawa', name: 'Tawa & Skillets', image: 'castIron2' },
      { id: 'pots-handis', name: 'Pots & Handis', image: 'handi1' },
      { id: 'cookware-sets', name: 'Cookware Sets', image: 'cookSet1' },
    ],
  },
  {
    id: 'tools',
    name: 'Kitchen Tools',
    tagline: 'Knives, boards & utensils',
    image: 'knife2',
    tint: '#EAF2FB',
    subcategories: [
      { id: 'knives', name: 'Knives', image: 'knife2' },
      { id: 'boards', name: 'Chopping Boards', image: 'board3' },
      { id: 'ladles-spatulas', name: 'Ladles & Spatulas', image: 'spatula1' },
      { id: 'graters', name: 'Graters & Slicers', image: 'grater3' },
      { id: 'prep-tools', name: 'Prep Tools', image: 'colander1' },
    ],
  },
  {
    id: 'storage',
    name: 'Storage',
    tagline: 'Jars, bottles & flasks',
    image: 'jars1',
    tint: '#EAF6EE',
    subcategories: [
      { id: 'jars', name: 'Jars & Canisters', image: 'jars1' },
      { id: 'spice-racks', name: 'Spice Racks', image: 'spiceJars1' },
      { id: 'bottles', name: 'Water Bottles', image: 'bottle1' },
      { id: 'flasks', name: 'Flasks & Tumblers', image: 'flask1' },
    ],
  },
  {
    id: 'dining',
    name: 'Dining',
    tagline: 'Plates, bowls, glasses & more',
    image: 'plates2',
    tint: '#FFF4E0',
    subcategories: [
      { id: 'plates', name: 'Dinner Plates', image: 'plates1' },
      { id: 'bowls', name: 'Bowls', image: 'bowl2' },
      { id: 'glasses', name: 'Glasses', image: 'glass1' },
      { id: 'cutlery', name: 'Cutlery', image: 'cutlery2' },
      { id: 'cups-mugs', name: 'Cups & Mugs', image: 'mug2' },
      { id: 'serveware', name: 'Serveware', image: 'teapot1' },
    ],
  },
  {
    id: 'appliances',
    name: 'Appliances',
    tagline: 'Mixers, kettles, toasters',
    image: 'toaster1',
    tint: '#EFEAFB',
    subcategories: [
      { id: 'mixers', name: 'Mixers & Blenders', image: 'blender2' },
      { id: 'kettles', name: 'Kettles', image: 'kettle2' },
      { id: 'toasters', name: 'Toasters', image: 'toaster1' },
      { id: 'air-fryers', name: 'Air Fryers', image: 'airFryer1' },
      { id: 'cooktops', name: 'Stoves & Cooktops', image: 'gasStove2' },
    ],
  },
  {
    id: 'bakeware',
    name: 'Bakeware',
    tagline: 'Moulds, trays & tools',
    image: 'bundt1',
    tint: '#FBEFE6',
    subcategories: [
      { id: 'moulds-trays', name: 'Moulds & Trays', image: 'bundt1' },
      { id: 'baking-dishes', name: 'Baking Dishes', image: 'casserole1' },
      { id: 'baking-tools', name: 'Baking Tools', image: 'measuring1' },
    ],
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    tagline: 'Dish racks & scrubbers',
    image: 'dishRack1',
    tint: '#E8F5F6',
    subcategories: [
      { id: 'dish-racks', name: 'Dish Racks', image: 'dishRack1' },
      { id: 'scrubbers', name: 'Scrubbers', image: 'sponge1' },
    ],
  },
];

export const brands: Brand[] = [
  {
    id: 'cbs-signature',
    name: 'CBS Signature',
    tagline: 'Our in-house range, designed for Indian kitchens',
    color: '#D9161C',
    monogram: 'CBS',
    since: 1976,
    origin: 'New Delhi, India',
    cover: 'hangingPots',
    featured: true,
  },
  {
    id: 'steelkraft',
    name: 'SteelKraft',
    tagline: 'Commercial-grade stainless steel',
    color: '#4A5561',
    monogram: 'SK',
    since: 1988,
    origin: 'Ludhiana, India',
    cover: 'stockPot2',
    featured: true,
  },
  {
    id: 'kitchora',
    name: 'Kitchora',
    tagline: 'Non-stick that lasts',
    color: '#E0701B',
    monogram: 'K',
    since: 2009,
    origin: 'Pune, India',
    cover: 'cookSet1',
    featured: true,
  },
  {
    id: 'ferrocraft',
    name: 'Ferro Craft',
    tagline: 'Pre-seasoned cast iron',
    color: '#2E2A27',
    monogram: 'FC',
    since: 1995,
    origin: 'Coimbatore, India',
    cover: 'castIron1',
    featured: true,
  },
  {
    id: 'chefline',
    name: 'Chefline',
    tagline: 'Precision tools for pros',
    color: '#1F5FA8',
    monogram: 'CL',
    since: 2003,
    origin: 'Mumbai, India',
    cover: 'knife3',
    featured: true,
  },
  {
    id: 'aquanest',
    name: 'AquaNest',
    tagline: 'Keep it fresh, keep it cool',
    color: '#0F8A7E',
    monogram: 'AN',
    since: 2012,
    origin: 'Ahmedabad, India',
    cover: 'bottle1',
    featured: true,
  },
  {
    id: 'ceramiq',
    name: 'Ceramiq',
    tagline: 'Handcrafted stoneware & porcelain',
    color: '#9A6B3F',
    monogram: 'C',
    since: 2001,
    origin: 'Khurja, India',
    cover: 'bowl2',
    featured: true,
  },
  {
    id: 'glassique',
    name: 'Glassique',
    tagline: 'Crystal-clear everyday glassware',
    color: '#3B7DD8',
    monogram: 'G',
    since: 1999,
    origin: 'Firozabad, India',
    cover: 'glass2',
  },
  {
    id: 'voltmate',
    name: 'Voltmate',
    tagline: 'Smart kitchen appliances',
    color: '#6A3FC8',
    monogram: 'V',
    since: 2014,
    origin: 'Noida, India',
    cover: 'toaster2',
    featured: true,
  },
  {
    id: 'bakehaus',
    name: 'BakeHaus',
    tagline: 'Bake like a pâtissier',
    color: '#B5487A',
    monogram: 'BH',
    since: 2016,
    origin: 'Bengaluru, India',
    cover: 'bakingTray1',
  },
];

type ProductInput = {
  id: string;
  name: string;
  brand: string;
  category: string;
  sub: string;
  images: ImageKey[];
  mrp: number;
  price: number;
  tags?: ProductTag[];
  rating: number;
  reviews: number;
  stock?: StockStatus;
  highlights: string[];
  material: string;
  size?: string;
  warranty?: string;
};

function product(input: ProductInput): Product {
  const specs = [
    { label: 'Brand', value: brands.find((b) => b.id === input.brand)?.name ?? '' },
    { label: 'Material', value: input.material },
    ...(input.size ? [{ label: 'Size / Capacity', value: input.size }] : []),
    { label: 'Warranty', value: input.warranty ?? '1 year manufacturer' },
  ];

  return {
    id: input.id,
    name: input.name,
    brandId: input.brand,
    categoryId: input.category,
    subcategoryId: input.sub,
    images: input.images,
    mrp: input.mrp,
    price: input.price,
    rating: input.rating,
    ratingCount: input.reviews,
    tags: input.tags ?? [],
    stock: input.stock ?? 'in-stock',
    highlights: input.highlights,
    specs,
  };
}

export const products: Product[] = [
  // Cookware — pressure cookers
  product({
    id: 'cbs-triply-cooker-5l', name: 'Tri-Ply Stainless Steel Pressure Cooker 5 L', brand: 'cbs-signature',
    category: 'cookware', sub: 'pressure-cookers', images: ['pressureCooker2', 'pressureCooker1', 'pressureCooker3'],
    mrp: 3499, price: 2390, tags: ['bestseller'], rating: 4.6, reviews: 1284, material: 'Tri-ply stainless steel',
    size: '5 litres', warranty: '5 years', highlights: ['Induction & gas compatible', 'Gasket-release safety window', 'ISI certified'],
  }),
  product({
    id: 'sk-innerlid-cooker-3l', name: 'Inner-Lid Pressure Cooker 3 L', brand: 'steelkraft',
    category: 'cookware', sub: 'pressure-cookers', images: ['pressureCooker1', 'pressureCooker3'],
    mrp: 2150, price: 1480, tags: ['bulk-deal'], rating: 4.4, reviews: 742, material: 'Stainless steel 304',
    size: '3 litres', highlights: ['Heavy 5 mm sandwich base', 'Inner-lid for extra safety', 'Dishwasher safe'],
  }),
  product({
    id: 'kit-anodised-cooker-2l', name: 'Hard Anodised Pressure Cooker 2 L', brand: 'kitchora',
    category: 'cookware', sub: 'pressure-cookers', images: ['pressureCooker3', 'pressureCooker2'],
    mrp: 2690, price: 1790, rating: 4.3, reviews: 356, material: 'Hard anodised aluminium',
    size: '2 litres', highlights: ['Non-toxic hard anodised body', 'Cooks 30% faster', 'Cool-touch handles'],
  }),
  product({
    id: 'cbs-commercial-cooker-10l', name: 'Commercial Aluminium Pressure Cooker 10 L', brand: 'cbs-signature',
    category: 'cookware', sub: 'pressure-cookers', images: ['pressureCooker1'],
    mrp: 4290, price: 2950, tags: ['trending'], rating: 4.5, reviews: 219, material: 'Food-grade aluminium',
    size: '10 litres', warranty: '5 years', highlights: ['Built for hotels & caterers', 'Double safety valve', 'Extra-thick base'],
  }),
  // Cookware — kadai & woks
  product({
    id: 'kit-nonstick-kadai-24', name: 'Non-Stick Deep Kadai with Glass Lid 24 cm', brand: 'kitchora',
    category: 'cookware', sub: 'kadai-woks', images: ['wok2', 'wok1'],
    mrp: 1899, price: 1080, tags: ['bestseller', 'bulk-deal'], rating: 4.5, reviews: 2156, material: 'Aluminium with 3-layer non-stick',
    size: '24 cm · 2.8 L', highlights: ['PFOA-free coating', 'Toughened glass lid', 'Works on gas & induction'],
  }),
  product({
    id: 'fc-castiron-kadai-26', name: 'Pre-Seasoned Cast Iron Kadai 26 cm', brand: 'ferrocraft',
    category: 'cookware', sub: 'kadai-woks', images: ['wok1', 'castIron1'],
    mrp: 2499, price: 1540, rating: 4.7, reviews: 893, material: 'Cast iron',
    size: '26 cm · 3 L', warranty: 'Lifetime', highlights: ['Naturally non-stick when seasoned', 'Adds iron to food', 'Oven safe'],
  }),
  product({
    id: 'sk-triply-wok-28', name: 'Tri-Ply Stainless Steel Wok 28 cm', brand: 'steelkraft',
    category: 'cookware', sub: 'kadai-woks', images: ['wok2'],
    mrp: 3290, price: 2180, tags: ['new'], rating: 4.4, reviews: 128, material: 'Tri-ply stainless steel',
    size: '28 cm · 3.5 L', warranty: '3 years', highlights: ['Even heat, no hot spots', 'Riveted steel handle', 'Dishwasher safe'],
  }),
  // Cookware — fry pans
  product({
    id: 'kit-granite-frypan-24', name: 'Granite Non-Stick Fry Pan 24 cm', brand: 'kitchora',
    category: 'cookware', sub: 'fry-pans', images: ['fryPan1', 'fryPan2'],
    mrp: 1499, price: 840, tags: ['bestseller'], rating: 4.5, reviews: 3120, material: 'Aluminium with granite coating',
    size: '24 cm', highlights: ['Soft-touch wooden-finish handle', 'Metal-spoon friendly coating', 'Induction base'],
  }),
  product({
    id: 'kit-ceramic-frypan-28', name: 'Ceramic Coated Fry Pan 28 cm', brand: 'kitchora',
    category: 'cookware', sub: 'fry-pans', images: ['fryPan2', 'fryPan1'],
    mrp: 1799, price: 990, tags: ['bulk-deal'], rating: 4.3, reviews: 864, material: 'Aluminium with ceramic coating',
    size: '28 cm', highlights: ['Toxin-free ceramic coat', 'Uses 70% less oil', 'Easy to clean'],
  }),
  product({
    id: 'cbs-nonstick-frypan-lid-26', name: 'Non-Stick Fry Pan with Glass Lid 26 cm', brand: 'cbs-signature',
    category: 'cookware', sub: 'fry-pans', images: ['fryPan4', 'fryPan5'],
    mrp: 1990, price: 1190, tags: ['trending'], rating: 4.4, reviews: 612, material: 'Forged aluminium',
    size: '26 cm', warranty: '2 years', highlights: ['Steam vent glass lid', 'Scratch-resistant', 'Gas & induction'],
  }),
  product({
    id: 'sk-triply-frypan-22', name: 'Tri-Ply Stainless Steel Fry Pan 22 cm', brand: 'steelkraft',
    category: 'cookware', sub: 'fry-pans', images: ['fryPan3'],
    mrp: 2290, price: 1450, rating: 4.2, reviews: 204, material: 'Tri-ply stainless steel',
    size: '22 cm', warranty: '3 years', highlights: ['Chef-grade searing', 'Oven safe to 260°C', 'Lifetime shine'],
  }),
  // Cookware — tawa & skillets
  product({
    id: 'fc-castiron-skillet-25', name: 'Cast Iron Skillet 25 cm', brand: 'ferrocraft',
    category: 'cookware', sub: 'tawa', images: ['castIron1', 'castIron2'],
    mrp: 2199, price: 1340, tags: ['bestseller'], rating: 4.8, reviews: 1540, material: 'Cast iron',
    size: '25 cm', warranty: 'Lifetime', highlights: ['Pre-seasoned with vegetable oil', 'Stove, oven & campfire', 'Retains heat longer'],
  }),
  product({
    id: 'fc-dosa-tawa-30', name: 'Cast Iron Dosa Tawa 30 cm', brand: 'ferrocraft',
    category: 'cookware', sub: 'tawa', images: ['castIron2'],
    mrp: 1899, price: 1150, tags: ['bulk-deal'], rating: 4.6, reviews: 980, material: 'Cast iron',
    size: '30 cm', warranty: 'Lifetime', highlights: ['Crisp, even dosas', 'Double-handle grip', 'Chemical-free'],
  }),
  product({
    id: 'kit-flat-tawa-28', name: 'Non-Stick Flat Tawa 28 cm', brand: 'kitchora',
    category: 'cookware', sub: 'tawa', images: ['fryPan5'],
    mrp: 1099, price: 620, rating: 4.2, reviews: 1204, material: 'Aluminium with non-stick coating',
    size: '28 cm', highlights: ['For rotis, parathas & dosas', 'Bakelite handle', '4 mm thick base'],
  }),
  // Cookware — pots & handis
  product({
    id: 'sk-stockpot-12l', name: 'Stainless Steel Stockpot with Lid 12 L', brand: 'steelkraft',
    category: 'cookware', sub: 'pots-handis', images: ['stockPot1', 'stockPot2'],
    mrp: 2890, price: 1890, rating: 4.5, reviews: 432, material: 'Stainless steel 304',
    size: '12 litres', warranty: '3 years', highlights: ['Encapsulated base', 'Riveted handles', 'Ideal for stocks & biryani'],
  }),
  product({
    id: 'cbs-steel-handi-set3', name: 'Steel Handi Set with Lids (Set of 3)', brand: 'cbs-signature',
    category: 'cookware', sub: 'pots-handis', images: ['handi1'],
    mrp: 2499, price: 1590, tags: ['bestseller'], rating: 4.6, reviews: 1876, material: 'Stainless steel',
    size: '1.5 L, 2 L, 2.5 L', warranty: '3 years', highlights: ['Serve straight from stove', 'Mirror finish', 'Stackable storage'],
  }),
  product({
    id: 'sk-commercial-stockpot-25l', name: 'Commercial Stockpot 25 L', brand: 'steelkraft',
    category: 'cookware', sub: 'pots-handis', images: ['stockPot2', 'stockPot1'],
    mrp: 5490, price: 3790, tags: ['trending'], rating: 4.7, reviews: 186, material: 'Stainless steel 304',
    size: '25 litres', warranty: '5 years', highlights: ['For hotels & caterers', 'Heavy 1.2 mm gauge', 'Heat-resistant handles'],
  }),
  // Cookware — sets
  product({
    id: 'kit-7pc-cookware-set', name: '7-Piece Non-Stick Cookware Set', brand: 'kitchora',
    category: 'cookware', sub: 'cookware-sets', images: ['cookSet1', 'cookSet3'],
    mrp: 6990, price: 4190, tags: ['bestseller', 'bulk-deal'], rating: 4.5, reviews: 2210, material: 'Aluminium with non-stick coating',
    size: 'Fry pan, kadai, tawa, saucepan + 3 tools', highlights: ['Complete starter kitchen', 'Gift-ready box', 'Induction compatible'],
  }),
  product({
    id: 'fc-enamel-dutch-oven', name: 'Enamelled Cast Iron Dutch Oven 4.5 L', brand: 'ferrocraft',
    category: 'cookware', sub: 'cookware-sets', images: ['cookSet2', 'cookSet5'],
    mrp: 7490, price: 4890, tags: ['new'], rating: 4.8, reviews: 314, material: 'Enamelled cast iron',
    size: '4.5 litres', warranty: 'Lifetime', highlights: ['Slow-cook, braise, bake', 'Chip-resistant enamel', 'Self-basting lid'],
  }),
  product({
    id: 'cbs-triply-5pc-set', name: 'Tri-Ply 5-Piece Cookware Set', brand: 'cbs-signature',
    category: 'cookware', sub: 'cookware-sets', images: ['cookSet3', 'cookSet4'],
    mrp: 8990, price: 5890, tags: ['trending'], rating: 4.7, reviews: 540, material: 'Tri-ply stainless steel',
    size: 'Kadai, fry pan, saucepan, casserole, tope', warranty: '10 years', highlights: ['Our premium range', 'Glass lids included', 'Oven safe'],
  }),
  product({
    id: 'kit-casserole-set-3', name: 'Induction Casserole Set (Set of 3)', brand: 'kitchora',
    category: 'cookware', sub: 'cookware-sets', images: ['cookSet5', 'cookSet2'],
    mrp: 4990, price: 2990, rating: 4.3, reviews: 402, material: 'Aluminium with ceramic coating',
    size: '1.5 L, 2.5 L, 3.5 L', highlights: ['Bright, stain-resistant colours', 'Cook & serve', 'Glass lids'],
  }),

  // Kitchen tools
  product({
    id: 'cl-chef-knife-8', name: 'Pro Chef’s Knife 8"', brand: 'chefline',
    category: 'tools', sub: 'knives', images: ['knife1', 'knife4'],
    mrp: 1290, price: 690, tags: ['bestseller'], rating: 4.6, reviews: 1845, material: 'German stainless steel',
    size: '20 cm blade', highlights: ['Razor-sharp 15° edge', 'Full-tang balance', 'Ergonomic grip'],
  }),
  product({
    id: 'cl-knife-set-5', name: '5-Piece Knife Set with Wooden Block', brand: 'chefline',
    category: 'tools', sub: 'knives', images: ['knife2', 'knife3'],
    mrp: 3490, price: 1990, tags: ['trending'], rating: 4.7, reviews: 920, material: 'High-carbon stainless steel',
    size: 'Chef, bread, santoku, utility, paring', warranty: '5 years', highlights: ['Hardwood storage block', 'Rust-resistant', 'Gift-ready'],
  }),
  product({
    id: 'cl-santoku-pair', name: 'Santoku & Utility Knife Pair', brand: 'chefline',
    category: 'tools', sub: 'knives', images: ['knife3', 'knife1'],
    mrp: 1590, price: 890, tags: ['new'], rating: 4.4, reviews: 188, material: 'Stainless steel',
    size: '18 cm + 13 cm', highlights: ['Granton edge prevents sticking', 'Soft-grip handle', 'Dishwasher safe'],
  }),
  product({
    id: 'cbs-veg-knife-6', name: 'Vegetable Knife (Pack of 6)', brand: 'cbs-signature',
    category: 'tools', sub: 'knives', images: ['knife4'],
    mrp: 594, price: 330, tags: ['bulk-deal'], rating: 4.3, reviews: 2730, material: 'Stainless steel',
    size: '10 cm blade', highlights: ['Fast-moving counter item', 'Assorted colours', 'Blade guard included'],
  }),
  product({
    id: 'cl-acacia-board-l', name: 'Acacia Wood Chopping Board — Large', brand: 'chefline',
    category: 'tools', sub: 'boards', images: ['board3', 'board1'],
    mrp: 1490, price: 790, rating: 4.6, reviews: 604, material: 'Acacia wood',
    size: '45 × 30 cm', highlights: ['Knife-friendly surface', 'Juice groove', 'Food-safe oil finish'],
  }),
  product({
    id: 'cl-bamboo-board', name: 'Bamboo Board with Juice Groove', brand: 'chefline',
    category: 'tools', sub: 'boards', images: ['board1'],
    mrp: 990, price: 520, tags: ['bulk-deal'], rating: 4.4, reviews: 1120, material: 'Organic bamboo',
    size: '38 × 25 cm', highlights: ['Anti-bacterial bamboo', 'Lightweight', 'Hanging hole'],
  }),
  product({
    id: 'cl-board-combo', name: 'Prep & Serving Board Combo', brand: 'chefline',
    category: 'tools', sub: 'boards', images: ['board2'],
    mrp: 1290, price: 690, rating: 4.3, reviews: 240, material: 'Teak wood',
    size: '2 boards', highlights: ['Doubles as serving platter', 'Hand-finished', 'Non-slip feet'],
  }),
  product({
    id: 'sk-ladle-set-5', name: 'Stainless Steel Ladle Set (5 pcs)', brand: 'steelkraft',
    category: 'tools', sub: 'ladles-spatulas', images: ['ladle1', 'utensils2'],
    mrp: 1190, price: 640, tags: ['bestseller'], rating: 4.5, reviews: 1508, material: 'Stainless steel',
    size: 'Ladle, skimmer, turner, spoon, masher', highlights: ['One-piece construction', 'Hanging loops', 'Heat-resistant'],
  }),
  product({
    id: 'cl-neem-spatula-4', name: 'Neem Wood Spatula Set (4 pcs)', brand: 'chefline',
    category: 'tools', sub: 'ladles-spatulas', images: ['spatula1', 'spatula3'],
    mrp: 690, price: 340, tags: ['bulk-deal'], rating: 4.4, reviews: 2380, material: 'Neem wood',
    size: '30 cm', highlights: ['Safe for non-stick', 'Naturally anti-bacterial', 'No chemicals or lacquer'],
  }),
  product({
    id: 'cbs-wooden-spoons-holder', name: 'Wooden Spoons with Ceramic Holder', brand: 'cbs-signature',
    category: 'tools', sub: 'ladles-spatulas', images: ['spatula2', 'spatula3'],
    mrp: 899, price: 470, tags: ['new'], rating: 4.5, reviews: 342, material: 'Beech wood & ceramic',
    size: '6 tools + holder', highlights: ['Countertop-ready', 'Great gifting SKU', 'Smooth sanded finish'],
  }),
  product({
    id: 'sk-hanging-utensil-7', name: 'Hanging Utensil Set with Rail (7 pcs)', brand: 'steelkraft',
    category: 'tools', sub: 'ladles-spatulas', images: ['utensils1', 'utensils2'],
    mrp: 2490, price: 1390, rating: 4.6, reviews: 276, material: 'Stainless steel',
    size: '60 cm rail + 6 tools', warranty: '2 years', highlights: ['Wall-mount rail included', 'Mirror polish', 'Saves counter space'],
  }),
  product({
    id: 'cl-box-grater', name: '4-Sided Box Grater', brand: 'chefline',
    category: 'tools', sub: 'graters', images: ['grater3', 'grater2'],
    mrp: 699, price: 360, tags: ['bestseller'], rating: 4.5, reviews: 1987, material: 'Stainless steel',
    size: '24 cm tall', highlights: ['Coarse, fine, slice & zest', 'Non-slip base', 'Etched razor blades'],
  }),
  product({
    id: 'cl-multi-grater', name: 'Multi Grater & Slicer', brand: 'chefline',
    category: 'tools', sub: 'graters', images: ['grater1', 'grater2'],
    mrp: 549, price: 290, tags: ['bulk-deal'], rating: 4.2, reviews: 864, material: 'Stainless steel & ABS',
    size: '3 blades', highlights: ['Interchangeable blades', 'Hand guard', 'Dishwasher safe'],
  }),
  product({
    id: 'cl-balloon-whisk', name: 'Balloon Whisk 12"', brand: 'chefline',
    category: 'tools', sub: 'prep-tools', images: ['whisk1'],
    mrp: 399, price: 190, rating: 4.4, reviews: 720, material: 'Stainless steel',
    size: '30 cm', highlights: ['11 sturdy wires', 'Sealed handle', 'Whips cream fast'],
  }),
  product({
    id: 'cbs-rolling-pin', name: 'Sheesham Wood Rolling Pin (Belan)', brand: 'cbs-signature',
    category: 'tools', sub: 'prep-tools', images: ['rollingPin1'],
    mrp: 349, price: 170, tags: ['bestseller'], rating: 4.6, reviews: 4120, material: 'Sheesham wood',
    size: '38 cm', highlights: ['Perfect round rotis', 'Balanced weight', 'Smooth polished finish'],
  }),
  product({
    id: 'cl-kitchen-scissors', name: 'Heavy-Duty Kitchen Scissors', brand: 'chefline',
    category: 'tools', sub: 'prep-tools', images: ['scissors1'],
    mrp: 499, price: 240, rating: 4.3, reviews: 540, material: 'Stainless steel',
    size: '21 cm', highlights: ['Bottle opener & nutcracker', 'Micro-serrated blades', 'Comfort grip'],
  }),
  product({
    id: 'sk-colander-24', name: 'Stainless Steel Colander 24 cm', brand: 'steelkraft',
    category: 'tools', sub: 'prep-tools', images: ['colander1'],
    mrp: 799, price: 420, tags: ['new'], rating: 4.4, reviews: 310, material: 'Stainless steel',
    size: '24 cm · 4 L', highlights: ['Fine-mesh drainage', 'Stable ring base', 'Side handles'],
  }),

  // Storage
  product({
    id: 'an-spice-jar-6', name: 'Glass Spice Jar Set with Rack (6 pcs)', brand: 'aquanest',
    category: 'storage', sub: 'spice-racks', images: ['spiceJars1', 'spiceJars2'],
    mrp: 999, price: 540, tags: ['bestseller'], rating: 4.5, reviews: 1780, material: 'Glass & stainless steel',
    size: '6 × 120 ml', highlights: ['Shake & pour lids', 'Wall or counter rack', 'Airtight seal'],
  }),
  product({
    id: 'an-pantry-jars-12', name: 'Pantry Jar Set (12 pcs)', brand: 'aquanest',
    category: 'storage', sub: 'spice-racks', images: ['spiceJars2', 'jars3'],
    mrp: 2490, price: 1390, tags: ['trending'], rating: 4.6, reviews: 520, material: 'Borosilicate glass & bamboo',
    size: '12 × 500 ml', highlights: ['Bamboo lids with seals', 'Stackable', 'Labels included'],
  }),
  product({
    id: 'an-airtight-jars-3', name: 'Airtight Glass Jars 1 L (Pack of 3)', brand: 'aquanest',
    category: 'storage', sub: 'jars', images: ['jars1', 'jars2'],
    mrp: 1290, price: 720, tags: ['bulk-deal'], rating: 4.4, reviews: 1210, material: 'Borosilicate glass',
    size: '3 × 1 litre', highlights: ['Clip-lock silicone seal', 'Microwave safe jars', 'BPA free'],
  }),
  product({
    id: 'an-canister-1-5l', name: 'Borosilicate Canister 1.5 L', brand: 'aquanest',
    category: 'storage', sub: 'jars', images: ['jars2'],
    mrp: 690, price: 380, rating: 4.3, reviews: 432, material: 'Borosilicate glass',
    size: '1.5 litres', highlights: ['Wide mouth', 'Steel screw lid', 'Freezer to oven safe'],
  }),
  product({
    id: 'an-meal-prep-3', name: 'Glass Meal-Prep Containers (Set of 3)', brand: 'aquanest',
    category: 'storage', sub: 'jars', images: ['mealPrep1'],
    mrp: 1190, price: 650, tags: ['new'], rating: 4.5, reviews: 286, material: 'Tempered glass',
    size: '3 × 850 ml', highlights: ['Leak-proof lids', 'Office lunch favourite', 'Microwave safe'],
  }),
  product({
    id: 'an-insulated-bottle-750', name: 'Insulated Steel Bottle 750 ml', brand: 'aquanest',
    category: 'storage', sub: 'bottles', images: ['bottle2', 'bottle3'],
    mrp: 899, price: 460, tags: ['bestseller', 'bulk-deal'], rating: 4.6, reviews: 5210, material: 'Double-wall stainless steel',
    size: '750 ml', highlights: ['Hot 12 h, cold 24 h', 'Leak-proof cap', 'Powder-coated finish'],
  }),
  product({
    id: 'an-kids-bottle-3', name: 'Kids Steel Bottles 500 ml (Pack of 3)', brand: 'aquanest',
    category: 'storage', sub: 'bottles', images: ['bottle1'],
    mrp: 1790, price: 960, tags: ['trending'], rating: 4.5, reviews: 860, material: 'Stainless steel',
    size: '3 × 500 ml', highlights: ['School-bag friendly', 'Assorted pastel colours', 'Easy-grip'],
  }),
  product({
    id: 'an-sport-tumbler-900', name: 'Sport Tumbler 900 ml', brand: 'aquanest',
    category: 'storage', sub: 'flasks', images: ['bottle3', 'bottle2'],
    mrp: 1090, price: 590, rating: 4.3, reviews: 390, material: 'Stainless steel',
    size: '900 ml', highlights: ['Flip straw lid', 'Car cup-holder fit', 'Sweat-free'],
  }),
  product({
    id: 'an-vacuum-flask-1l', name: 'Vacuum Flask 1 L', brand: 'aquanest',
    category: 'storage', sub: 'flasks', images: ['flask1'],
    mrp: 1390, price: 760, tags: ['bulk-deal'], rating: 4.4, reviews: 710, material: 'Stainless steel',
    size: '1 litre', highlights: ['Keeps tea hot all day', 'Cup lid included', 'Unbreakable'],
  }),
  product({
    id: 'gq-glass-bottle-1l', name: 'Glass Water Bottle 1 L', brand: 'glassique',
    category: 'storage', sub: 'bottles', images: ['glassBottle1'],
    mrp: 490, price: 240, rating: 4.2, reviews: 980, material: 'Soda-lime glass',
    size: '1 litre', highlights: ['Fridge door fit', 'Food-grade cap', 'No plastic taste'],
  }),
  product({
    id: 'gq-milk-bottle-2', name: 'Glass Milk Bottles 500 ml (Pack of 2)', brand: 'glassique',
    category: 'storage', sub: 'bottles', images: ['glassBottle2'],
    mrp: 590, price: 310, tags: ['new'], rating: 4.4, reviews: 210, material: 'Glass',
    size: '2 × 500 ml', highlights: ['Classic dairy style', 'Swing-top seal', 'Dishwasher safe'],
  }),

  // Dining
  product({
    id: 'cq-stoneware-plates-6', name: 'Stoneware Dinner Plates 10.5" (Set of 6)', brand: 'ceramiq',
    category: 'dining', sub: 'plates', images: ['plates1', 'plates2'],
    mrp: 2990, price: 1690, tags: ['bestseller'], rating: 4.6, reviews: 1320, material: 'Stoneware',
    size: '27 cm', highlights: ['Microwave & dishwasher safe', 'Chip-resistant glaze', 'Restaurant grade'],
  }),
  product({
    id: 'cq-porcelain-plates-12', name: 'Porcelain Plate Stack (12 pcs)', brand: 'ceramiq',
    category: 'dining', sub: 'plates', images: ['plates2', 'plates1'],
    mrp: 3990, price: 2290, tags: ['bulk-deal'], rating: 4.5, reviews: 640, material: 'Fine porcelain',
    size: '6 dinner + 6 quarter plates', highlights: ['Bright white finish', 'Hotel & banquet favourite', 'Stack-stable rims'],
  }),
  product({
    id: 'cq-platter-bowls', name: 'Serving Platter & Bowls Set', brand: 'ceramiq',
    category: 'dining', sub: 'plates', images: ['plates3'],
    mrp: 2490, price: 1390, rating: 4.4, reviews: 188, material: 'Stoneware',
    size: '1 platter + 2 bowls', highlights: ['Earthy two-tone glaze', 'Oven safe', 'Gift box'],
  }),
  product({
    id: 'cq-soup-bowls-6', name: 'White Soup Bowls (Set of 6)', brand: 'ceramiq',
    category: 'dining', sub: 'bowls', images: ['bowl1', 'bowl3'],
    mrp: 1490, price: 820, tags: ['bestseller'], rating: 4.5, reviews: 1060, material: 'Porcelain',
    size: '400 ml', highlights: ['Classic white', 'Microwave safe', 'Stackable'],
  }),
  product({
    id: 'cq-pastel-bowls-6', name: 'Handcrafted Pastel Bowls (Set of 6)', brand: 'ceramiq',
    category: 'dining', sub: 'bowls', images: ['bowl2'],
    mrp: 1990, price: 1090, tags: ['trending', 'new'], rating: 4.7, reviews: 420, material: 'Hand-glazed ceramic',
    size: '350 ml', highlights: ['Each piece unique', 'Instagram-favourite colours', 'Lead-free glaze'],
  }),
  product({
    id: 'cq-matte-bowls-4', name: 'Matte Black Bowls (Set of 4)', brand: 'ceramiq',
    category: 'dining', sub: 'bowls', images: ['bowl4'],
    mrp: 1290, price: 690, rating: 4.4, reviews: 256, material: 'Stoneware',
    size: '500 ml', highlights: ['Modern matte finish', 'Scratch resistant', 'Café style'],
  }),
  product({
    id: 'sk-mixing-bowls-3', name: 'Steel Mixing Bowls (Set of 3)', brand: 'steelkraft',
    category: 'dining', sub: 'bowls', images: ['steelBowl1'],
    mrp: 990, price: 530, tags: ['bulk-deal'], rating: 4.5, reviews: 890, material: 'Stainless steel',
    size: '1 L, 2 L, 3 L', highlights: ['Nesting design', 'Non-slip base', 'Mirror finish'],
  }),
  product({
    id: 'gq-tumblers-6', name: 'Tumbler Glasses 300 ml (Set of 6)', brand: 'glassique',
    category: 'dining', sub: 'glasses', images: ['glass1', 'glass3'],
    mrp: 690, price: 360, tags: ['bestseller', 'bulk-deal'], rating: 4.4, reviews: 3200, material: 'Toughened glass',
    size: '300 ml', highlights: ['Everyday essential', 'Dishwasher safe', 'Heavy base'],
  }),
  product({
    id: 'gq-crystal-glasses-6', name: 'Crystal Clear Glasses 350 ml (Set of 6)', brand: 'glassique',
    category: 'dining', sub: 'glasses', images: ['glass2', 'glass1'],
    mrp: 890, price: 470, rating: 4.5, reviews: 740, material: 'Lead-free crystal glass',
    size: '350 ml', highlights: ['Brilliant clarity', 'Thin rim', 'Gift box'],
  }),
  product({
    id: 'sk-mirror-cutlery-24', name: 'Mirror Finish Cutlery Set (24 pcs)', brand: 'steelkraft',
    category: 'dining', sub: 'cutlery', images: ['cutlery2', 'cutlery1'],
    mrp: 2490, price: 1390, tags: ['trending'], rating: 4.6, reviews: 610, material: 'Stainless steel 18/10',
    size: '6 each: spoons, forks, knives, tea spoons', warranty: '5 years', highlights: ['Rust-proof', 'Weighty premium feel', 'Gift box'],
  }),
  product({
    id: 'sk-spoon-fork-12', name: 'Classic Spoon & Fork Set (12 pcs)', brand: 'steelkraft',
    category: 'dining', sub: 'cutlery', images: ['cutlery1'],
    mrp: 990, price: 520, tags: ['bulk-deal'], rating: 4.3, reviews: 1480, material: 'Stainless steel',
    size: '6 spoons + 6 forks', highlights: ['Everyday dining', 'Dishwasher safe', 'Fast mover'],
  }),
  product({
    id: 'cl-wooden-cutlery', name: 'Wooden Cutlery Set (4 pcs)', brand: 'chefline',
    category: 'dining', sub: 'cutlery', images: ['cutlery3'],
    mrp: 790, price: 410, tags: ['new'], rating: 4.2, reviews: 150, material: 'Acacia wood',
    size: 'Spoon, fork, knife, tea spoon', highlights: ['Eco-friendly', 'Travel pouch', 'Hand-finished'],
  }),
  product({
    id: 'cq-coffee-mugs-6', name: 'Coffee Mugs 350 ml (Set of 6)', brand: 'ceramiq',
    category: 'dining', sub: 'cups-mugs', images: ['mug2', 'mug1'],
    mrp: 1490, price: 790, tags: ['bestseller'], rating: 4.5, reviews: 1690, material: 'Ceramic',
    size: '350 ml', highlights: ['Microwave safe', 'Comfortable handle', 'Classic white'],
  }),
  product({
    id: 'cq-cup-saucer-12', name: 'Cup & Saucer Set (12 pcs)', brand: 'ceramiq',
    category: 'dining', sub: 'cups-mugs', images: ['cups1', 'mug3'],
    mrp: 1790, price: 960, rating: 4.4, reviews: 420, material: 'Bone china',
    size: '6 cups + 6 saucers', highlights: ['Fine bone china', 'Gold rim', 'Gift box'],
  }),
  product({
    id: 'cq-vintage-tea-set', name: 'Vintage Floral Tea Set (15 pcs)', brand: 'ceramiq',
    category: 'dining', sub: 'serveware', images: ['teaSet1', 'teapot1'],
    mrp: 3490, price: 1990, tags: ['trending'], rating: 4.7, reviews: 290, material: 'Bone china',
    size: 'Teapot, sugar pot, milk jug, 6 cups & saucers', highlights: ['Heirloom floral print', 'Wedding gifting favourite', 'Hand-painted gold'],
  }),
  product({
    id: 'cq-porcelain-teapot', name: 'Porcelain Teapot 1 L', brand: 'ceramiq',
    category: 'dining', sub: 'serveware', images: ['teapot1', 'teapot2'],
    mrp: 990, price: 540, rating: 4.4, reviews: 380, material: 'Porcelain',
    size: '1 litre', highlights: ['Steel infuser included', 'Drip-free spout', 'Serves 4–5'],
  }),
  product({
    id: 'cq-wooden-trays-2', name: 'Wooden Serving Trays (Set of 2)', brand: 'ceramiq',
    category: 'dining', sub: 'serveware', images: ['tray1', 'tray2'],
    mrp: 1490, price: 790, tags: ['new'], rating: 4.5, reviews: 176, material: 'Mango wood',
    size: '40 cm + 30 cm', highlights: ['Carved handles', 'Food-safe finish', 'Nest together'],
  }),

  // Appliances
  product({
    id: 'vm-mixer-750', name: '750 W Mixer Grinder with 3 Jars', brand: 'voltmate',
    category: 'appliances', sub: 'mixers', images: ['blender2', 'blender1'],
    mrp: 4990, price: 3190, tags: ['bestseller'], rating: 4.5, reviews: 4380, material: 'ABS body, steel jars',
    size: '1.5 L, 1 L, 0.4 L jars', warranty: '2 years + 5 years on motor', highlights: ['Copper motor', 'Overload protection', '3-speed + pulse'],
  }),
  product({
    id: 'vm-blender-1000', name: 'Power Blender 1000 W', brand: 'voltmate',
    category: 'appliances', sub: 'mixers', images: ['blender1', 'blender2'],
    mrp: 5990, price: 3790, tags: ['new'], rating: 4.4, reviews: 610, material: 'Tritan jar, steel blades',
    size: '1.8 litres', warranty: '2 years', highlights: ['Crushes ice in seconds', 'Smoothie preset', 'BPA-free jar'],
  }),
  product({
    id: 'vm-food-processor-800', name: 'Food Processor 800 W', brand: 'voltmate',
    category: 'appliances', sub: 'mixers', images: ['foodProcessor1'],
    mrp: 7990, price: 5190, rating: 4.3, reviews: 240, material: 'ABS & stainless steel',
    size: '2.1 L bowl', warranty: '2 years', highlights: ['Kneads dough', '8 attachments', 'Chops, slices, grates'],
  }),
  product({
    id: 'vm-hand-mixer-300', name: 'Hand Mixer 300 W', brand: 'voltmate',
    category: 'appliances', sub: 'mixers', images: ['handMixer1'],
    mrp: 1990, price: 1190, tags: ['bulk-deal'], rating: 4.3, reviews: 870, material: 'ABS & stainless steel',
    size: '5 speeds', warranty: '2 years', highlights: ['Beaters + dough hooks', 'Turbo button', 'Lightweight'],
  }),
  product({
    id: 'vm-glass-kettle-1-7', name: 'Glass Electric Kettle 1.7 L', brand: 'voltmate',
    category: 'appliances', sub: 'kettles', images: ['kettle2'],
    mrp: 1990, price: 1190, tags: ['bestseller', 'bulk-deal'], rating: 4.5, reviews: 2890, material: 'Borosilicate glass',
    size: '1.7 litres', warranty: '2 years', highlights: ['Blue LED glow', 'Auto shut-off', '360° cordless base'],
  }),
  product({
    id: 'sk-whistling-kettle', name: 'Stovetop Whistling Kettle 2.5 L', brand: 'steelkraft',
    category: 'appliances', sub: 'kettles', images: ['kettle1'],
    mrp: 1490, price: 820, rating: 4.4, reviews: 520, material: 'Stainless steel',
    size: '2.5 litres', highlights: ['Loud whistle', 'Induction base', 'Cool-grip handle'],
  }),
  product({
    id: 'vm-toaster-2', name: '2-Slice Pop-Up Toaster', brand: 'voltmate',
    category: 'appliances', sub: 'toasters', images: ['toaster1'],
    mrp: 2290, price: 1390, tags: ['trending'], rating: 4.4, reviews: 1320, material: 'Stainless steel & ABS',
    size: '800 W', warranty: '2 years', highlights: ['7 browning levels', 'Defrost & reheat', 'Removable crumb tray'],
  }),
  product({
    id: 'vm-toaster-4', name: '4-Slice Steel Toaster', brand: 'voltmate',
    category: 'appliances', sub: 'toasters', images: ['toaster2'],
    mrp: 3490, price: 2190, rating: 4.3, reviews: 310, material: 'Brushed stainless steel',
    size: '1500 W', warranty: '2 years', highlights: ['Dual independent slots', 'Extra-wide for buns', 'Café grade'],
  }),
  product({
    id: 'vm-air-fryer-4-2', name: 'Digital Air Fryer 4.2 L', brand: 'voltmate',
    category: 'appliances', sub: 'air-fryers', images: ['airFryer1'],
    mrp: 7990, price: 4990, tags: ['bestseller', 'trending'], rating: 4.6, reviews: 3560, material: 'ABS with non-stick basket',
    size: '4.2 litres', warranty: '2 years', highlights: ['8 presets', 'Up to 90% less oil', 'Touch panel'],
  }),
  product({
    id: 'vm-induction-2000', name: 'Induction Cooktop 2000 W', brand: 'voltmate',
    category: 'appliances', sub: 'cooktops', images: ['cooktop1'],
    mrp: 3290, price: 2090, tags: ['bulk-deal'], rating: 4.3, reviews: 1980, material: 'Crystal glass top',
    size: '2000 W', warranty: '1 year', highlights: ['Indian menu presets', 'Auto-off timer', 'Voltage protection'],
  }),
  product({
    id: 'cbs-gas-stove-3', name: '3-Burner Glass Top Gas Stove', brand: 'cbs-signature',
    category: 'appliances', sub: 'cooktops', images: ['gasStove2', 'gasStove3'],
    mrp: 6990, price: 4490, tags: ['trending'], rating: 4.5, reviews: 740, material: 'Toughened glass & brass burners',
    size: '3 burners', warranty: '2 years', highlights: ['ISI certified', 'Brass burners', 'Spill-proof design'],
  }),
  product({
    id: 'cbs-gas-stove-2', name: '2-Burner Stainless Steel Gas Stove', brand: 'cbs-signature',
    category: 'appliances', sub: 'cooktops', images: ['gasStove1', 'gasStove3'],
    mrp: 3990, price: 2590, tags: ['bestseller'], rating: 4.4, reviews: 1650, material: 'Stainless steel',
    size: '2 burners', warranty: '2 years', highlights: ['Rust-proof body', 'Tri-pin burners', 'Fast mover'],
    stock: 'low-stock',
  }),

  // Bakeware
  product({
    id: 'bh-bundt-mould', name: 'Copper-Finish Bundt Cake Mould', brand: 'bakehaus',
    category: 'bakeware', sub: 'moulds-trays', images: ['bundt1'],
    mrp: 1290, price: 690, tags: ['new'], rating: 4.5, reviews: 210, material: 'Carbon steel',
    size: '24 cm', highlights: ['Heritage fluted design', 'Non-stick release', 'Oven safe to 230°C'],
  }),
  product({
    id: 'bh-baking-tray', name: 'Carbon Steel Baking Tray', brand: 'bakehaus',
    category: 'bakeware', sub: 'moulds-trays', images: ['bakingTray1'],
    mrp: 890, price: 460, tags: ['bulk-deal'], rating: 4.4, reviews: 560, material: 'Carbon steel',
    size: '40 × 28 cm', highlights: ['Warp-resistant', 'Rolled edges', 'For cookies & pastries'],
  }),
  product({
    id: 'bh-ceramic-baking-dish', name: 'Ceramic Baking Dish 2 L', brand: 'bakehaus',
    category: 'bakeware', sub: 'baking-dishes', images: ['casserole1', 'casserole2'],
    mrp: 1490, price: 820, tags: ['trending'], rating: 4.6, reviews: 390, material: 'Stoneware',
    size: '2 litres', highlights: ['Oven to table', 'Retro floral print', 'Easy-grip handles'],
  }),
  product({
    id: 'bh-round-casserole', name: 'Round Oven Casserole', brand: 'bakehaus',
    category: 'bakeware', sub: 'baking-dishes', images: ['casserole2'],
    mrp: 1290, price: 710, rating: 4.3, reviews: 180, material: 'Ceramic',
    size: '1.6 litres', highlights: ['Microwave & oven safe', 'Even baking', 'Dishwasher safe'],
  }),
  product({
    id: 'bh-measuring-set', name: 'Measuring Cups & Spoons Set', brand: 'bakehaus',
    category: 'bakeware', sub: 'baking-tools', images: ['measuring1'],
    mrp: 590, price: 290, tags: ['bestseller'], rating: 4.5, reviews: 1240, material: 'Stainless steel',
    size: '4 cups + 4 spoons', highlights: ['Engraved markings', 'Ring holder', 'Accurate measures'],
  }),
  product({
    id: 'bh-silicone-whisk', name: 'Silicone Coated Whisk', brand: 'bakehaus',
    category: 'bakeware', sub: 'baking-tools', images: ['whisk2'],
    mrp: 349, price: 170, rating: 4.2, reviews: 330, material: 'Silicone & steel',
    size: '25 cm', highlights: ['Safe for non-stick', 'Heat resistant', 'Easy clean'],
  }),
  product({
    id: 'bh-pastry-pin', name: 'French Pastry Rolling Pin', brand: 'bakehaus',
    category: 'bakeware', sub: 'baking-tools', images: ['rollingPin2'],
    mrp: 499, price: 260, rating: 4.4, reviews: 210, material: 'Beech wood',
    size: '45 cm', highlights: ['Tapered ends', 'Precise control', 'Smooth grain'],
    stock: 'out-of-stock',
  }),

  // Cleaning
  product({
    id: 'sk-dish-rack-2tier', name: '2-Tier Dish Drying Rack', brand: 'steelkraft',
    category: 'cleaning', sub: 'dish-racks', images: ['dishRack1'],
    mrp: 2490, price: 1390, tags: ['bestseller'], rating: 4.5, reviews: 980, material: 'Stainless steel',
    size: '55 × 30 × 40 cm', warranty: '2 years', highlights: ['Cutlery holder', 'Drip tray', 'Rust-proof'],
  }),
  product({
    id: 'sk-over-sink-rack', name: 'Over-the-Sink Dish Rack', brand: 'steelkraft',
    category: 'cleaning', sub: 'dish-racks', images: ['dishRack2'],
    mrp: 3290, price: 1990, tags: ['new'], rating: 4.6, reviews: 220, material: 'Stainless steel',
    size: 'Adjustable 65–90 cm', warranty: '2 years', highlights: ['Saves counter space', 'Knife & board slots', 'No-drill setup'],
  }),
  product({
    id: 'cbs-scrub-sponge-12', name: 'Scrub Sponges (Pack of 12)', brand: 'cbs-signature',
    category: 'cleaning', sub: 'scrubbers', images: ['sponge1'],
    mrp: 360, price: 180, tags: ['bulk-deal', 'bestseller'], rating: 4.3, reviews: 6200, material: 'Polyurethane foam',
    size: '12 sponges', highlights: ['Non-scratch', 'Fast-moving consumable', 'Long-lasting'],
  }),
];

const productMap = new Map(products.map((p) => [p.id, p]));
const brandMap = new Map(brands.map((b) => [b.id, b]));
const categoryMap = new Map(categories.map((c) => [c.id, c]));

export const getProduct = (id: string) => productMap.get(id);
export const getBrand = (id: string) => brandMap.get(id);
export const getCategory = (id: string) => categoryMap.get(id);

export function getSubcategory(categoryId: string, subcategoryId: string) {
  return getCategory(categoryId)?.subcategories.find((s) => s.id === subcategoryId);
}

export const productsByBrand = (brandId: string) => products.filter((p) => p.brandId === brandId);
export const productsByCategory = (categoryId: string) =>
  products.filter((p) => p.categoryId === categoryId);
export const productsByTag = (tag: ProductTag) => products.filter((p) => p.tags.includes(tag));

export function similarProducts(product: Product, limit = 8) {
  return products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
    .sort((a, b) => Number(b.subcategoryId === product.subcategoryId) - Number(a.subcategoryId === product.subcategoryId))
    .slice(0, limit);
}
