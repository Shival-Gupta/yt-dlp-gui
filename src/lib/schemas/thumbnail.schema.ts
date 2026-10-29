import { z } from 'zod'

export const thumbnailSchema = z.object({
  writeThumbnail: z.boolean().optional(),
  writeAllThumbnails: z.boolean().optional(),
  allThumbnails: z.boolean().optional(),
  convertThumbnails: z.enum(['jpg', 'png', 'webp']).or(z.string()).optional(),
  convertThumbnail: z.string().optional(),
  embedThumbnail: z.boolean().optional(),
})

export type ThumbnailSchema = z.infer<typeof thumbnailSchema>
