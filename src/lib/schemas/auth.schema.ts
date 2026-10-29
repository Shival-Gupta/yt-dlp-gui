import { z } from 'zod'

export const authSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  twoFactor: z.string().optional(),
  videoPassword: z.string().optional(),
  cookies: z.string().optional(),
  cookiesFile: z.string().optional(),
  cookiesFromBrowser: z.string().optional(),
  cookiesBrowser: z.string().optional(),
  netrc: z.boolean().optional(),
  netrcLocation: z.string().optional(),
  netrcCmd: z.string().optional(),
  apMso: z.string().optional(),
  apUsername: z.string().optional(),
  apPassword: z.string().optional(),
})

export type AuthSchema = z.infer<typeof authSchema>
