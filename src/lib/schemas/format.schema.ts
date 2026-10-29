import { z } from 'zod'

export const formatSchema = z.object({
  formatSelection: z.string().optional(),
  formatSelector: z.string().optional(),
  formatSort: z.string().optional(),
  mergeOutputFormat: z.string().optional(),
  checkFormats: z.boolean().optional(),
  audioMultistreams: z.boolean().optional(),
  videoMultistreams: z.boolean().optional(),
  audioOnly: z.boolean().optional(),
  audioFormat: z.string().optional(),
  audioQuality: z.string().optional(),
})

export type FormatSchema = z.infer<typeof formatSchema>
