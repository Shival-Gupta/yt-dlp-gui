import React, { useState } from 'react'
import {
  Bell,
  Download,
  RotateCw,
  X,
  ExternalLink,
  Info,
} from 'lucide-react'
import { useUpdateStore } from '../../stores/updateStore'
import { useUpdateCheck } from '../../hooks/useUpdateCheck'

export const UpdateBanner: React.FC = () => {
  const { appUpdate, isDownloadingUpdate, downloadProgress, updateReadyToRestart } =
    useUpdateStore()
  const { startUpdateDownload, restartToInstallUpdate, clearAppUpdate } = useUpdateCheck()
  const [showNotesModal, setShowNotesModal] = useState(false)

  if (!appUpdate) return null

  const handleOpenReleaseNotes = () => {
    setShowNotesModal(true)
  }

  return (
    <>
      <div className="w-full bg-indigo-950/90 border-b border-indigo-700/60 text-indigo-100 px-4 py-2 flex items-center justify-between text-xs backdrop-blur-sm z-30 shadow-md animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-6 h-6 rounded-full bg-indigo-600/60 flex items-center justify-center shrink-0 text-white shadow-inner">
            <Bell className="w-3.5 h-3.5 animate-bounce" />
          </div>

          <div className="flex items-center space-x-2 truncate">
            <span className="font-semibold text-white">
              YTDeck {appUpdate.version} is available!
            </span>
            <span className="text-neutral-400 hidden sm:inline">|</span>
            <button
              onClick={handleOpenReleaseNotes}
              className="text-indigo-300 hover:text-white underline underline-offset-2 flex items-center space-x-1"
            >
              <span>Release Notes</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {updateReadyToRestart ? (
            <button
              onClick={restartToInstallUpdate}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md transition-colors animate-pulse"
              title="Restart the application to apply the update"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Restart to Update</span>
            </button>
          ) : isDownloadingUpdate ? (
            <div className="flex items-center space-x-2 bg-indigo-900/60 px-2.5 py-1 rounded-md border border-indigo-700/50">
              <div className="w-20 bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-400 h-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-indigo-200">
                {downloadProgress}%
              </span>
            </div>
          ) : (
            <button
              onClick={startUpdateDownload}
              className="flex items-center space-x-1 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Update Now</span>
            </button>
          )}

          <button
            onClick={clearAppUpdate}
            className="p-1 rounded hover:bg-indigo-900/60 text-indigo-300 hover:text-white transition-colors"
            title="Dismiss update banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Release Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">
                  YTDeck {appUpdate.version} Release Notes
                </h3>
              </div>
              <button
                onClick={() => setShowNotesModal(false)}
                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto font-mono text-xs text-neutral-300 bg-neutral-950 p-3 rounded-lg border border-neutral-800 whitespace-pre-wrap leading-relaxed">
              {appUpdate.notes}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300"
              >
                Close
              </button>
              {!updateReadyToRestart && !isDownloadingUpdate && (
                <button
                  onClick={() => {
                    setShowNotesModal(false)
                    startUpdateDownload()
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Download & Update
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
