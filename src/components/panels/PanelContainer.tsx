import React, { useState, useMemo } from 'react'
import {
  FolderDown,
  Film,
  MessageSquareText,
  Image as ImageIcon,
  FileText,
  Sparkles,
  ShieldAlert,
  Globe,
  KeyRound,
  Filter,
  FolderGit2,
  Cpu,
  DownloadCloud,
  Terminal,
  RotateCcw,
} from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { DownloadPanel } from './DownloadPanel'
import { FormatPanel } from './FormatPanel'
import { SubtitlePanel } from './SubtitlePanel'
import { ThumbnailPanel } from './ThumbnailPanel'
import { MetadataPanel } from './MetadataPanel'
import { PostProcessPanel } from './PostProcessPanel'
import { SponsorBlockPanel } from './SponsorBlockPanel'
import { NetworkPanel } from './NetworkPanel'
import { AuthPanel } from './AuthPanel'
import { FilterPanel } from './FilterPanel'
import { FilesystemPanel } from './FilesystemPanel'
import { ExtractorPanel } from './ExtractorPanel'
import { ExternalDownloaderPanel } from './ExternalDownloaderPanel'
import { VerbosityPanel } from './VerbosityPanel'

export type PanelTabId =
  | 'download'
  | 'format'
  | 'subtitle'
  | 'thumbnail'
  | 'metadata'
  | 'postprocess'
  | 'sponsorblock'
  | 'network'
  | 'auth'
  | 'filter'
  | 'filesystem'
  | 'extractor'
  | 'downloader'
  | 'verbosity'

export interface PanelContainerProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
  onResetAll?: () => void
  initialTab?: PanelTabId
  className?: string
}

interface TabDef {
  id: PanelTabId
  label: string
  shortLabel: string
  icon: React.ReactNode
  getActiveCount: (opts: YtdlpOptions) => number
  Component: React.ComponentType<{
    options: YtdlpOptions
    onChange: (patch: Partial<YtdlpOptions>) => void
  }>
}

