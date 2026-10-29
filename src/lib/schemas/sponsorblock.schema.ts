import { z } from 'zod'

export const sponsorblockCategorySchema = z.enum([
  'sponsor',
  'intro',
  'outro',
  'selfpromo',
  'preview',
  'filler',
  'music_offtopic',
  'poi_highlight',
  'chapter',
  'all',
])

export const sponsorBlockSchema = z.object({
  sponsorblockRemove: z.array(z.string()).optional(),
  sponsorblockMark: z.array(z.string()).optional(),
  sponsorblockApi: z.string().optional(),
  sponsorblockChapterTitle: z.string().optional(),
})

export type SponsorBlockSchema = z.infer<typeof sponsorBlockSchema>
