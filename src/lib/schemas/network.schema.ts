import { z } from 'zod'

export const networkSchema = z.object({
  proxy: z.string().optional(),
  rateLimit: z.string().optional(),
  retries: z.number().int().nonnegative().optional(),
  socketTimeout: z.number().positive().optional(),
  sourceAddress: z.string().optional(),
  geoVerificationProxy: z.string().optional(),
  xff: z.string().optional(),
  fragmentRetries: z.number().int().nonnegative().optional(),
  sleepInterval: z.number().nonnegative().optional(),
  maxSleepInterval: z.number().nonnegative().optional(),
  minSleepInterval: z.number().nonnegative().optional(),
  sleepRequests: z.number().nonnegative().optional(),
  addHeaders: z.record(z.string()).optional(),
  headers: z.record(z.string()).optional(),
  impersonate: z.string().optional(),
  enableFileUrls: z.boolean().optional(),
  skipUnavailableFragments: z.boolean().optional(),
  abortOnUnavailableFragment: z.boolean().optional(),
  bufferSize: z.string().optional(),
  httpChunkSize: z.string().optional(),
  keepFragments: z.boolean().optional(),
  userAgent: z.string().optional(),
  referer: z.string().optional(),
})

export type NetworkSchema = z.infer<typeof networkSchema>
