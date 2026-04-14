import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { tandemDir } from '../utils/paths';
import { BrowserWindow, session } from 'electron';
import { StealthManager } from '../stealth/manager';
import { wingmanAlert } from '../notifications/alert';
import { DEFAULT_TIMEOUT_MS } from '../utils/constants';
import { createLogger } from '../utils/logger';

const log = createLogger('Watcher');

// ─── Types ──────────────────────────────────────────────────────────

export interface WatchEntry {
  id: string;
  url: string;
  intervalMs: number;
  lastCheck: number | null;
  lastHash: string | null;
  lastTitle: string | null;
  lastError: string | null;
  changeCount: number;
  createdAt: number;
}

interface WatchState {
  watches: WatchEntry[];
}

export type WatchCheckReason = 'initial' | 'manual' | 'timer';

export interface WatchSnapshotEvent {
  type: 'snapshot';
  watches: WatchEntry[];
  emittedAt: number;
}

export interface WatchAddedEvent {
  type: 'watch-added';
  watch: WatchEntry;
  emittedAt: number;
}

export interface WatchRemovedEvent {
  type: 'watch-removed';
  watch: WatchEntry;
  emittedAt: number;
}

export interface WatchCheckStartedEvent {
  type: 'watch-check-started';
  watch: WatchEntry;
  reason: WatchCheckReason;
  emittedAt: number;
}

export interface WatchCheckedEvent {
  type: 'watch-checked';
  watch: WatchEntry;
  reason: WatchCheckReason;
  changed: boolean;
  error?: string;
  emittedAt: number;
}

export type WatchLiveEvent =
  | WatchSnapshotEvent
  | WatchAddedEvent
  | WatchRemovedEvent
  | WatchCheckStartedEvent
  | WatchCheckedEvent;

// ─── Manager ────────────────────────────────────────────────────────

/**
 * WatchManager — Scheduled background page watching.
 *
 * Uses a hidden BrowserWindow to periodically check pages for changes.
 * Hashes page text content and compares with previous check.
 * Alerts the human/wingman when something changes.
 */
export class WatchManager extends EventEmitter {

  // === 1. Private state ===

  private watchFile: string;
  private state: WatchState;
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private hiddenWindow: BrowserWindow | null = null;
  private counter = 0;
  private checking = false;
  private readonly MAX_WATCHES = 20;

  // === 2. Constructor ===

  constructor() {
    super();
    const baseDir = tandemDir();
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

    this.watchFile = path.join(baseDir, 'watches.json');
    this.state = this.load();
    this.startAllTimers();
  }

  // === 4. Public methods ===

  /** Add a new watch */
  addWatch(url: string, intervalMinutes: number): WatchEntry | { error: string } {
    if (this.state.watches.length >= this.MAX_WATCHES) {
      return { error: `Maximum ${this.MAX_WATCHES} watches bereikt` };
    }

    // Check for duplicate
    if (this.state.watches.some(w => w.url === url)) {
      return { error: 'URL is already being watched' };
    }

    const watch: WatchEntry = {
      id: this.nextId(),
      url,
      intervalMs: Math.max(1, intervalMinutes) * 60 * 1000,
      lastCheck: null,
      lastHash: null,
      lastTitle: null,
      lastError: null,
      changeCount: 0,
      createdAt: Date.now(),
    };

    this.state.watches.push(watch);
    this.save();
    this.startTimer(watch);
    this.emitWatchEvent({
      type: 'watch-added',
      watch: this.cloneWatch(watch),
      emittedAt: Date.now(),
    });

    // Do an initial check
    this.checkUrl(watch.id, 'initial').catch((e) => log.warn('Watch check failed for ' + watch.id + ':', e.message));

    return watch;
  }

  /** Remove a watch by id or url */
  removeWatch(idOrUrl: string): boolean {
    const idx = this.state.watches.findIndex(w => w.id === idOrUrl || w.url === idOrUrl);
    if (idx === -1) return false;

    const watch = this.state.watches[idx];
    this.stopTimer(watch.id);
    this.state.watches.splice(idx, 1);
    this.save();
    this.emitWatchEvent({
      type: 'watch-removed',
      watch: this.cloneWatch(watch),
      emittedAt: Date.now(),
    });
    return true;
  }

  /** List all watches */
  listWatches(): WatchEntry[] {
    return this.state.watches.map(watch => this.cloneWatch(watch));
  }

  /** Force check a specific watch or all watches */
  async forceCheck(idOrUrl?: string): Promise<{ results: { id: string; changed: boolean; error?: string }[] }> {
    const targets = idOrUrl
      ? this.state.watches.filter(w => w.id === idOrUrl || w.url === idOrUrl)
      : this.state.watches;

    const results: { id: string; changed: boolean; error?: string }[] = [];
    for (const watch of targets) {
      const result = await this.checkUrl(watch.id, 'manual');
      results.push({ id: watch.id, ...result });
    }
    return { results };
  }

