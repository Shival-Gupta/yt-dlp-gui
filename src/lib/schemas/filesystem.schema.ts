import { z } from 'zod'

export const filesystemSchema = z.object({
  windowsFilenames: z.boolean().optional(),
  restrictFilenames: z.boolean().optional(),
  trimFilenames: z.number().int().positive().optional(),
  noOverwrites: z.boolean().optional(),
  forceOverwrites: z.boolean().optional(),
  continueDownload: z.boolean().optional(),
  partFile: z.boolean().optional(),
  partFiles: z.boolean().optional(),
  mtime: z.boolean().optional(),
  cacheDir: z.string().optional(),
  noCacheDir: z.boolean().optional(),
  subpaths: z.record(z.string()).optional(),
  forceWriteArchive: z.boolean().optional(),
})

export type FilesystemSchema = z.infer<typeof filesystemSchema>
