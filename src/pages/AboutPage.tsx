import React from 'react'
import { Github, ExternalLink, ShieldCheck } from 'lucide-react'

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 select-text py-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/30">
          <span className="font-black text-white text-base">YT</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-100">yt-dlp GUI</h1>
          <p className="text-xs text-neutral-400">High-Performance Desktop Client for yt-dlp</p>
        </div>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3 text-xs leading-relaxed text-neutral-300">
        <p>
          A fast, modern desktop application built on top of <strong>Tauri 2</strong> and <strong>React 19</strong>,
          providing an intuitive visual interface, format selector, and batch management for <strong>yt-dlp</strong>.
        </p>
        <div className="flex items-center space-x-4 pt-2 font-medium">
          <a
            href="https://github.com/Shival-Gupta/yt-dlp-gui"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>Project Repository</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://github.com/yt-dlp/yt-dlp"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 text-rose-400 hover:text-rose-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>yt-dlp Official</span>
          </a>
        </div>
      </div>

      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3 text-xs">
        <div className="flex items-center space-x-2 text-neutral-200 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Open Source Licenses</span>
        </div>
        <ul className="space-y-1.5 text-neutral-400 pl-2">
          <li>• <strong>yt-dlp-gui</strong>: Licensed under the MIT License</li>
          <li>• <strong>yt-dlp</strong>: Unlicense (Public Domain)</li>
          <li>• <strong>FFmpeg</strong>: LGPL 2.1+ / GPL 3.0+</li>
          <li>• <strong>Tauri</strong>: MIT or Apache 2.0</li>
        </ul>
      </div>
    </div>
  )
}
