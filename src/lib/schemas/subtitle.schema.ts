import { z } from 'zod'

export const subtitleSchema = z.object({
  writeSubs: z.boolean().optional(),
  writeAutoSubs: z.boolean().optional(),
  subLangs: z.union([z.string(), z.array(z.string())]).optional(),
  subFormat: z.enum(['best', 'srt', 'vtt', 'ass', 'lrc', 'json3', 'ttml']).or(z.string()).optional(),
  convertSubs: z.enum(['srt', 'vtt', 'ass', 'lrc']).or(z.string()).optional(),
  embedSubs: z.boolean().optional(),
})

export type SubtitleSchema = z.infer<typeof subtitleSchema>
