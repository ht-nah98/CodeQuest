import { z } from 'zod';

export const SHOP_ITEM_KINDS = ['skin', 'pen', 'fx', 'music', 'bonus-level'] as const;
export type ShopItemKind = (typeof SHOP_ITEM_KINDS)[number];

/** Something a child can buy with coins (prices: docs/product/rewards-economy.md §2). */
export const ShopItemSchema = z.strictObject({
  id: z.string().min(1),
  kind: z.enum(SHOP_ITEM_KINDS),
  title: z.string().min(1),
  price: z.number().int().positive(),
  asset: z.string().min(1),
  unlockAfterWorld: z.number().int().min(1).max(10).optional(),
});
export type ShopItem = z.infer<typeof ShopItemSchema>;

/** `content/shared/shop.json`: every shop item, in display order. */
export const ShopFileSchema = z.array(ShopItemSchema);
