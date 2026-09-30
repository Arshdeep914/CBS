/** Demo trade account shown after sign-in. Replace with the signed-in user's profile from the API. */
export const demoAccount = {
  businessName: 'Sharma Kitchen Stores',
  ownerName: 'Rahul Sharma',
  customerId: 'CBS-DL-20417',
  gstin: '07ABCPS1234F1Z5',
  phone: '+91 98110 45672',
  tier: 'Gold Partner',
  memberSince: 2019,
  addresses: [
    {
      id: 'main',
      label: 'Main store',
      line1: 'Shop 14, Sadar Bazar Road',
      line2: 'Karol Bagh, New Delhi 110005',
      isDefault: true,
    },
    {
      id: 'warehouse',
      label: 'Warehouse',
      line1: 'Plot 22, Okhla Industrial Area Phase II',
      line2: 'New Delhi 110020',
      isDefault: false,
    },
  ],
};

export type Address = (typeof demoAccount.addresses)[number];