export const PanelContainer: React.FC<PanelContainerProps> = ({
  options,
  onChange,
  onResetAll,
  initialTab = 'format',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<PanelTabId>(initialTab)

  const tabs: TabDef[] = useMemo(
    () => [
      {
        id: 'download',
        label: 'Output & Directory',
        shortLabel: 'Output',
        icon: <FolderDown className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.outputDir,
            o.outputTemplate,
            o.playlistItems,
            o.concurrentFragments && o.concurrentFragments > 1,
            o.downloadArchive || o.archiveFile,
            o.maxDownloads,
          ].filter(Boolean).length,
        Component: DownloadPanel,
      },
      {
        id: 'format',
        label: 'Format & Quality',
        shortLabel: 'Format',
        icon: <Film className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.formatSelection || o.formatSelector,
            o.formatSort,
            o.mergeOutputFormat,
            o.checkFormats,
            o.audioMultistreams,
            o.videoMultistreams,
          ].filter(Boolean).length,
        Component: FormatPanel,
      },
      {
        id: 'subtitle',
        label: 'Subtitles',
        shortLabel: 'Subtitles',
        icon: <MessageSquareText className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.writeSubs,
            o.writeAutoSubs,
            o.subLangs && (Array.isArray(o.subLangs) ? o.subLangs.length > 0 : Boolean(o.subLangs)),
            o.subFormat,
            o.convertSubs,
            o.embedSubs,
          ].filter(Boolean).length,
        Component: SubtitlePanel,
      },
      {
        id: 'thumbnail',
        label: 'Thumbnails',
        shortLabel: 'Thumbnails',
        icon: <ImageIcon className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.writeThumbnail,
            o.writeAllThumbnails || o.allThumbnails,
            o.convertThumbnails || o.convertThumbnail,
            o.embedThumbnail,
          ].filter(Boolean).length,
        Component: ThumbnailPanel,
      },
      {
        id: 'metadata',
        label: 'Metadata & Chapters',
        shortLabel: 'Metadata',
        icon: <FileText className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.writeInfoJson,
            o.writeDescription,
            o.writeComments,
            o.cleanInfoJson,
            o.embedMetadata,
            o.embedChapters,
            o.embedInfoJson,
            o.splitChapters,
            o.writeUrlLink,
            o.xattrs,
            o.loadInfoJson,
            o.replaceInMetadata && o.replaceInMetadata.length > 0,
          ].filter(Boolean).length,
        Component: MetadataPanel,
      },
      {
        id: 'postprocess',
        label: 'Post-Processing',
        shortLabel: 'Post-Process',
        icon: <Sparkles className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.extractAudio || o.audioOnly,
            o.audioFormat,
            o.audioQuality,
            o.remuxVideo,
            o.recodeVideo,
            o.keepVideo,
            o.postOverwrites,
            o.fixup,
            o.execCommand,
            o.postprocessorArgs,
          ].filter(Boolean).length,
        Component: PostProcessPanel,
      },
      {
        id: 'sponsorblock',
        label: 'SponsorBlock',
        shortLabel: 'SponsorBlock',
        icon: <ShieldAlert className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.sponsorblockRemove && o.sponsorblockRemove.length > 0,
            o.sponsorblockMark && o.sponsorblockMark.length > 0,
            o.sponsorblockApi,
            o.sponsorblockChapterTitle,
          ].filter(Boolean).length,
        Component: SponsorBlockPanel,
      },
      {
        id: 'network',
        label: 'Network & Proxy',
        shortLabel: 'Network',
        icon: <Globe className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.proxy,
            o.rateLimit,
            o.retries !== undefined && o.retries !== 10,
            o.socketTimeout && o.socketTimeout !== 30,
            o.impersonate,
            o.sourceAddress,
            o.enableFileUrls,
            o.skipUnavailableFragments,
            o.keepFragments,
            (o.addHeaders && Object.keys(o.addHeaders).length > 0) ||
              (o.headers && Object.keys(o.headers).length > 0),
          ].filter(Boolean).length,
        Component: NetworkPanel,
      },
      {
        id: 'auth',
        label: 'Authentication',
        shortLabel: 'Auth',
        icon: <KeyRound className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.username,
            o.password,
            o.twoFactor,
            o.videoPassword,
            o.cookies || o.cookiesFile,
            o.cookiesFromBrowser || o.cookiesBrowser,
            o.netrc,
            o.apMso,
            o.apUsername,
            o.apPassword,
          ].filter(Boolean).length,
        Component: AuthPanel,
      },
      {
        id: 'filter',
        label: 'Video Selection',
        shortLabel: 'Filters',
        icon: <Filter className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.minFilesize,
            o.maxFilesize,
            o.date,
            o.dateBefore,
            o.dateAfter,
            o.matchFilters && (Array.isArray(o.matchFilters) ? o.matchFilters.length > 0 : Boolean(o.matchFilters)),
            o.noPlaylist || o.playlist === false,
            o.ageLimit !== undefined,
            o.skipPlaylistAfterErrors !== undefined,
            o.breakOnExisting,
          ].filter(Boolean).length,
        Component: FilterPanel,
      },
      {
        id: 'filesystem',
        label: 'Filesystem',
        shortLabel: 'Filesystem',
        icon: <FolderGit2 className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.windowsFilenames,
            o.restrictFilenames,
            o.trimFilenames !== undefined,
            o.noOverwrites,
            o.forceOverwrites,
            o.continueDownload,
            o.partFile ?? o.partFiles,
            o.cacheDir,
            o.noCacheDir,
            o.mtime,
            o.forceWriteArchive,
          ].filter(Boolean).length,
        Component: FilesystemPanel,
      },
      {
        id: 'extractor',
        label: 'Extractor Options',
        shortLabel: 'Extractor',
        icon: <Cpu className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.extractorArgs &&
              (typeof o.extractorArgs === 'object'
                ? Object.keys(o.extractorArgs).length > 0
                : Boolean(o.extractorArgs)),
            o.useExtractors &&
              (Array.isArray(o.useExtractors) ? o.useExtractors.length > 0 : Boolean(o.useExtractors)),
            o.flatPlaylist,
            o.liveFromStart,
            o.waitForVideo !== undefined,
            o.markWatched,
            o.jsRuntimes || o.jsEngine,
            o.defaultSearch,
            o.configLocations,
          ].filter(Boolean).length,
        Component: ExtractorPanel,
      },
      {
        id: 'downloader',
        label: 'Downloader Engine',
        shortLabel: 'Downloader',
        icon: <DownloadCloud className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.downloader,
            o.downloaderArgs &&
              (Array.isArray(o.downloaderArgs)
                ? o.downloaderArgs.length > 0
                : Boolean(o.downloaderArgs)),
            o.hlsPreferNative,
            o.hlsPreferFfmpeg,
            o.hlsUseMpegts,
            o.hlsSplitDiscontinuity,
          ].filter(Boolean).length,
        Component: ExternalDownloaderPanel,
      },
      {
        id: 'verbosity',
        label: 'Verbosity & Simulation',
        shortLabel: 'Verbosity',
        icon: <Terminal className="w-4 h-4" />,
        getActiveCount: (o) =>
          [
            o.simulate,
            o.skipDownload,
            o.dumpJson,
            o.dumpSingleJson,
            o.verbose,
            o.printTraffic,
            o.noWarnings,
            o.ignoreErrors,
            o.ignoreConfig,
            o.compatOptions,
          ].filter(Boolean).length,
        Component: VerbosityPanel,
      },
    ],
    []
  )

  const activeTabDef = tabs.find((t) => t.id === activeTab) || tabs[0]
  const ActiveComponent = activeTabDef.Component

  const totalActiveOptions = useMemo(() => {
    return tabs.reduce((acc, tab) => acc + tab.getActiveCount(options), 0)
  }, [tabs, options])

  return (
    <div className={`flex flex-col bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm ${className}`}>
      {/* Top Header / Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-950/80 border-b border-neutral-800 select-none">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-neutral-200 tracking-wide">
            ADVANCED DOWNLOAD OPTIONS
          </span>
          {totalActiveOptions > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              {totalActiveOptions} active option{totalActiveOptions > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {onResetAll && totalActiveOptions > 0 && (
          <button
            type="button"
            onClick={onResetAll}
            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Tab Navigation Buttons */}
      <div className="flex overflow-x-auto border-b border-neutral-800 bg-neutral-950/40 p-1.5 gap-1 select-none scrollbar-thin scrollbar-thumb-neutral-800">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const activeCount = tab.getActiveCount(options)

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700/60'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <span className={isActive ? 'text-indigo-400' : 'text-neutral-500'}>
                {tab.icon}
              </span>
              <span>{tab.shortLabel}</span>

              {activeCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-800 text-indigo-400 border border-indigo-500/30'
                  }`}
                >
                  {activeCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active Tab Panel Content */}
      <div className="p-4 overflow-y-auto max-h-[600px] select-text">
        <ActiveComponent options={options} onChange={onChange} />
      </div>
    </div>
  )
}
