import { z } from "zod";

const variationSchema = z.object({
  label: z.string().min(1),
  days:  z.number().int().min(1),
  price: z.number().min(0),
});

export const createToolSchema = z.object({
  body: z.object({
    name:             z.string().min(2, "Name required"),
    shortDescription: z.string().min(5, "Short description required"),
    accessLink:       z.string().url("Must be a valid URL"),
    price:            z.number().min(0).default(0),
    discount:         z.number().min(0).max(100).optional(),
    thumbnail:        z.string().optional(),
    variations:       z.array(variationSchema).optional(),
    status:           z.enum(["draft", "published", "archived"]).optional(),
  }),
});

export const updateToolSchema = z.object({
  params: z.object({ id: z.string().length(24) }),
  body: z.object({
    name:             z.string().min(2).optional(),
    shortDescription: z.string().min(5).optional(),
    accessLink:       z.string().url().optional(),
    price:            z.number().min(0).optional(),
    discount:         z.number().min(0).max(100).optional(),
    thumbnail:        z.string().optional(),
    variations:       z.array(variationSchema).optional(),
    status:           z.enum(["draft", "published", "archived"]).optional(),
  }),
});

export const getToolSchema = z.object({
  params: z.object({ id: z.string().length(24) }),
});