  /** Check a single URL for changes */
  async checkUrl(watchId: string, reason: WatchCheckReason = 'manual'): Promise<{ changed: boolean; error?: string }> {
    const watch = this.state.watches.find(w => w.id === watchId);
    if (!watch) return { changed: false, error: 'Watch not found' };

    // Prevent concurrent checks
    if (this.checking) return { changed: false, error: 'Already checking' };
    this.checking = true;
    this.emitWatchEvent({
      type: 'watch-check-started',
      watch: this.cloneWatch(watch),
      reason,
      emittedAt: Date.now(),
    });

    try {
      const win = await this.getHiddenWindow();

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Page load timeout'));
        }, DEFAULT_TIMEOUT_MS);

        win.webContents.once('did-finish-load', () => {
          clearTimeout(timeout);
          // Small delay for dynamic content
          setTimeout(resolve, 2000);
        });

        win.webContents.once('did-fail-load', (_event, errorCode, errorDescription) => {
          clearTimeout(timeout);
          reject(new Error(`Load failed: ${errorDescription} (${errorCode})`));
        });

        win.webContents.loadURL(watch.url).catch(reject);
      });

      // Extract text content
      const textContent: string = await win.webContents.executeJavaScript(`
        document.body ? document.body.innerText.replace(/\\s+/g, ' ').trim() : ''
      `);

      const title: string = await win.webContents.executeJavaScript('document.title');
      const newHash = this.hashContent(textContent);
      const changed = watch.lastHash !== null && watch.lastHash !== newHash;

      watch.lastCheck = Date.now();
      watch.lastTitle = title;
      watch.lastError = null;

      if (changed) {
        watch.changeCount++;
        wingmanAlert(
          `Page changed: ${watch.lastTitle || watch.url}`,
          `${watch.url} changed since the previous check.`
        );
      }

      watch.lastHash = newHash;
      this.save();
      this.emitWatchEvent({
        type: 'watch-checked',
        watch: this.cloneWatch(watch),
        reason,
        changed,
        emittedAt: Date.now(),
      });

      return { changed };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      watch.lastCheck = Date.now();
      watch.lastError = message;
      this.save();
      this.emitWatchEvent({
        type: 'watch-checked',
        watch: this.cloneWatch(watch),
        reason,
        changed: false,
        error: message,
        emittedAt: Date.now(),
      });
      return { changed: false, error: message };
    } finally {
      this.checking = false;
    }
  }

  /** Subscribe to live watch events. Returns an unsubscribe function. */
  subscribe(cb: (event: WatchLiveEvent) => void): () => void {
    this.on('watch-event', cb);
    return () => {
      this.off('watch-event', cb);
    };
  }

  /** Build a current-state snapshot for newly connected live clients. */
  getSnapshot(): WatchSnapshotEvent {
    return {
      type: 'snapshot',
      watches: this.listWatches(),
      emittedAt: Date.now(),
    };
  }

  // === 6. Cleanup ===

  /** Cleanup — stop all timers and close hidden window */
  destroy(): void {
    for (const [id] of this.timers) {
      this.stopTimer(id);
    }
    if (this.hiddenWindow && !this.hiddenWindow.isDestroyed()) {
      this.hiddenWindow.close();
    }
  }

  // === 7. Private I/O ===

  private load(): WatchState {
    try {
      if (fs.existsSync(this.watchFile)) {
        return JSON.parse(fs.readFileSync(this.watchFile, 'utf-8'));
      }
    } catch (e) { log.warn('Watch state load failed, starting fresh:', e instanceof Error ? e.message : String(e)); }
    return { watches: [] };
  }

  private save(): void {
    fs.writeFileSync(this.watchFile, JSON.stringify(this.state, null, 2));
  }

  private nextId(): string {
    return `watch-${Date.now()}-${++this.counter}`;
  }

  /** Create hidden BrowserWindow for background checks */
  private async getHiddenWindow(): Promise<BrowserWindow> {
    if (this.hiddenWindow && !this.hiddenWindow.isDestroyed()) {
      return this.hiddenWindow;
    }

    const partition = 'persist:tandem';
    const _ses = session.fromPartition(partition);

    this.hiddenWindow = new BrowserWindow({
      show: false,
      width: 1280,
      height: 800,
      webPreferences: {
        partition,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Apply stealth script after page loads
    this.hiddenWindow.webContents.on('did-finish-load', () => {
      this.hiddenWindow?.webContents.executeJavaScript(StealthManager.getStealthScript()).catch((e) => log.warn('Watch stealth injection failed:', e.message));
    });

    return this.hiddenWindow;
  }

  /** Hash text content of a page */
  private hashContent(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
  }

  private cloneWatch(watch: WatchEntry): WatchEntry {
    return { ...watch };
  }

  private emitWatchEvent(event: WatchLiveEvent): void {
    this.emit('watch-event', event);
  }

  /** Start timer for a single watch */
  private startTimer(watch: WatchEntry): void {
    this.stopTimer(watch.id);
    const timer = setInterval(() => {
      this.checkUrl(watch.id, 'timer').catch((e) => log.warn('Watch check failed for ' + watch.id + ':', e.message));
    }, watch.intervalMs);
    this.timers.set(watch.id, timer);
  }

  /** Stop timer for a watch */
  private stopTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }

  /** Start all timers from saved state */
  private startAllTimers(): void {
    for (const watch of this.state.watches) {
      this.startTimer(watch);
    }
  }
}
