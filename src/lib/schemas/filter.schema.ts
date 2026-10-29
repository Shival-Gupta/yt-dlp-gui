import { z } from 'zod'

export const filterSchema = z.object({
  minFilesize: z.string().optional(),
  maxFilesize: z.string().optional(),
  date: z.string().optional(),
  dateBefore: z.string().optional(),
  dateAfter: z.string().optional(),
  matchFilter: z.string().optional(),
  matchFilters: z.union([z.string(), z.array(z.string())]).optional(),
  breakMatchFilter: z.string().optional(),
  breakMatchFilters: z.union([z.string(), z.array(z.string())]).optional(),
  noPlaylist: z.boolean().optional(),
  playlist: z.boolean().optional(),
  ageLimit: z.number().int().nonnegative().optional(),
  maxDownloads: z.number().int().positive().optional(),
  skipPlaylistAfterErrors: z.number().int().positive().optional(),
  breakOnExisting: z.boolean().optional(),
  breakPerInput: z.boolean().optional(),
})

export type FilterSchema = z.infer<typeof filterSchema>
