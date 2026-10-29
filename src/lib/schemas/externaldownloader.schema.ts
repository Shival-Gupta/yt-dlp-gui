import { z } from 'zod'

export const externalDownloaderSchema = z.object({
  downloader: z.string().optional(),
  downloaderArgs: z.union([z.string(), z.array(z.string())]).optional(),
  hlsPreferNative: z.boolean().optional(),
  hlsPreferFfmpeg: z.boolean().optional(),
  hlsUseMpegts: z.boolean().optional(),
  hlsSplitDiscontinuity: z.boolean().optional(),
})

export type ExternalDownloaderSchema = z.infer<typeof externalDownloaderSchema>
