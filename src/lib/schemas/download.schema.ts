import { z } from 'zod'

export const downloadSchema = z.object({
  urls: z.array(z.string()).default([]),
  outputDir: z.string().optional(),
  outputTemplate: z.string().optional(),
  playlist: z.boolean().optional(),
  noPlaylist: z.boolean().optional(),
  playlistItems: z.string().optional(),
  concurrentFragments: z.number().int().positive().optional(),
  downloadArchive: z.string().optional(),
  archiveFile: z.string().optional(),
  maxDownloads: z.number().int().positive().optional(),
})

export type DownloadSchema = z.infer<typeof downloadSchema>
