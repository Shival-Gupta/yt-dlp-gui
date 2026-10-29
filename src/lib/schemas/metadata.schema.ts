import { z } from 'zod'

export const replaceInMetadataRuleSchema = z.object({
  field: z.string(),
  regex: z.string(),
  replace: z.string(),
})

export const metadataSchema = z.object({
  writeInfoJson: z.boolean().optional(),
  writeDescription: z.boolean().optional(),
  writeComments: z.boolean().optional(),
  writePlaylistMetafiles: z.boolean().optional(),
  cleanInfoJson: z.boolean().optional(),
  embedMetadata: z.boolean().optional(),
  embedChapters: z.boolean().optional(),
  embedInfoJson: z.boolean().optional(),
  splitChapters: z.boolean().optional(),
  writeUrlLink: z.boolean().optional(),
  writeWeBlocLink: z.boolean().optional(),
  writeDesktopLink: z.boolean().optional(),
  xattrs: z.boolean().optional(),
  loadInfoJson: z.string().optional(),
  parseMetadata: z.union([z.string(), z.array(z.string())]).optional(),
  replaceInMetadata: z.array(replaceInMetadataRuleSchema).optional(),
})

export type MetadataSchema = z.infer<typeof metadataSchema>
