import { z } from 'zod'

export const verbositySchema = z.object({
  simulate: z.boolean().optional(),
  skipDownload: z.boolean().optional(),
  printTemplate: z.string().optional(),
  dumpJson: z.boolean().optional(),
  dumpSingleJson: z.boolean().optional(),
  verbose: z.boolean().optional(),
  printTraffic: z.boolean().optional(),
  noWarnings: z.boolean().optional(),
  printToFile: z
    .object({
      template: z.string(),
      file: z.string(),
    })
    .optional(),
  compatOptions: z.string().optional(),
  ignoreErrors: z.boolean().optional(),
  noAbortOnError: z.boolean().optional(),
  ignoreConfig: z.boolean().optional(),
  quiet: z.boolean().optional(),
})

export type VerbositySchema = z.infer<typeof verbositySchema>
