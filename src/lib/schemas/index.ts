import { z } from 'zod'
import { downloadSchema } from './download.schema'
import { formatSchema } from './format.schema'
import { subtitleSchema } from './subtitle.schema'
import { thumbnailSchema } from './thumbnail.schema'
import { metadataSchema } from './metadata.schema'
import { postProcessSchema } from './postprocess.schema'
import { sponsorBlockSchema } from './sponsorblock.schema'
import { networkSchema } from './network.schema'
import { authSchema } from './auth.schema'
import { filterSchema } from './filter.schema'
import { filesystemSchema } from './filesystem.schema'
import { extractorSchema } from './extractor.schema'
import { externalDownloaderSchema } from './externaldownloader.schema'
import { verbositySchema } from './verbosity.schema'

export * from './download.schema'
export * from './format.schema'
export * from './subtitle.schema'
export * from './thumbnail.schema'
export * from './metadata.schema'
export * from './postprocess.schema'
export * from './sponsorblock.schema'
export * from './network.schema'
export * from './auth.schema'
export * from './filter.schema'
export * from './filesystem.schema'
export * from './extractor.schema'
export * from './externaldownloader.schema'
export * from './verbosity.schema'

export const ytdlpOptionsSchema = downloadSchema
  .merge(formatSchema)
  .merge(subtitleSchema)
  .merge(thumbnailSchema)
  .merge(metadataSchema)
  .merge(postProcessSchema)
  .merge(sponsorBlockSchema)
  .merge(networkSchema)
  .merge(authSchema)
  .merge(filterSchema)
  .merge(filesystemSchema)
  .merge(extractorSchema)
  .merge(externalDownloaderSchema)
  .merge(verbositySchema)
  .extend({
    _raw: z.array(z.string()).optional(),
  })

export type YtdlpOptionsValidated = z.infer<typeof ytdlpOptionsSchema>
