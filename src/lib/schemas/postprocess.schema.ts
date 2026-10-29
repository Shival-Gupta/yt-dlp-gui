import { z } from 'zod'

export const postProcessSchema = z.object({
  extractAudio: z.boolean().optional(),
  audioFormat: z.string().optional(),
  audioQuality: z.string().optional(),
  remuxVideo: z.string().optional(),
  recodeVideo: z.string().optional(),
  keepVideo: z.boolean().optional(),
  postOverwrites: z.boolean().optional(),
  fixup: z.enum(['never', 'warn', 'detect_or_warn', 'force']).or(z.string()).optional(),
  execCommand: z.string().optional(),
  postprocessorArgs: z.union([z.record(z.string()), z.string()]).optional(),
})

export type PostProcessSchema = z.infer<typeof postProcessSchema>
