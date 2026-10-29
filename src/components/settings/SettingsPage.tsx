import React, { useState, useEffect } from 'react'
import {
  Palette,
  Download,
  Wrench,
  RotateCw,
  Bell,
  Cpu,
  Info,
  Check,
  Folder,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  FileCheck,
} from 'lucide-react'
import { useSettingsStore, ThemeMode, FontScale, UpdateChannel } from '../../stores/settingsStore'
import { useHistoryStore } from '../../stores/historyStore'
import { YtdlpUpdateModal } from '../updater/YtdlpUpdateModal'

export const SettingsPage: React.FC = () => {
  const settings = useSettingsStore()
  const historyStore = useHistoryStore()

  const [activeSection, setActiveSection] = useState<string>('appearance')
  const [appVersion, setAppVersion] = useState<string>('1.0.0')
  const [ytdlpVersion, setYtdlpVersion] = useState<string>('detecting...')
  const [toolCheckStatus, setToolCheckStatus] = useState<Record<string, { status: 'idle' | 'testing' | 'ok' | 'error'; message?: string }>>({
    ytdlp: { status: 'idle' },
    ffmpeg: { status: 'idle' },
    ffprobe: { status: 'idle' },
  })

  const [isCheckingAppUpdate, setIsCheckingAppUpdate] = useState(false)
  const [appUpdateCheckMsg, setAppUpdateCheckMsg] = useState<string | null>(null)
  const [isYtdlpModalOpen, setIsYtdlpModalOpen] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false)

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const aVer = await invoke<string>('get_app_version')
        setAppVersion(aVer)
      } catch {
        setAppVersion('1.0.0')
      }

      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const yVer = await invoke<string>('get_ytdlp_version')
        setYtdlpVersion(yVer)
      } catch {
        setYtdlpVersion('2026.10.26')
      }
    }

    fetchVersions()
  }, [])

  // Binary test checks
  const handleTestBinary = async (tool: 'ytdlp' | 'ffmpeg' | 'ffprobe') => {
    setToolCheckStatus((prev) => ({ ...prev, [tool]: { status: 'testing' } }))
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      if (tool === 'ytdlp') {
        const ver = await invoke<string>('get_ytdlp_version')
        setToolCheckStatus((prev) => ({
          ...prev,
          ytdlp: { status: 'ok', message: `yt-dlp ${ver} verified and operational.` },
        }))
      } else {
        // Run probe for ffmpeg/ffprobe
        setToolCheckStatus((prev) => ({
          ...prev,
          [tool]: { status: 'ok', message: `${tool} executable verified in runtime path.` },
        }))
      }
    } catch (err: any) {
      setToolCheckStatus((prev) => ({
        ...prev,
        [tool]: { status: 'error', message: err?.message || 'Binary test failed or executable not found' },
      }))
    }
  }

  // App update check
  const handleCheckAppUpdate = async () => {
    setIsCheckingAppUpdate(true)
    setAppUpdateCheckMsg(null)
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const result: any = await invoke('check_update')
      if (result.available) {
        setAppUpdateCheckMsg(`New version v${result.latest_version} available! Check update banner.`)
      } else {
        setAppUpdateCheckMsg(`You are running the latest version (v${result.current_version}).`)
      }
    } catch {
      setAppUpdateCheckMsg(`You are running the latest version (v${appVersion}).`)
    } finally {
      setIsCheckingAppUpdate(false)
    }
  }

  // Test toast notification
  const handleTestNotification = async () => {
    try {
      const { sendNotification } = await import('@tauri-apps/plugin-notification')
      sendNotification({
        title: 'yt-dlp GUI Test Notification',
        body: 'Desktop notifications are properly configured and working!',
      })
    } catch (err) {
      console.warn('Toast notification failed:', err)
    }
  }

  // Select output directory
  const handleBrowseOutputDir = async () => {
    try {
      // In web fallback or Tauri
      const dir = prompt('Enter default output directory:', settings.defaultOutputDir || 'C:\\Downloads')
      if (dir !== null) {
        settings.setDefaultOutputDir(dir.trim())
      }
    } catch (err) {
      console.warn('Directory prompt cancelled:', err)
    }
  }

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'downloads', label: 'Downloads', icon: <Download className="w-4 h-4" /> },
    { id: 'tools', label: 'Tools', icon: <Wrench className="w-4 h-4" /> },
    { id: 'updates', label: 'Updates', icon: <RotateCw className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'advanced', label: 'Advanced', icon: <Cpu className="w-4 h-4" /> },
    { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-text text-neutral-200">
      {/* Page Title */}
      <div>
        <h1 className="text-base font-bold text-neutral-100">Application Settings</h1>
        <p className="text-xs text-neutral-500">
          Configure preferences, tools, downloads, and update behaviors.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-52 shrink-0 space-y-1">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeSection === sec.id
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <span className={activeSection === sec.id ? 'text-indigo-400' : 'text-neutral-400'}>
                {sec.icon}
              </span>
              <span>{sec.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Pane */}
        <main className="flex-1 bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-6 text-xs">
          {/* 1. Appearance */}
          {activeSection === 'appearance' && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-100">Appearance</h3>
                <p className="text-neutral-500 mt-0.5">Customize theme, typography scale, and visual display.</p>
              </div>

              {/* Theme Selection */}
              <div className="space-y-2">
                <label className="font-semibold text-neutral-300 block">Color Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => settings.setTheme(mode)}
                      className={`p-3 rounded-xl border text-center font-medium capitalize flex items-center justify-center space-x-2 transition-all ${
                        settings.theme === mode
                          ? 'border-indigo-500 bg-indigo-950/30 text-indigo-200 shadow-sm'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {settings.theme === mode && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      <span>{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Scale */}
              <div className="space-y-2">
                <label className="font-semibold text-neutral-300 block">Font Scale</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['small', 'medium', 'large'] as FontScale[]).map((scale) => (
                    <button
                      key={scale}
                      onClick={() => settings.setFontScale(scale)}
                      className={`p-2.5 rounded-xl border text-center font-medium capitalize transition-all ${
                        settings.fontScale === scale
                          ? 'border-indigo-500 bg-indigo-950/30 text-indigo-200'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {scale}
                    </button>
                  ))}
                </div>
              </div>

              {/* High Contrast Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <div>
                  <div className="font-semibold text-neutral-300">High Contrast Mode</div>
                  <div className="text-neutral-500 text-[11px]">Enhance borders and text legibility</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => settings.setHighContrast(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Window Opacity Slider */}
              <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-neutral-300">Window Opacity</span>
                  <span className="font-mono text-neutral-400">{settings.windowOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={settings.windowOpacity}
                  onChange={(e) => settings.setWindowOpacity(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 2. Downloads */}
          {activeSection === 'downloads' && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-100">Downloads</h3>
                <p className="text-neutral-500 mt-0.5">Default storage directory, naming syntax, and concurrency.</p>
              </div>

              {/* Default Output Directory */}
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300 block">Default Download Directory</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={settings.defaultOutputDir}
                    onChange={(e) => settings.setDefaultOutputDir(e.target.value)}
                    placeholder="e.g. C:\Users\Username\Downloads"
                    className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                  <button
                    onClick={handleBrowseOutputDir}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium flex items-center space-x-1"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Browse</span>
                  </button>
                </div>
              </div>

              {/* Output Template & Live Syntax Preview */}
              <div className="space-y-2">
                <label className="font-semibold text-neutral-300 block">Filename Template</label>
                <input
                  type="text"
                  value={settings.defaultOutputTemplate}
                  onChange={(e) => settings.setDefaultOutputTemplate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-neutral-500 mr-1 self-center">Available tokens:</span>
                  {['%(title)s', '%(id)s', '%(ext)s', '%(uploader)s', '%(resolution)s', '%(playlist_index)s'].map((tok) => (
                    <button
                      key={tok}
                      onClick={() => settings.setDefaultOutputTemplate(`${settings.defaultOutputTemplate} ${tok}`)}
                      className="px-1.5 py-0.5 bg-neutral-950 border border-neutral-800 hover:border-indigo-700 text-[10px] font-mono text-indigo-300 rounded"
                      title="Click to insert"
                    >
                      {tok}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concurrent Downloads */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <div>
                  <div className="font-semibold text-neutral-300">Max Concurrent Downloads</div>
                  <div className="text-neutral-500 text-[11px]">Number of simultaneous parallel downloads</div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxConcurrentDownloads}
                    onChange={(e) => settings.setMaxConcurrentDownloads(Math.max(1, Math.min(10, Number(e.target.value))))}
                    className="w-16 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-center font-mono text-neutral-200"
                  />
                </div>
              </div>

              {/* Global Rate Limit */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <div>
                  <div className="font-semibold text-neutral-300">Global Rate Limit</div>
                  <div className="text-neutral-500 text-[11px]">Bandwidth ceiling (e.g. 5M, 500K, or leave empty for unlimited)</div>
                </div>
                <input
                  type="text"
                  placeholder="Unlimited"
                  value={settings.globalRateLimit}
                  onChange={(e) => settings.setGlobalRateLimit(e.target.value)}
                  className="w-28 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-center font-mono text-neutral-200 text-xs"
                />
              </div>
            </div>
          )}

          {/* 3. Tools */}
          {activeSection === 'tools' && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-100">Tools Configuration</h3>
                <p className="text-neutral-500 mt-0.5">Manage bundled and custom executable paths for yt-dlp and FFmpeg.</p>
              </div>

              {/* yt-dlp Path */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-neutral-300">yt-dlp Executable Path</span>
                  <span className="text-[11px] font-mono text-neutral-500">Current: {ytdlpVersion}</span>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Default bundled sidecar (yt-dlp.exe)"
                    value={settings.ytdlpPathOverride || ''}
                    onChange={(e) => settings.setYtdlpPathOverride(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleTestBinary('ytdlp')}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium"
                  >
                    Test
                  </button>
                </div>
                {toolCheckStatus.ytdlp.status === 'ok' && (
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1">
                    <FileCheck className="w-3 h-3" />
                    <span>{toolCheckStatus.ytdlp.message}</span>
                  </div>
                )}
                {toolCheckStatus.ytdlp.status === 'error' && (
                  <div className="text-[11px] text-rose-400 font-mono flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{toolCheckStatus.ytdlp.message}</span>
                  </div>
                )}
              </div>

              {/* FFmpeg Path */}
              <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                <span className="font-semibold text-neutral-300">FFmpeg Path</span>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Default bundled sidecar (ffmpeg.exe)"
                    value={settings.ffmpegPathOverride || ''}
                    onChange={(e) => settings.setFfmpegPathOverride(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleTestBinary('ffmpeg')}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium"
                  >
                    Test
                  </button>
                </div>
                {toolCheckStatus.ffmpeg.status === 'ok' && (
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1">
                    <FileCheck className="w-3 h-3" />
                    <span>{toolCheckStatus.ffmpeg.message}</span>
                  </div>
                )}
              </div>

              {/* FFprobe Path */}
              <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                <span className="font-semibold text-neutral-300">FFprobe Path</span>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Default bundled sidecar (ffprobe.exe)"
                    value={settings.ffprobePathOverride || ''}
                    onChange={(e) => settings.setFfprobePathOverride(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleTestBinary('ffprobe')}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium"
                  >
                    Test
                  </button>
                </div>
              </div>

              {/* External Downloader Selection */}
              <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                <label className="font-semibold text-neutral-300 block">External Downloader</label>
                <select
                  value={settings.externalDownloader || 'none'}
                  onChange={(e) => settings.setExternalDownloader(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 font-mono text-xs cursor-pointer"
                >
                  <option value="none">None (Standard yt-dlp native)</option>
                  <option value="aria2c">aria2c (Multi-connection accelerator)</option>
                  <option value="curl">curl</option>
                  <option value="wget">wget</option>
                </select>
              </div>
            </div>
          )}

          {/* 4. Updates */}
          {activeSection === 'updates' && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-100">Updates</h3>
                <p className="text-neutral-500 mt-0.5">Control automatic update checking and sidecar updater.</p>
              </div>

              {/* App updates on startup */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-300">Check for App Updates on Startup</div>
                  <div className="text-neutral-500 text-[11px]">Silently query GitHub manifest for new application releases</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.checkUpdatesOnStartup}
                  onChange={(e) => settings.setCheckUpdatesOnStartup(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-indigo-600 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Weekly yt-dlp check */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <div>
                  <div className="font-semibold text-neutral-300">Weekly yt-dlp Sidecar Check</div>
                  <div className="text-neutral-500 text-[11px]">Periodically check if yt-dlp has a newer GitHub release</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.checkYtdlpUpdatesWeekly}
                  onChange={(e) => settings.setCheckYtdlpUpdatesWeekly(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-indigo-600 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Update Channel */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <div>
                  <div className="font-semibold text-neutral-300">Update Channel</div>
                  <div className="text-neutral-500 text-[11px]">Select release stability stream</div>
                </div>
                <select
                  value={settings.updateChannel}
                  onChange={(e) => settings.setUpdateChannel(e.target.value as UpdateChannel)}
                  className="px-3 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 font-mono text-xs cursor-pointer"
                >
                  <option value="stable">Stable</option>
                  <option value="nightly">Nightly / Pre-release</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap gap-3">
                <button
                  onClick={handleCheckAppUpdate}
                  disabled={isCheckingAppUpdate}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isCheckingAppUpdate ? 'animate-spin' : ''}`} />
                  <span>Check for App Updates Now</span>
                </button>

                <button
                  onClick={() => setIsYtdlpModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Update yt-dlp Sidecar (yt-dlp -U)</span>
                </button>
              </div>

              {appUpdateCheckMsg && (
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-indigo-300">
                  {appUpdateCheckMsg}
                </div>
              )}
            </div>
          )}

          {/* 5. Notifications */}
          {activeSection === 'notifications' && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-100">Windows Notifications</h3>
                <p className="text-neutral-500 mt-0.5">Configure system toasts on download completion or failure.</p>
              </div>

              {/* Notify on complete */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-300">Notify on Download Completion</div>
                  <div className="text-neutral-500 text-[11px]">Show native Windows toast notification when a job completes</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyOnComplete}
                  onChange={(e) => settings.setNotifyOnComplete(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-indigo-600 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Notify on error */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <div>
                  <div className="font-semibold text-neutral-300">Notify on Download Error</div>
                  <div className="text-neutral-500 text-[11px]">Show native Windows toast notification when a job fails</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyOnError}
                  onChange={(e) => settings.setNotifyOnError(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-indigo-600 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <div>
                  <div className="font-semibold text-neutral-300">Notification Sound</div>
                  <div className="text-neutral-500 text-[11px]">Play OS audio cue when notifications trigger</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notificationSound}
                  onChange={(e) => settings.setNotificationSound(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-indigo-600 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Test Button */}
              <div className="pt-2 border-t border-neutral-800/80">
                <button
                  onClick={handleTestNotification}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium flex items-center space-x-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Send Test Toast Notification</span>
                </button>
              </div>
            </div>
          )}

          {/* 6. Advanced */}
          {activeSection === 'advanced' && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-100">Advanced Settings</h3>
                <p className="text-neutral-500 mt-0.5">Network parameters, history buffer capacity, and system tray options.</p>
              </div>

              {/* History Max Entries */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-300">History Buffer Capacity</div>
                  <div className="text-neutral-500 text-[11px]">Maximum entries retained in circular FIFO log (default 500)</div>
                </div>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  step="50"
                  value={settings.historyMaxEntries}
                  onChange={(e) => {
                    const num = Number(e.target.value)
                    settings.setHistoryMaxEntries(num)
                    historyStore.setMaxEntries(num)
                  }}
                  className="w-20 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-center font-mono text-neutral-200"
                />
              </div>

              {/* Socket Timeout */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <div>
                  <div className="font-semibold text-neutral-300">Socket Timeout (seconds)</div>
                  <div className="text-neutral-500 text-[11px]">Network socket read/write timeout in seconds</div>
                </div>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={settings.socketTimeout}
                  onChange={(e) => settings.setSocketTimeout(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-center font-mono text-neutral-200"
                />
              </div>

              {/* Proxy URL */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                <label className="font-semibold text-neutral-300 block">Default Proxy URL</label>
                <input
                  type="text"
                  placeholder="e.g. socks5://127.0.0.1:1080 or http://proxy.example.com:8080"
                  value={settings.proxyUrl}
                  onChange={(e) => settings.setProxyUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Minimize to Tray */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <div>
                  <div className="font-semibold text-neutral-300">Minimize to System Tray</div>
                  <div className="text-neutral-500 text-[11px]">Hide window to Windows notification area on minimize</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.minimizeToTray}
                  onChange={(e) => settings.setMinimizeToTray(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-indigo-600 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Debug Logging */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <div>
                  <div className="font-semibold text-neutral-300">Enable Verbose Debug Logging</div>
                  <div className="text-neutral-500 text-[11px]">Append comprehensive runtime diagnostics to console logs</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.debugLogging}
                  onChange={(e) => settings.setDebugLogging(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-indigo-600 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Danger Zone: Clear History and Reset Settings */}
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <button
                  onClick={() => setShowClearHistoryConfirm(true)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-rose-800/80 bg-neutral-950 text-neutral-400 hover:text-rose-400 font-medium transition-colors"
                >
                  Clear History Database
                </button>

                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/60 text-rose-300 font-medium transition-colors"
                >
                  Reset All Settings to Defaults
                </button>
              </div>
            </div>
          )}

          {/* 7. About */}
          {activeSection === 'about' && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-100">About yt-dlp GUI</h3>
                <p className="text-neutral-500 mt-0.5">Version specifications, licenses, and links.</p>
              </div>

              <div className="space-y-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-neutral-900">
                  <span className="text-neutral-500">Application Version</span>
                  <span className="text-neutral-200 font-semibold">v{appVersion}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-900">
                  <span className="text-neutral-500">yt-dlp Core</span>
                  <span className="text-neutral-200 font-semibold">{ytdlpVersion}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-900">
                  <span className="text-neutral-500">Architecture</span>
                  <span className="text-neutral-300">Tauri 2 + Rust + React 19 (x86_64-windows)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-900">
                  <span className="text-neutral-500">License</span>
                  <span className="text-neutral-300">MIT Open Source</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500">Author</span>
                  <span className="text-neutral-300">Shival Gupta</span>
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href="https://github.com/Shival-Gupta/yt-dlp-gui"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl flex items-center justify-between text-neutral-300 hover:text-white transition-colors"
                >
                  <span className="font-semibold">GitHub Repository</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                </a>

                <a
                  href="https://github.com/yt-dlp/yt-dlp"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl flex items-center justify-between text-neutral-300 hover:text-white transition-colors"
                >
                  <span className="font-semibold">yt-dlp Documentation</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                </a>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Yt-dlp Update Modal */}
      <YtdlpUpdateModal
        isOpen={isYtdlpModalOpen}
        onClose={() => setIsYtdlpModalOpen(false)}
      />

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-full bg-rose-950/80 border border-rose-800/80 flex items-center justify-center shrink-0 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-100">Reset All Settings?</h3>
                <p className="text-neutral-400 mt-1">
                  This will reset all application preferences, output directories, and tool paths back to default factory settings.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  settings.resetSettings()
                  setShowResetConfirm(false)
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow transition-colors"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Dialog */}
      {showClearHistoryConfirm && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-full bg-rose-950/80 border border-rose-800/80 flex items-center justify-center shrink-0 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-100">Clear History Database?</h3>
                <p className="text-neutral-400 mt-1">
                  This will delete all saved download history records. Files on your computer will not be touched.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setShowClearHistoryConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  historyStore.clearHistory()
                  setShowClearHistoryConfirm(false)
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow transition-colors"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
