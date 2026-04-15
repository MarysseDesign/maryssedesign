import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  type: "content",
  schema: z.object({
    lang: z.enum(["en", "it"]),
    translationKey: z.string(),

    ordine: z.number().optional(),
    titolo: z.string(),
    cliente: z.string().optional(),
    anno: z.string().optional(),
    abstract: z.string().optional(),
    cover: z.string().optional(),
    sottotitolo: z.string().optional(),
    intro: z.string().optional(),
    prevSlug: z.string().optional(),
    nextSlug: z.string().optional(),
    video: z.string().optional(),
    template: z.string().optional(),
    showDivider: z.boolean().optional(),
    categories: z.array(z.string()).default([]),
    badges: z.array(z.string()).optional(),
  }),
});

export const collections = { projects };
