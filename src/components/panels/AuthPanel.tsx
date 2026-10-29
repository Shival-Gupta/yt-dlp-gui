import React, { useState } from 'react'
import { KeyRound, Eye, EyeOff } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface AuthPanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

export const AuthPanel: React.FC<AuthPanelProps> = ({ options, onChange }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showVideoPassword, setShowVideoPassword] = useState(false)
  const [showApPassword, setShowApPassword] = useState(false)

  const cookiesVal = options.cookies || options.cookiesFile || ''
  const browserVal = options.cookiesFromBrowser || options.cookiesBrowser || ''

  return (
    <CollapsibleSection
      title="Authentication & Cookies"
      icon={<KeyRound className="w-4 h-4" />}
      description="Login credentials, cookies extraction, 2FA codes, protected video passwords, and TV provider MSO"
    >
      <div className="p-2 bg-amber-950/20 border border-amber-900/30 rounded-lg text-[11px] text-amber-300">
        Credentials are never logged or stored in plain text previews. Password inputs are masked.
      </div>

      <OptionRow
        label="Account Username"
        description="Login username or email for platform"
        tooltip="CLI flag: -u / --username USER"
        cliFlag="-u"
        isModified={Boolean(options.username)}
        onReset={() => onChange({ username: undefined })}
        htmlFor="auth-username"
      >
        <input
          id="auth-username"
          type="text"
          value={options.username || ''}
          onChange={(e) => onChange({ username: e.target.value || undefined })}
          placeholder="Username or email"
          autoComplete="username"
          className="w-56 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
        />
      </OptionRow>

      <OptionRow
        label="Account Password"
        description="Login password for platform account"
        tooltip="CLI flag: -p / --password PASS (never logged)"
        cliFlag="-p"
        isModified={Boolean(options.password)}
        onReset={() => onChange({ password: undefined })}
        htmlFor="auth-password"
      >
        <div className="relative flex items-center">
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            value={options.password || ''}
            onChange={(e) => onChange({ password: e.target.value || undefined })}
            placeholder="Password"
            autoComplete="current-password"
            className="w-56 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 pr-8 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-2 text-neutral-500 hover:text-neutral-300"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </OptionRow>

      <OptionRow
        label="Two-Factor Authentication Code (2FA)"
        description="One-time verification code for 2FA-enabled accounts"
        tooltip="CLI flag: --twofactor CODE"
        cliFlag="--twofactor"
        isModified={Boolean(options.twoFactor)}
        onReset={() => onChange({ twoFactor: undefined })}
        htmlFor="auth-twofactor"
      >
        <input
          id="auth-twofactor"
          type="text"
          value={options.twoFactor || ''}
          onChange={(e) => onChange({ twoFactor: e.target.value || undefined })}
          placeholder="6-digit code"
          className="w-32 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500 text-center"
        />
      </OptionRow>

      <OptionRow
        label="Video Access Password"
        description="Password required for password-protected videos (e.g. Vimeo)"
        tooltip="CLI flag: --video-password PASS"
        cliFlag="--video-password"
        isModified={Boolean(options.videoPassword)}
        onReset={() => onChange({ videoPassword: undefined })}
        htmlFor="auth-video-password"
      >
        <div className="relative flex items-center">
          <input
            id="auth-video-password"
            type={showVideoPassword ? 'text' : 'password'}
            value={options.videoPassword || ''}
            onChange={(e) => onChange({ videoPassword: e.target.value || undefined })}
            placeholder="Video password"
            className="w-56 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 pr-8 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowVideoPassword((p) => !p)}
            className="absolute right-2 text-neutral-500 hover:text-neutral-300"
          >
            {showVideoPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </OptionRow>

      <OptionRow
        label="Cookies from Installed Browser"
        description="Extract authenticated session cookies from local browser profile"
        tooltip="CLI flag: --cookies-from-browser BROWSER"
        cliFlag="--cookies-from-browser"
        isModified={Boolean(browserVal)}
        onReset={() => onChange({ cookiesFromBrowser: undefined, cookiesBrowser: undefined })}
        htmlFor="auth-browser-cookies"
      >
        <select
          id="auth-browser-cookies"
          value={browserVal}
          onChange={(e) => {
            const val = e.target.value || undefined
            onChange({ cookiesFromBrowser: val, cookiesBrowser: val })
          }}
          className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="">Do not import cookies</option>
          <option value="chrome">Google Chrome</option>
          <option value="firefox">Mozilla Firefox</option>
          <option value="brave">Brave Browser</option>
          <option value="edge">Microsoft Edge</option>
          <option value="opera">Opera</option>
          <option value="safari">Apple Safari</option>
          <option value="vivaldi">Vivaldi</option>
          <option value="chromium">Chromium</option>
        </select>
      </OptionRow>

      <OptionRow
        label="Cookies File (cookies.txt)"
        description="Path to Netscape-formatted cookies text file"
        tooltip="CLI flag: --cookies FILE"
        cliFlag="--cookies"
        isModified={Boolean(cookiesVal)}
        onReset={() => onChange({ cookies: undefined, cookiesFile: undefined })}
        htmlFor="auth-cookies-file"
      >
        <input
          id="auth-cookies-file"
          type="text"
          value={cookiesVal}
          onChange={(e) => {
            const val = e.target.value || undefined
            onChange({ cookies: val, cookiesFile: val })
          }}
          placeholder="path/to/cookies.txt"
          className="w-56 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
        />
      </OptionRow>

      <OptionRow
        label="Use .netrc Credentials"
        description="Automatically read credentials from ~/.netrc file"
        tooltip="CLI flag: --netrc"
        cliFlag="--netrc"
        isModified={Boolean(options.netrc)}
        onReset={() => onChange({ netrc: undefined })}
        htmlFor="auth-netrc"
      >
        <input
          id="auth-netrc"
          type="checkbox"
          checked={Boolean(options.netrc)}
          onChange={(e) => onChange({ netrc: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <AdvancedSection title="TV Provider (Adobe Pass) & Netrc Advanced">
        <OptionRow
          label="TV Provider (MSO)"
          description="Multiple-system operator identifier for TV subscriptions"
          tooltip="CLI flag: --ap-mso MSO"
          cliFlag="--ap-mso"
          isModified={Boolean(options.apMso)}
          onReset={() => onChange({ apMso: undefined })}
          htmlFor="auth-ap-mso"
        >
          <input
            id="auth-ap-mso"
            type="text"
            value={options.apMso || ''}
            onChange={(e) => onChange({ apMso: e.target.value || undefined })}
            placeholder="e.g. Comcast, DirecTV"
            className="w-40 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
          />
        </OptionRow>

        <OptionRow
          label="AP Username"
          description="TV provider account username"
          tooltip="CLI flag: --ap-username USER"
          cliFlag="--ap-username"
          isModified={Boolean(options.apUsername)}
          onReset={() => onChange({ apUsername: undefined })}
          htmlFor="auth-ap-username"
        >
          <input
            id="auth-ap-username"
            type="text"
            value={options.apUsername || ''}
            onChange={(e) => onChange({ apUsername: e.target.value || undefined })}
            placeholder="AP username"
            className="w-40 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
          />
        </OptionRow>

        <OptionRow
          label="AP Password"
          description="TV provider account password"
          tooltip="CLI flag: --ap-password PASS"
          cliFlag="--ap-password"
          isModified={Boolean(options.apPassword)}
          onReset={() => onChange({ apPassword: undefined })}
          htmlFor="auth-ap-password"
        >
          <div className="relative flex items-center">
            <input
              id="auth-ap-password"
              type={showApPassword ? 'text' : 'password'}
              value={options.apPassword || ''}
              onChange={(e) => onChange({ apPassword: e.target.value || undefined })}
              placeholder="AP password"
              className="w-40 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 pr-8 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowApPassword((p) => !p)}
              className="absolute right-2 text-neutral-500 hover:text-neutral-300"
            >
              {showApPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </OptionRow>

        <OptionRow
          label="Custom Netrc Location"
          description="Path to alternate .netrc file"
          tooltip="CLI flag: --netrc-location PATH"
          cliFlag="--netrc-location"
          isModified={Boolean(options.netrcLocation)}
          onReset={() => onChange({ netrcLocation: undefined })}
          htmlFor="auth-netrc-loc"
        >
          <input
            id="auth-netrc-loc"
            type="text"
            value={options.netrcLocation || ''}
            onChange={(e) => onChange({ netrcLocation: e.target.value || undefined })}
            placeholder="~/.netrc"
            className="w-56 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
          />
        </OptionRow>
      </AdvancedSection>
    </CollapsibleSection>
  )
}
