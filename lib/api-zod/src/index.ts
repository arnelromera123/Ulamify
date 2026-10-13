import * as zod from "zod";

export * from "./generated/api";
export * from "./generated/types";

export const MarketRunItemInput = zod.object({
  ingredientId: zod.number().int().nullish(),
  itemType: zod.enum(['major_ingredient', 'pantry_item', 'utility_lpg', 'other_expense']),
  name: zod.string().min(1),
  quantity: zod.number().gt(0),
  unit: zod.enum(['g', 'kg', 'ml', 'L', 'each']),
  totalCost: zod.number().gt(0),
});
export type MarketRunItemInput = zod.infer<typeof MarketRunItemInput>;

export const CreateMarketRunBody = zod.object({
  supplier: zod.string().max(120).nullish(),
  deliveryFee: zod.number().min(0).default(0),
  notes: zod.string().max(500).nullish(),
  items: zod.array(MarketRunItemInput).min(1),
});
export type CreateMarketRunBody = zod.infer<typeof CreateMarketRunBody>;

export const MarketRunItemResponse = zod.object({
  id: zod.number().int(),
  ingredientId: zod.number().int().nullish(),
  itemType: zod.enum(['major_ingredient', 'pantry_item', 'utility_lpg', 'other_expense']),
  name: zod.string(),
  quantity: zod.number(),
  unit: zod.string(),
  baseCost: zod.number(),
  allocatedDeliveryCost: zod.number(),
  landedUnitCost: zod.number(),
});
export type MarketRunItemResponse = zod.infer<typeof MarketRunItemResponse>;

export const MarketRunResponse = zod.object({
  id: zod.number().int(),
  supplier: zod.string().nullable(),
  totalItemsCost: zod.number(),
  deliveryFee: zod.number(),
  totalAmount: zod.number(),
  notes: zod.string().nullable(),
  createdAt: zod.string(),
  items: zod.array(MarketRunItemResponse),
});
export type MarketRunResponse = zod.infer<typeof MarketRunResponse>;

export const ListMarketRunsResponse = zod.array(MarketRunResponse);
export type ListMarketRunsResponse = zod.infer<typeof ListMarketRunsResponse>;
