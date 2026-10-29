import { z } from 'zod'

export const extractorSchema = z.object({
  extractorArgs: z.union([z.record(z.string()), z.string()]).optional(),
  useExtractors: z.union([z.string(), z.array(z.string())]).optional(),
  flatPlaylist: z.boolean().optional(),
  liveFromStart: z.boolean().optional(),
  waitForVideo: z.union([z.string(), z.number()]).optional(),
  markWatched: z.boolean().optional(),
  jsRuntimes: z.union([z.string(), z.array(z.string())]).optional(),
  jsEngine: z.string().optional(),
  remoteComponents: z.string().optional(),
  defaultSearch: z.string().optional(),
  configLocations: z.string().optional(),
  pluginDirs: z.union([z.string(), z.array(z.string())]).optional(),
})

export type ExtractorSchema = z.infer<typeof extractorSchema>
