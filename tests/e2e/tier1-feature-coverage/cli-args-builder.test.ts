import { describe, it, expect } from 'vitest';
import { buildYtdlpArgs } from '../../helpers/cli-generator';

describe('Tier 1: Feature Coverage — CLI Arguments Builder', () => {
  // Panel 1: Output Directory & Template Options
  describe('Panel 1: Output Options', () => {
    it('should generate output directory flag (-P)', () => {
      const args = buildYtdlpArgs({ outputDir: 'C:\\Videos' });
      expect(args).toContain('-P');
      expect(args[args.indexOf('-P') + 1]).toBe('C:\\Videos');
    });

    it('should generate output filename template flag (-o)', () => {
      const args = buildYtdlpArgs({ outputTemplate: '%(uploader)s/%(title)s.%(ext)s' });
      expect(args).toContain('-o');
      expect(args[args.indexOf('-o') + 1]).toBe('%(uploader)s/%(title)s.%(ext)s');
    });

    it('should generate playlist items flag (-I)', () => {
      const args = buildYtdlpArgs({ playlistItems: '1,3,5-10' });
      expect(args).toContain('-I');
      expect(args[args.indexOf('-I') + 1]).toBe('1,3,5-10');
    });

    it('should generate concurrent fragment downloads flag (-N)', () => {
      const args = buildYtdlpArgs({ concurrentFragments: 4 });
      expect(args).toContain('-N');
      expect(args[args.indexOf('-N') + 1]).toBe('4');
    });

    it('should generate download archive path flag', () => {
      const args = buildYtdlpArgs({ downloadArchive: 'C:\\Videos\\archive.txt' });
      expect(args).toContain('--download-archive');
      expect(args[args.indexOf('--download-archive') + 1]).toBe('C:\\Videos\\archive.txt');
    });
  });

  // Panel 2: Format & Quality Options
  describe('Panel 2: Format & Quality Options', () => {
    it('should generate custom format selector string (-f)', () => {
      const args = buildYtdlpArgs({ formatSelection: 'bv*[height<=1080]+ba/b' });
      expect(args).toContain('-f');
      expect(args[args.indexOf('-f') + 1]).toBe('bv*[height<=1080]+ba/b');
    });

    it('should generate format sort criteria (-S)', () => {
      const args = buildYtdlpArgs({ formatSort: 'res:1080,fps:60,codec:vp9' });
      expect(args).toContain('-S');
      expect(args[args.indexOf('-S') + 1]).toBe('res:1080,fps:60,codec:vp9');
    });

    it('should generate merge output format flag', () => {
      const args = buildYtdlpArgs({ mergeOutputFormat: 'mkv' });
      expect(args).toContain('--merge-output-format');
      expect(args[args.indexOf('--merge-output-format') + 1]).toBe('mkv');
    });

    it('should generate check formats flag', () => {
      const args = buildYtdlpArgs({ checkFormats: true });
      expect(args).toContain('--check-formats');
    });

    it('should generate multi-stream flags', () => {
      const args = buildYtdlpArgs({ audioMultistreams: true, videoMultistreams: true });
      expect(args).toContain('--audio-multistreams');
      expect(args).toContain('--video-multistreams');
    });
  });

  // Panel 3: Subtitle Options
  describe('Panel 3: Subtitle Options', () => {
    it('should generate write subs and write auto subs flags', () => {
      const args = buildYtdlpArgs({ writeSubs: true, writeAutoSubs: true });
      expect(args).toContain('--write-subs');
      expect(args).toContain('--write-auto-subs');
    });

    it('should generate subtitle languages filter (--sub-langs)', () => {
      const args = buildYtdlpArgs({ subLangs: ['en', 'es', 'fr'] });
      expect(args).toContain('--sub-langs');
      expect(args[args.indexOf('--sub-langs') + 1]).toBe('en,es,fr');
    });

    it('should generate subtitle format and convert flags', () => {
      const args = buildYtdlpArgs({ subFormat: 'srt', convertSubs: 'vtt' });
      expect(args).toContain('--sub-format');
      expect(args[args.indexOf('--sub-format') + 1]).toBe('srt');
      expect(args).toContain('--convert-subs');
      expect(args[args.indexOf('--convert-subs') + 1]).toBe('vtt');
    });

    it('should generate embed subtitles flag (--embed-subs)', () => {
      const args = buildYtdlpArgs({ embedSubs: true });
      expect(args).toContain('--embed-subs');
    });
  });

  // Panel 4: Thumbnail Options
  describe('Panel 4: Thumbnail Options', () => {
    it('should generate write thumbnail flag', () => {
      const args = buildYtdlpArgs({ writeThumbnail: true });
      expect(args).toContain('--write-thumbnail');
    });

    it('should generate write all thumbnails flag', () => {
      const args = buildYtdlpArgs({ writeAllThumbnails: true });
      expect(args).toContain('--write-all-thumbnails');
    });

    it('should generate convert thumbnails flag', () => {
      const args = buildYtdlpArgs({ convertThumbnails: 'png' });
      expect(args).toContain('--convert-thumbnails');
      expect(args[args.indexOf('--convert-thumbnails') + 1]).toBe('png');
    });

    it('should generate embed thumbnail flag', () => {
      const args = buildYtdlpArgs({ embedThumbnail: true });
      expect(args).toContain('--embed-thumbnail');
    });
  });

  // Panel 5: Metadata & Files Options
  describe('Panel 5: Metadata & Files Options', () => {
    it('should generate write info-json and write description', () => {
      const args = buildYtdlpArgs({ writeInfoJson: true, writeDescription: true });
      expect(args).toContain('--write-info-json');
      expect(args).toContain('--write-description');
    });

    it('should generate embed metadata and chapters flags', () => {
      const args = buildYtdlpArgs({ embedMetadata: true, embedChapters: true });
      expect(args).toContain('--embed-metadata');
      expect(args).toContain('--embed-chapters');
    });

    it('should generate split chapters flag', () => {
      const args = buildYtdlpArgs({ splitChapters: true });
      expect(args).toContain('--split-chapters');
    });

    it('should generate replace in metadata arguments', () => {
      const args = buildYtdlpArgs({
        replaceInMetadata: [{ field: 'title', regex: '\\[.*\\]', replace: '' }],
      });
      expect(args).toContain('--replace-in-metadata');
      const idx = args.indexOf('--replace-in-metadata');
      expect(args[idx + 1]).toBe('title');
      expect(args[idx + 2]).toBe('\\[.*\\]');
      expect(args[idx + 3]).toBe('');
    });
  });

  // Panel 6: Post-Processing Options
  describe('Panel 6: Post-Processing Options', () => {
    it('should generate extract audio (-x) and audio format/quality', () => {
      const args = buildYtdlpArgs({ extractAudio: true, audioFormat: 'mp3', audioQuality: '0' });
      expect(args).toContain('-x');
      expect(args).toContain('--audio-format');
      expect(args[args.indexOf('--audio-format') + 1]).toBe('mp3');
      expect(args).toContain('--audio-quality');
      expect(args[args.indexOf('--audio-quality') + 1]).toBe('0');
    });

    it('should generate remux and recode video flags', () => {
      const args = buildYtdlpArgs({ remuxVideo: 'mp4', recodeVideo: 'h264' });
      expect(args).toContain('--remux-video');
      expect(args[args.indexOf('--remux-video') + 1]).toBe('mp4');
      expect(args).toContain('--recode-video');
      expect(args[args.indexOf('--recode-video') + 1]).toBe('h264');
    });

    it('should generate keep video flag (-k)', () => {
      const args = buildYtdlpArgs({ keepVideo: true });
      expect(args).toContain('-k');
    });

    it('should generate exec command flag', () => {
      const args = buildYtdlpArgs({ execCommand: 'echo "Downloaded {}"' });
      expect(args).toContain('--exec');
      expect(args[args.indexOf('--exec') + 1]).toBe('echo "Downloaded {}"');
    });
  });

  // Panel 7: SponsorBlock Options
  describe('Panel 7: SponsorBlock Options', () => {
    it('should generate sponsorblock remove categories list', () => {
      const args = buildYtdlpArgs({ sponsorblockRemove: ['sponsor', 'intro', 'outro'] });
      expect(args).toContain('--sponsorblock-remove');
      expect(args[args.indexOf('--sponsorblock-remove') + 1]).toBe('sponsor,intro,outro');
    });

    it('should generate sponsorblock mark categories list', () => {
      const args = buildYtdlpArgs({ sponsorblockMark: ['music_offtopic', 'preview'] });
      expect(args).toContain('--sponsorblock-mark');
      expect(args[args.indexOf('--sponsorblock-mark') + 1]).toBe('music_offtopic,preview');
    });

    it('should generate custom sponsorblock API endpoint', () => {
      const args = buildYtdlpArgs({ sponsorblockApi: 'https://sponsor.example.com' });
      expect(args).toContain('--sponsorblock-api');
      expect(args[args.indexOf('--sponsorblock-api') + 1]).toBe('https://sponsor.example.com');
    });
  });

  // Panel 8: Network & Proxy Options
  describe('Panel 8: Network & Proxy Options', () => {
    it('should generate proxy URL flag', () => {
      const args = buildYtdlpArgs({ proxy: 'socks5://127.0.0.1:9050' });
      expect(args).toContain('--proxy');
      expect(args[args.indexOf('--proxy') + 1]).toBe('socks5://127.0.0.1:9050');
    });

    it('should generate bandwidth rate limit (-r)', () => {
      const args = buildYtdlpArgs({ rateLimit: '2.5M' });
      expect(args).toContain('-r');
      expect(args[args.indexOf('-r') + 1]).toBe('2.5M');
    });

    it('should generate retries (-R) and socket timeout', () => {
      const args = buildYtdlpArgs({ retries: 10, socketTimeout: 45 });
      expect(args).toContain('-R');
      expect(args[args.indexOf('-R') + 1]).toBe('10');
      expect(args).toContain('--socket-timeout');
      expect(args[args.indexOf('--socket-timeout') + 1]).toBe('45');
    });

    it('should generate impersonate target', () => {
      const args = buildYtdlpArgs({ impersonate: 'chrome' });
      expect(args).toContain('--impersonate');
      expect(args[args.indexOf('--impersonate') + 1]).toBe('chrome');
    });

    it('should generate custom headers', () => {
      const args = buildYtdlpArgs({ addHeaders: { 'User-Agent': 'CustomBot/1.0', Referer: 'https://example.com' } });
      expect(args).toContain('--add-header');
      expect(args).toContain('User-Agent:CustomBot/1.0');
      expect(args).toContain('Referer:https://example.com');
    });
  });

  // Panel 9: Authentication Options
  describe('Panel 9: Authentication Options', () => {
    it('should generate username and password flags (-u, -p)', () => {
      const args = buildYtdlpArgs({ username: 'testuser', password: 'secretpassword' });
      expect(args).toContain('-u');
      expect(args[args.indexOf('-u') + 1]).toBe('testuser');
      expect(args).toContain('-p');
      expect(args[args.indexOf('-p') + 1]).toBe('secretpassword');
    });

    it('should generate twofactor and video password flags', () => {
      const args = buildYtdlpArgs({ twoFactor: '123456', videoPassword: 'videosecret' });
      expect(args).toContain('--twofactor');
      expect(args[args.indexOf('--twofactor') + 1]).toBe('123456');
      expect(args).toContain('--video-password');
      expect(args[args.indexOf('--video-password') + 1]).toBe('videosecret');
    });

    it('should generate cookies from browser flag', () => {
      const args = buildYtdlpArgs({ cookiesFromBrowser: 'firefox' });
      expect(args).toContain('--cookies-from-browser');
      expect(args[args.indexOf('--cookies-from-browser') + 1]).toBe('firefox');
    });

    it('should generate netrc flag', () => {
      const args = buildYtdlpArgs({ netrc: true });
      expect(args).toContain('--netrc');
    });
  });

  // Panel 10: Video Selection / Filters
  describe('Panel 10: Video Selection & Filters', () => {
    it('should generate filesize boundaries (--min-filesize, --max-filesize)', () => {
      const args = buildYtdlpArgs({ minFilesize: '10M', maxFilesize: '500M' });
      expect(args).toContain('--min-filesize');
      expect(args[args.indexOf('--min-filesize') + 1]).toBe('10M');
      expect(args).toContain('--max-filesize');
      expect(args[args.indexOf('--max-filesize') + 1]).toBe('500M');
    });

    it('should generate date filter criteria', () => {
      const args = buildYtdlpArgs({ date: '20260101', dateBefore: '20260601', dateAfter: '20250101' });
      expect(args).toContain('--date');
      expect(args).toContain('--datebefore');
      expect(args).toContain('--dateafter');
    });

    it('should generate match filters', () => {
      const args = buildYtdlpArgs({ matchFilters: ['like_count > 1000', 'duration < 600'] });
      expect(args).toContain('--match-filter');
      expect(args).toContain('like_count > 1000');
      expect(args).toContain('duration < 600');
    });

    it('should generate no-playlist flag and age limit', () => {
      const args = buildYtdlpArgs({ noPlaylist: true, ageLimit: 18, maxDownloads: 5 });
      expect(args).toContain('--no-playlist');
      expect(args).toContain('--age-limit');
      expect(args[args.indexOf('--age-limit') + 1]).toBe('18');
      expect(args).toContain('--max-downloads');
      expect(args[args.indexOf('--max-downloads') + 1]).toBe('5');
    });
  });

  // Panel 11: Filesystem Options
  describe('Panel 11: Filesystem Options', () => {
    it('should generate windows filenames and restrict filenames flags', () => {
      const args = buildYtdlpArgs({ windowsFilenames: true, restrictFilenames: true });
      expect(args).toContain('--windows-filenames');
      expect(args).toContain('--restrict-filenames');
    });

    it('should generate overwrite flags (-w, --force-overwrites)', () => {
      const argsNoOverwrite = buildYtdlpArgs({ noOverwrites: true });
      expect(argsNoOverwrite).toContain('-w');
      const argsForce = buildYtdlpArgs({ forceOverwrites: true });
      expect(argsForce).toContain('--force-overwrites');
    });

    it('should generate part file and continue flags', () => {
      const args = buildYtdlpArgs({ partFile: true, continueDownload: true });
      expect(args).toContain('--part');
      expect(args).toContain('-c');
    });

    it('should generate cache dir path', () => {
      const args = buildYtdlpArgs({ cacheDir: 'C:\\Temp\\ytdlp_cache' });
      expect(args).toContain('--cache-dir');
      expect(args[args.indexOf('--cache-dir') + 1]).toBe('C:\\Temp\\ytdlp_cache');
    });
  });

  // Panel 12: Extractor Options
  describe('Panel 12: Extractor Options', () => {
    it('should generate extractor arguments', () => {
      const args = buildYtdlpArgs({ extractorArgs: { youtube: 'player_client=android' } });
      expect(args).toContain('--extractor-args');
      expect(args[args.indexOf('--extractor-args') + 1]).toBe('youtube:player_client=android');
    });

    it('should generate flat playlist flag and js runtimes', () => {
      const args = buildYtdlpArgs({ flatPlaylist: true, jsRuntimes: ['node', 'deno'] });
      expect(args).toContain('--flat-playlist');
      expect(args).toContain('--js-runtimes');
      expect(args[args.indexOf('--js-runtimes') + 1]).toBe('node,deno');
    });
  });

  // Panel 13: External Downloader Options
  describe('Panel 13: External Downloader Options', () => {
    it('should generate external downloader selection (--downloader aria2c)', () => {
      const args = buildYtdlpArgs({ downloader: 'aria2c', downloaderArgs: ['-x', '16', '-s', '16'] });
      expect(args).toContain('--downloader');
      expect(args[args.indexOf('--downloader') + 1]).toBe('aria2c');
      expect(args).toContain('--downloader-args');
      expect(args[args.indexOf('--downloader-args') + 1]).toBe('-x 16 -s 16');
    });

    it('should generate HLS prefer native flag', () => {
      const args = buildYtdlpArgs({ hlsPreferNative: true });
      expect(args).toContain('--hls-prefer-native');
    });
  });

  // Panel 14: Verbosity & Simulation Options
  describe('Panel 14: Verbosity & Simulation Options', () => {
    it('should generate simulation and skip download flags (-s, --skip-download)', () => {
      const args = buildYtdlpArgs({ simulate: true, skipDownload: true });
      expect(args).toContain('-s');
      expect(args).toContain('--skip-download');
    });

    it('should generate dump json and verbose flags (-j, -v)', () => {
      const args = buildYtdlpArgs({ dumpJson: true, verbose: true });
      expect(args).toContain('-j');
      expect(args).toContain('-v');
    });

    it('should generate ignore errors and no warnings flags (-i, --no-warnings)', () => {
      const args = buildYtdlpArgs({ ignoreErrors: true, noWarnings: true });
      expect(args).toContain('-i');
      expect(args).toContain('--no-warnings');
    });
  });
});
