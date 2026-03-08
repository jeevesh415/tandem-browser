    function escapeHtml(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    }

    // ═══════════════════════════════════════════════
    // Platform detection & Chrome-style title bar setup
    // ═══════════════════════════════════════════════

    // Detect platform and add class to body for CSS targeting
    (async () => {
      const platform = await window.tandem?.getPlatform?.() || 'unknown';
      document.body.classList.add(`platform-${platform}`);
    })();

    // Hamburger menu button
    const btnAppMenu = document.getElementById('btn-app-menu');
    if (btnAppMenu) {
      btnAppMenu.addEventListener('click', (e) => {
        if (window.tandem) {
          const rect = btnAppMenu.getBoundingClientRect();
          window.tandem.showAppMenu(Math.round(rect.left), Math.round(rect.bottom));
        }
      });
    }

    // Window control buttons (Linux/Windows)
    const btnMinimize = document.getElementById('btn-window-minimize');
    const btnMaximize = document.getElementById('btn-window-maximize');
    const btnClose = document.getElementById('btn-window-close');

    if (btnMinimize) {
      btnMinimize.addEventListener('click', () => {
        if (window.tandem) window.tandem.minimizeWindow();
      });
    }

    if (btnMaximize) {
      btnMaximize.addEventListener('click', () => {
        if (window.tandem) window.tandem.maximizeWindow();
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        if (window.tandem) window.tandem.closeWindow();
      });
    }

    // Double-click on tab bar (empty areas) to maximize/restore
    const tabBarEl = document.getElementById('tab-bar');
    if (tabBarEl) {
      tabBarEl.addEventListener('dblclick', (e) => {
        // Only trigger if clicking on the tab bar itself (not on tabs or buttons)
        if (e.target === tabBarEl || e.target.classList.contains('tab-bar-spacer')) {
          if (window.tandem) window.tandem.maximizeWindow();
        }
      });
    }

    // Update maximize button icon when window state changes
    async function updateMaximizeButton() {
      if (btnMaximize && window.tandem?.isWindowMaximized) {
        const isMaximized = await window.tandem.isWindowMaximized();
        if (isMaximized) {
          // Restore icon (two overlapping squares)
          btnMaximize.innerHTML = '<svg viewBox="0 0 10 10"><path d="M2,2 L8,2 L8,8 L2,8 Z M3,3 L3,7 L7,7 L7,3 Z M3,1 L9,1 L9,7 M1,3 L1,9 L7,9" stroke="currentColor" fill="none" stroke-width="1" /></svg>';
          btnMaximize.title = 'Restore';
        } else {
          // Maximize icon (single square)
          btnMaximize.innerHTML = '<svg viewBox="0 0 10 10"><path d="M0,0 L10,0 L10,10 L0,10 Z M1,1 L1,9 L9,9 L9,1 Z" /></svg>';
          btnMaximize.title = 'Maximize';
        }
      }
    }

    // Update on resize with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateMaximizeButton, 100);
    });

    // Initial update
    updateMaximizeButton();

    // ═══════════════════════════════════════════════
    // Tab management system (renderer side)
    // ═══════════════════════════════════════════════

    const tabBar = document.getElementById('tab-bar');
    const btnNewTab = document.getElementById('btn-new-tab');
    const urlBar = document.getElementById('url-bar');
    const statusDot = document.getElementById('status-dot');
    const container = document.getElementById('webview-container');
    const overlay = document.getElementById('wingman-overlay');

    /** Map of tabId → { webview, tabEl } */
    const tabs = new Map();
    let activeTabId = null;

    /**
     * Exposed to main process via window.__tandemTabs
     * TabManager calls these via executeJavaScript
     */
    window.__tandemTabs = {
      /** Create a new webview, return its webContentsId */
      createTab(tabId, url, partition) {
        partition = partition || 'persist:tandem';
        const wv = document.createElement('webview');
        wv.setAttribute('src', url);
        wv.setAttribute('allowpopups', '');
        wv.setAttribute('partition', partition);
        wv.dataset.tabId = tabId;
        container.appendChild(wv);

        // Create tab bar element
        const tabEl = document.createElement('div');
        tabEl.className = 'tab';
        tabEl.dataset.tabId = tabId;
        tabEl.draggable = true;
        tabEl.innerHTML = `
          <span class="tab-source" title="You controlled">👤</span>
          <span class="group-dot" style="display:none"></span>
          <img class="tab-favicon" src="" style="display:none">
          <span class="tab-title">New Tab</span>
          <button class="tab-close" title="Close tab">✕</button>
        `;

        // Click to focus
        tabEl.addEventListener('click', (e) => {
          if (e.target.classList.contains('tab-close')) return;
          if (window.tandem) window.tandem.focusTab(tabId);
        });

        // Right-click context menu (custom DOM menu for workspace move)
        tabEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (window.__tandemShowTabContextMenu) {
            window.__tandemShowTabContextMenu(tabEl.dataset.tabId, e.clientX, e.clientY);
          }
        });

        // Drag start for workspace drag-and-drop
        tabEl.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/tab-id', tabEl.dataset.tabId);
          e.dataTransfer.effectAllowed = 'move';
        });

        // Close button
        tabEl.querySelector('.tab-close').addEventListener('click', () => {
          if (window.tandem) window.tandem.closeTab(tabId);
        });

        // Insert before the + button
        tabBar.insertBefore(tabEl, btnNewTab);

        tabs.set(tabId, { webview: wv, tabEl });

        // Wire up webview events
        wv.addEventListener('did-navigate', (e) => updateTabMeta(tabId, { url: e.url }));
        wv.addEventListener('did-navigate-in-page', (e) => {
          if (e.isMainFrame) updateTabMeta(tabId, { url: e.url });
        });
        wv.addEventListener('page-title-updated', (e) => updateTabMeta(tabId, { title: e.title }));
        wv.addEventListener('page-favicon-updated', (e) => {
          if (e.favicons && e.favicons.length > 0) {
            updateTabMeta(tabId, { favicon: e.favicons[0] });
          }
        });
        wv.addEventListener('did-start-loading', () => {
          if (tabId === activeTabId) statusDot.classList.add('loading');
        });
        wv.addEventListener('did-stop-loading', () => {
          if (tabId === activeTabId) statusDot.classList.remove('loading');
        });

        // Return webContentsId (available after dom-ready).
        // A 15-second timeout guards against the Electron edge-case where dom-ready
        // never fires (e.g. renderer overload, webview creation failure). On timeout
        // the partial renderer state (webview + tabEl + tabs Map entry) is cleaned up
        // so it doesn't become an uncloseable zombie.
        const TAB_INIT_TIMEOUT_MS = 15000;
        return new Promise((resolve, reject) => {
          let settled = false;

          const cleanupPartial = () => {
            const e = tabs.get(tabId);
            if (e) {
              try { e.webview.remove(); } catch { /* best-effort */ }
              try { e.tabEl.remove(); } catch { /* best-effort */ }
            }
            tabs.delete(tabId);
          };

          const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            cleanupPartial();
            reject(new Error(`Tab init timeout (${TAB_INIT_TIMEOUT_MS}ms): ${url}`));
          }, TAB_INIT_TIMEOUT_MS);

          wv.addEventListener('dom-ready', () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(wv.getWebContentsId());
          }, { once: true });
        });
      },

      /** Remove a tab */
      removeTab(tabId) {
        const entry = tabs.get(tabId);
        if (!entry) return;
        entry.webview.remove();
        entry.tabEl.remove();
        tabs.delete(tabId);
      },

      /**
       * Return all tab IDs currently tracked by the renderer.
       * Used by the main process for reconciliation (orphan detection).
       */
      getTabIds() {
        return Array.from(tabs.keys());
      },

      /**
       * Force-remove a tab from renderer state without going through normal close flow.
       * Used by the main process to clean up orphaned renderer tabs that it has lost
       * track of (e.g. after a failed openTab() or an unexpected renderer state reset).
       * Returns true if the tab was found and removed, false if it was unknown.
       */
      cleanupOrphan(tabId) {
        const entry = tabs.get(tabId);
        if (!entry) return false;
        try { entry.webview.remove(); } catch { /* best-effort */ }
        try { entry.tabEl.remove(); } catch { /* best-effort */ }
        tabs.delete(tabId);
        return true;
      },

      /** Focus/show a tab */
      focusTab(tabId) {
        // Hide all webviews, show the target
        for (const [id, entry] of tabs) {
          if (id === tabId) {
            entry.webview.classList.add('active');
            entry.tabEl.classList.add('active');
          } else {
            entry.webview.classList.remove('active');
            entry.tabEl.classList.remove('active');
          }
        }
        activeTabId = tabId;

        // Update URL bar
        const entry = tabs.get(tabId);
        if (entry) {
          try {
            const url = entry.webview.getURL();
            urlBar.value = url || '';
          } catch (_) { }

          // Restore zoom level for this tab
          const zoomLevel = tabZoomLevels.get(tabId) || 0;
          entry.webview.setZoomLevel(zoomLevel);
        }

        // Per-tab canvas visibility: will be handled by draw system
        // Defer to avoid scope issues with redraw() function
        setTimeout(() => {
          const canvas = document.getElementById('draw-canvas');
          const toolbar = document.getElementById('draw-toolbar');

          if (typeof redraw === 'function') {
            if (drawCanvasTabId === tabId && drawEnabled) {
              // Active draw mode on this tab - show canvas and toolbar
              if (canvas) canvas.classList.add('active');
              // Install scroll listener for this tab
              const entry = tabs.get(tabId);
              if (entry && entry.webview) {
                installScrollListener(entry.webview, tabId);
              }
              if (toolbar) toolbar.classList.add('visible');
              redraw(); // Render shapes for this tab
            } else if (typeof tabShapes !== 'undefined' && tabShapes.has(tabId) && tabShapes.get(tabId).length > 0) {
              // This tab has saved shapes (but draw mode might be off) - show canvas only
              if (canvas) canvas.classList.add('active');
              if (toolbar) toolbar.classList.remove('visible');
              // Temporarily set drawCanvasTabId to render this tab's shapes
              const prevTabId = drawCanvasTabId;
              drawCanvasTabId = tabId;
              redraw();
              drawCanvasTabId = prevTabId;
            } else {
              // No shapes and no active draw mode - hide everything
              if (canvas) canvas.classList.remove('active');
              if (toolbar) toolbar.classList.remove('visible');
            }
          }
        }, 0);
      },
    };

    /** Update tab metadata in both UI and main process */
    function updateTabMeta(tabId, data) {
      const entry = tabs.get(tabId);
      if (!entry) return;

      if (data.title) {
        entry.tabEl.querySelector('.tab-title').textContent = data.title;
        if (tabId === activeTabId) document.title = `${data.title} — Tandem`;
      }
      if (data.url && tabId === activeTabId) {
        urlBar.value = data.url;
      }
      if (data.favicon) {
        const img = entry.tabEl.querySelector('.tab-favicon');
        img.src = data.favicon;
        img.style.display = '';
      }

      // Notify main process
      if (window.tandem) {
        window.tandem.sendTabUpdate({ tabId, ...data });
      }
    }

    // ═══════════════════════════════════════════════
    // Initial tab — create on load
    // ═══════════════════════════════════════════════

    (async () => {
      // The initial tab is created by the renderer, then registered with main
      // Determine newtab URL — use file:// path to shell/newtab.html
      const shellPath = window.location.href.replace(/\/[^/]*$/, '');
      const initialUrl = shellPath + '/newtab.html';
      const wv = document.createElement('webview');
      wv.setAttribute('src', initialUrl);
      wv.setAttribute('allowpopups', '');
      wv.setAttribute('partition', 'persist:tandem');
      wv.dataset.tabId = '__initial';
      container.appendChild(wv);

      const tabEl = document.createElement('div');
      tabEl.className = 'tab active';
      tabEl.dataset.tabId = '__initial';
      tabEl.draggable = true;
      tabEl.innerHTML = `
        <span class="tab-source" title="You controlled">👤</span>
        <span class="group-dot" style="display:none"></span>
        <img class="tab-favicon" src="" style="display:none">
        <span class="tab-title">New Tab</span>
        <button class="tab-close" title="Close tab">✕</button>
      `;
      tabBar.insertBefore(tabEl, btnNewTab);

      wv.classList.add('active');
      activeTabId = '__initial';
      urlBar.value = '';

      tabs.set('__initial', { webview: wv, tabEl });

      // Wire up events
      wv.addEventListener('did-navigate', (e) => updateTabMeta('__initial', { url: e.url }));
      wv.addEventListener('did-navigate-in-page', (e) => {
        if (e.isMainFrame) updateTabMeta('__initial', { url: e.url });
      });
      wv.addEventListener('page-title-updated', (e) => updateTabMeta('__initial', { title: e.title }));
      wv.addEventListener('page-favicon-updated', (e) => {
        if (e.favicons && e.favicons.length > 0) updateTabMeta('__initial', { favicon: e.favicons[0] });
      });
      wv.addEventListener('did-start-loading', () => statusDot.classList.add('loading'));
      wv.addEventListener('did-stop-loading', () => statusDot.classList.remove('loading'));

      // Register with main process once ready
      wv.addEventListener('dom-ready', () => {
        const wcId = wv.getWebContentsId();
        if (window.tandem) {
          window.tandem.registerTab(wcId, initialUrl);
        }
      }, { once: true });

      // Handle the rename once main assigns a real tabId
      if (window.tandem) {
        window.tandem.onTabRegistered((data) => {
          const entry = tabs.get('__initial');
          if (entry) {
            tabs.delete('__initial');
            entry.webview.dataset.tabId = data.tabId;
            entry.tabEl.dataset.tabId = data.tabId;

            // Rewire click handlers
            entry.tabEl.onclick = null;
            entry.tabEl.addEventListener('click', (e) => {
              if (e.target.classList.contains('tab-close')) return;
              if (window.tandem) window.tandem.focusTab(data.tabId);
            });
            entry.tabEl.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              if (window.__tandemShowTabContextMenu) {
                window.__tandemShowTabContextMenu(entry.tabEl.dataset.tabId, e.clientX, e.clientY);
              }
            });
            entry.tabEl.querySelector('.tab-close').addEventListener('click', () => {
              if (window.tandem) window.tandem.closeTab(data.tabId);
            });

            tabs.set(data.tabId, entry);
            activeTabId = data.tabId;

            // Re-register event listeners with new tabId
            entry.webview.addEventListener('did-navigate', (e) => updateTabMeta(data.tabId, { url: e.url }));
            entry.webview.addEventListener('page-title-updated', (e) => updateTabMeta(data.tabId, { title: e.title }));
            entry.webview.addEventListener('page-favicon-updated', (e) => {
              if (e.favicons && e.favicons.length > 0) updateTabMeta(data.tabId, { favicon: e.favicons[0] });
            });
          }
        });
      }

      // Tab close handler for initial tab
      tabEl.querySelector('.tab-close').addEventListener('click', () => {
        if (window.tandem && activeTabId) window.tandem.closeTab(activeTabId);
      });
      tabEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) return;
        if (window.tandem && activeTabId) window.tandem.focusTab(activeTabId);
      });
      // contextmenu listener is added in onTabRegistered handler (with resolved tabId)

      // Drag start for workspace drag-and-drop
      tabEl.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/tab-id', tabEl.dataset.tabId);
        e.dataTransfer.effectAllowed = 'move';
      });
    })();

    // ═══════════════════════════════════════════════
    // Navigation toolbar
    // ═══════════════════════════════════════════════

    document.getElementById('btn-back').onclick = () => {
      const entry = tabs.get(activeTabId);
      if (entry) entry.webview.goBack();
    };
    document.getElementById('btn-forward').onclick = () => {
      const entry = tabs.get(activeTabId);
      if (entry) entry.webview.goForward();
    };
    document.getElementById('btn-reload').onclick = () => {
      const entry = tabs.get(activeTabId);
      if (entry) entry.webview.reload();
    };

    urlBar.addEventListener('focus', () => urlBar.select());
    urlBar.addEventListener('click', () => urlBar.select());

    urlBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        let url = urlBar.value.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          if (url.includes('.') && !url.includes(' ')) {
            url = 'https://' + url;
          } else {
            url = 'https://duckduckgo.com/?q=' + encodeURIComponent(url);
          }
        }
        const entry = tabs.get(activeTabId);
        if (entry) entry.webview.loadURL(url);
      }
    });

    // ═══════════════════════════════════════════════
    // New tab button
    // ═══════════════════════════════════════════════

    btnNewTab.addEventListener('click', () => {
      if (window.tandem) window.tandem.newTab();
    });

    // ═══════════════════════════════════════════════
    // Keyboard shortcuts (from main process)
    // ═══════════════════════════════════════════════

    if (window.tandem) {
      window.tandem.onShortcut((action) => {
        if (action === 'new-tab') {
          window.tandem.newTab();
        } else if (action === 'close-tab') {
          if (activeTabId) window.tandem.closeTab(activeTabId);
        } else if (action === 'quick-screenshot') {
          window.tandem.quickScreenshot();
        } else if (action === 'open-settings') {
          openSettings();
        } else if (action === 'bookmark-page') {
          openBookmarkPopup();
        } else if (action === 'toggle-bookmarks-bar') {
          toggleBookmarksBar();
        } else if (action === 'find-in-page') {
          toggleFindBar(true);
        } else if (action === 'open-history') {
          openHistoryPage();
        } else if (action === 'open-bookmarks') {
          if (typeof ocSidebar !== 'undefined') ocSidebar.activateItem('bookmarks');
        } else if (action === 'show-about') {
          renderAboutPanel();
         } else if (action === 'show-shortcuts') {
          showShortcutsOverlay();
        } else if (action === 'zoom-in') {
          changeZoom('in');
        } else if (action === 'zoom-out') {
          changeZoom('out');
        } else if (action === 'zoom-reset') {
          changeZoom('reset');
        } else if (action.startsWith('focus-tab-')) {
          const index = parseInt(action.replace('focus-tab-', ''), 10);
          window.tandem.focusTabByIndex(index);
        } else if (action === 'claronote-record') {
          // Switch to ClaroNote tab and toggle recording
          document.querySelectorAll('.panel-tab').forEach(b => b.classList.remove('active'));
          document.querySelector('[data-panel-tab="claronote"]').classList.add('active');
          document.getElementById('panel-activity').style.display = 'none';
          document.getElementById('panel-chat').style.display = 'none';
          document.getElementById('panel-screenshots').style.display = 'none';
          document.getElementById('panel-claronote').style.display = 'flex';

          // Open panel if closed
          if (!document.getElementById('wingman-panel').classList.contains('open')) {
            document.getElementById('wingman-panel').classList.add('open');
            if (typeof window.updatePanelLayout === 'function') {
              window.updatePanelLayout();
            }
          }

          // Initialize and toggle recording
          if (typeof window.initClaroNote === 'function') {
            window.initClaroNote().then(() => {
              if (typeof window.toggleClaroNoteRecording === 'function') {
                window.toggleClaroNoteRecording();
              }
            });
          }
        } else if (action === 'voice-input') {
          // Toggle voice input
          if (window.tandem) window.tandem.toggleVoice();
        } else if (action === 'show-onboarding') {
          // Manually show onboarding
          showOnboarding();
        }
      });

      // Open URL in new tab (from About window links)

    }

    // ═══════════════════════════════════════════════
    // Zoom functionality
    // ═══════════════════════════════════════════════

    let tabZoomLevels = new Map(); // Store zoom levels per tab
    let zoomIndicatorTimeout = null;

    function changeZoom(direction) {
      const entry = tabs.get(activeTabId);
      if (!entry) return;

      const currentZoom = tabZoomLevels.get(activeTabId) || 0;
      let newZoom = currentZoom;

      if (direction === 'in') {
        newZoom = Math.min(currentZoom + 1, 5); // Max zoom in
      } else if (direction === 'out') {
        newZoom = Math.max(currentZoom - 1, -5); // Max zoom out
      } else if (direction === 'reset') {
        newZoom = 0;
      }

      if (newZoom !== currentZoom) {
        tabZoomLevels.set(activeTabId, newZoom);
        entry.webview.setZoomLevel(newZoom);
        showZoomIndicator(newZoom);
      }
    }

    function showZoomIndicator(zoomLevel) {
      // Create or get zoom indicator
      let indicator = document.getElementById('zoom-indicator');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'zoom-indicator';
        indicator.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          z-index: 9999;
          pointer-events: none;
          backdrop-filter: blur(4px);
          transition: opacity 0.3s ease;
        `;
        document.body.appendChild(indicator);
      }

      const percentage = Math.round(Math.pow(1.2, zoomLevel) * 100);
      indicator.textContent = `${percentage}%`;
      indicator.style.opacity = '1';

      // Clear previous timeout
      if (zoomIndicatorTimeout) {
        clearTimeout(zoomIndicatorTimeout);
      }

      // Hide after 2 seconds
      zoomIndicatorTimeout = setTimeout(() => {
        indicator.style.opacity = '0';
      }, 2000);
    }

    window.__tandemRenderer = {
      escapeHtml,
      overlay,
      getTabs() {
        return tabs;
      },
      getActiveTabId() {
        return activeTabId;
      },
    };


    // ═══════════════════════════════════════════════
    // Draw/Annotatie Tool
    // ═══════════════════════════════════════════════

    const drawCanvas = document.getElementById('draw-canvas');
    const drawToolbar = document.getElementById('draw-toolbar');
    const ctx = drawCanvas.getContext('2d');

    let drawEnabled = false;
    let drawCanvasTabId = null; // Track which tab the canvas belongs to
    let currentTool = 'line';
    let currentColor = '#e94560';
    let toolActive = false; // Tool is actively selected (can draw)
    let isDrawing = false;
    let startX = 0, startY = 0;
    /** Store completed shapes PER TAB */
    const tabShapes = new Map(); // Map<tabId, shapes[]>
    /** Store scroll offset PER TAB */
    const tabScrollOffsets = new Map(); // Map<tabId, {x, y}>
    /** Current freeform path points */
    let currentPath = [];

    // Helper: get shapes array for current tab (create if not exists)
    function getShapesForCurrentTab() {
      if (!drawCanvasTabId) return [];
      if (!tabShapes.has(drawCanvasTabId)) {
        tabShapes.set(drawCanvasTabId, []);
      }
      return tabShapes.get(drawCanvasTabId);
    }

    // Helper: get scroll offset for current tab
    function getScrollOffset() {
      if (!drawCanvasTabId) return { x: 0, y: 0 };
      if (!tabScrollOffsets.has(drawCanvasTabId)) {
        tabScrollOffsets.set(drawCanvasTabId, { x: 0, y: 0 });
      }
      return tabScrollOffsets.get(drawCanvasTabId);
    }

    function resizeCanvas() {
      const rect = drawCanvas.parentElement.getBoundingClientRect();
      drawCanvas.width = rect.width;
      drawCanvas.height = rect.height;
      redraw();
    }
    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 100);

    // Scroll polling interval handle
    let scrollPollInterval = null;

    // Install scroll listener in webview to track page scroll position
    const scrollJS = `(function() {
      return {
        x: window.scrollX || window.pageXOffset || 0,
        y: window.scrollY || window.pageYOffset || 0
      };
    })();`;

    async function installScrollListener(wv, tabId) {
      // Stop any existing polling
      if (scrollPollInterval) {
        clearInterval(scrollPollInterval);
        scrollPollInterval = null;
      }

      // Immediate first read of scroll position
      try {
        const initialScroll = await wv.executeJavaScript(scrollJS);
        tabScrollOffsets.set(tabId, initialScroll);
        redraw();
      } catch (err) {
        tabScrollOffsets.set(tabId, { x: 0, y: 0 });
      }

      // Continue polling for scroll changes
      scrollPollInterval = setInterval(async () => {
        if (!drawEnabled || drawCanvasTabId !== tabId) {
          clearInterval(scrollPollInterval);
          scrollPollInterval = null;
          return;
        }

        try {
          const scrollPos = await wv.executeJavaScript(scrollJS);
          const currentOffset = tabScrollOffsets.get(tabId) || { x: 0, y: 0 };
          if (scrollPos.x !== currentOffset.x || scrollPos.y !== currentOffset.y) {
            tabScrollOffsets.set(tabId, scrollPos);
            redraw();
          }
        } catch (err) {
          // Webview might be destroyed or navigating
        }
      }, 50);
    }

    function redraw() {
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      const shapes = getShapesForCurrentTab();
      const scroll = getScrollOffset();

      // Apply scroll offset: translate canvas so shapes stay at page position
      ctx.save();
      ctx.translate(-scroll.x, -scroll.y);

      for (const shape of shapes) {
        drawShape(shape);
      }

      ctx.restore();
    }

    function drawShape(s) {
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (s.type === 'line') {
        ctx.beginPath();
        if (s.points.length > 0) {
          ctx.moveTo(s.points[0].x, s.points[0].y);
          for (let i = 1; i < s.points.length; i++) {
            ctx.lineTo(s.points[i].x, s.points[i].y);
          }
        }
        ctx.stroke();
      } else if (s.type === 'rect') {
        ctx.strokeRect(s.x, s.y, s.w, s.h);
      } else if (s.type === 'circle') {
        const rx = Math.abs(s.w) / 2;
        const ry = Math.abs(s.h) / 2;
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (s.type === 'arrow') {
        const dx = s.ex - s.sx;
        const dy = s.ey - s.sy;
        const angle = Math.atan2(dy, dx);
        const len = Math.sqrt(dx * dx + dy * dy);
        // Line
        ctx.beginPath();
        ctx.moveTo(s.sx, s.sy);
        ctx.lineTo(s.ex, s.ey);
        ctx.stroke();
        // Arrowhead
        const headLen = Math.min(20, len * 0.3);
        ctx.beginPath();
        ctx.moveTo(s.ex, s.ey);
        ctx.lineTo(s.ex - headLen * Math.cos(angle - 0.4), s.ey - headLen * Math.sin(angle - 0.4));
        ctx.moveTo(s.ex, s.ey);
        ctx.lineTo(s.ex - headLen * Math.cos(angle + 0.4), s.ey - headLen * Math.sin(angle + 0.4));
        ctx.stroke();
      } else if (s.type === 'text') {
        ctx.font = 'bold 16px -apple-system, sans-serif';
        ctx.fillText(s.text, s.x, s.y);
      }
    }

    drawCanvas.addEventListener('mousedown', (e) => {
      if (!drawEnabled || !toolActive) return; // Only draw if tool is active
      isDrawing = true;
      const rect = drawCanvas.getBoundingClientRect();
      const scroll = getScrollOffset();
      // Store in page coordinates (canvas coords + scroll offset)
      startX = e.clientX - rect.left + scroll.x;
      startY = e.clientY - rect.top + scroll.y;
      if (currentTool === 'line') {
        currentPath = [{ x: startX, y: startY }];
      }
    });

    drawCanvas.addEventListener('mousemove', (e) => {
      if (!isDrawing || !drawEnabled) return;
      const rect = drawCanvas.getBoundingClientRect();
      const scroll = getScrollOffset();
      // Store in page coordinates
      const mx = e.clientX - rect.left + scroll.x;
      const my = e.clientY - rect.top + scroll.y;

      if (currentTool === 'line') {
        currentPath.push({ x: mx, y: my });
        redraw();
        // Draw current path live
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
      } else {
        // Preview shape
        redraw();
        const preview = buildShape(mx, my);
        if (preview) drawShape(preview);
      }
    });

    drawCanvas.addEventListener('mouseup', (e) => {
      if (!isDrawing || !drawEnabled) return;
      isDrawing = false;
      const rect = drawCanvas.getBoundingClientRect();
      const scroll = getScrollOffset();
      // Store in page coordinates
      const mx = e.clientX - rect.left + scroll.x;
      const my = e.clientY - rect.top + scroll.y;

      const shapes = getShapesForCurrentTab();
      if (currentTool === 'text') {
        const text = prompt('Tekst:');
        if (text) shapes.push({ type: 'text', x: startX, y: startY, text, color: currentColor });
      } else if (currentTool === 'line') {
        if (currentPath.length > 1) {
          shapes.push({ type: 'line', points: [...currentPath], color: currentColor });
        }
        currentPath = [];
      } else {
        const shape = buildShape(mx, my);
        if (shape) shapes.push(shape);
      }
      redraw();
    });

    function buildShape(mx, my) {
      if (currentTool === 'rect') {
        return { type: 'rect', x: Math.min(startX, mx), y: Math.min(startY, my), w: Math.abs(mx - startX), h: Math.abs(my - startY), color: currentColor };
      } else if (currentTool === 'circle') {
        return { type: 'circle', x: Math.min(startX, mx), y: Math.min(startY, my), w: mx - startX, h: my - startY, color: currentColor };
      } else if (currentTool === 'arrow') {
        return { type: 'arrow', sx: startX, sy: startY, ex: mx, ey: my, color: currentColor };
      }
      return null;
    }

    // Draw tool buttons - toggle on/off
    document.querySelectorAll('.draw-toolbar button[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        const wasActive = btn.classList.contains('active');

        // Deactivate all tools first
        document.querySelectorAll('.draw-toolbar button[data-tool]').forEach(b => b.classList.remove('active'));

        if (wasActive) {
          // Clicking active tool → deactivate (page interaction mode)
          toolActive = false;
          drawCanvas.classList.remove('drawing');
        } else {
          // Clicking inactive tool → activate (drawing mode)
          btn.classList.add('active');
          currentTool = btn.dataset.tool;
          toolActive = true;
          drawCanvas.classList.add('drawing');
        }
      });
    });

    // Color buttons
    document.querySelectorAll('.draw-toolbar .color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.draw-toolbar .color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentColor = btn.dataset.color;
      });
    });

    // Clear
    document.getElementById('btn-draw-clear').addEventListener('click', () => {
      if (drawCanvasTabId) {
        tabShapes.set(drawCanvasTabId, []); // Clear shapes for current tab
      }
      redraw();
    });

    // Snap for Wingman
    document.getElementById('btn-snap-wingman').addEventListener('click', () => {
      if (window.tandem) window.tandem.snapForWingman();
    });

    // Draw mode toggle from main process
    if (window.tandem) {
      window.tandem.onDrawMode((data) => {
        drawEnabled = data.enabled;
        if (drawEnabled) {
          drawCanvasTabId = activeTabId; // Bind canvas to current tab
          drawCanvas.classList.add('active');
          drawToolbar.classList.add('visible');
          resizeCanvas();

          // Install scroll listener in active webview
          const entry = tabs.get(activeTabId);
          if (entry && entry.webview) {
            installScrollListener(entry.webview, activeTabId);
          }
        } else {
          drawCanvas.classList.remove('active');
          drawToolbar.classList.remove('visible');
          drawCanvasTabId = null; // Unbind when disabled
        }
      });

      window.tandem.onDrawClear(() => {
        if (drawCanvasTabId) {
          tabShapes.set(drawCanvasTabId, []); // Clear shapes for current tab
        }
        redraw();
      });
    }

    /**
     * Composite screenshot: webview capture + canvas annotations → base64 PNG.
     * Called from main process via executeJavaScript.
     */
    window.__tandemDraw = {
      compositeScreenshot(webviewBase64) {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const offscreen = document.createElement('canvas');
            offscreen.width = img.width;
            offscreen.height = img.height;
            const octx = offscreen.getContext('2d');
            // Draw webview screenshot
            octx.drawImage(img, 0, 0);
            // Scale annotations to match webview size
            const scaleX = img.width / drawCanvas.width;
            const scaleY = img.height / drawCanvas.height;
            octx.scale(scaleX, scaleY);
            // Draw annotations canvas on top
            octx.drawImage(drawCanvas, 0, 0);
            // Export as base64 PNG (strip data URL prefix)
            const dataUrl = offscreen.toDataURL('image/png');
            resolve(dataUrl.replace(/^data:image\/png;base64,/, ''));
          };
          img.src = 'data:image/png;base64,' + webviewBase64;
        });
      }
    };

    // ═══════════════════════════════════════════════
    // Wire up webview activity tracking to panel
    // ═══════════════════════════════════════════════

    // Override the existing updateTabMeta to also log activity
    const _origUpdateTabMeta = updateTabMeta;
    updateTabMeta = function (tabId, data) {
      // Track navigation
      if (data.url && window.tandem) {
        // Activity is tracked via IPC in main process, but we also
        // need webview events. We'll send them up.
      }
      _origUpdateTabMeta(tabId, data);
    };

    // Patch __tandemTabs.createTab to add activity tracking on webview events
    const _origCreateTab = window.__tandemTabs.createTab;
    window.__tandemTabs.createTab = function (tabId, url, partition) {
      const result = _origCreateTab.call(window.__tandemTabs, tabId, url, partition);
      // After tab is created, wire activity events
      const entry = tabs.get(tabId);
      if (entry && entry.webview) {
        wireActivityEvents(entry.webview, tabId);
      }
      return result;
    };

    function wireActivityEvents(wv, tabId) {
      // Track navigation events → main process activity tracker
      wv.addEventListener('did-navigate', (e) => {
        if (window.tandem) window.tandem.sendWebviewEvent({ type: 'did-navigate', url: e.url, tabId });
      });
      wv.addEventListener('did-navigate-in-page', (e) => {
        if (e.isMainFrame && window.tandem) {
          window.tandem.sendWebviewEvent({ type: 'did-navigate-in-page', url: e.url, tabId });
        }
      });
      wv.addEventListener('did-finish-load', () => {
        if (window.tandem) {
          window.tandem.sendWebviewEvent({
            type: 'did-finish-load',
            url: wv.getURL(),
            title: wv.getTitle(),
            tabId
          });
        }
      });
      wv.addEventListener('did-start-loading', () => {
        if (window.tandem) window.tandem.sendWebviewEvent({ type: 'loading-start', tabId });
      });
      wv.addEventListener('did-stop-loading', () => {
        if (window.tandem) window.tandem.sendWebviewEvent({ type: 'loading-stop', tabId });
      });

      // Wingman Vision: scroll/selection/form tracking moved to CDP Runtime.addBinding (see DevToolsManager)
    }

    // Also wire activity events for the initial tab
    (() => {
      const initialEntry = tabs.get(activeTabId);
      if (initialEntry && initialEntry.webview) {
        wireActivityEvents(initialEntry.webview, activeTabId);
      }
    })();

    // ═══════════════════════════════════════════════
    // Voice Input (Web Speech API — runs in SHELL, NOT webview!)
    // ═══════════════════════════════════════════════

    let speechRecognition = null;
    let voiceActive = false;

    function startVoiceRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('Web Speech API not available');
        return;
      }

      speechRecognition = new SpeechRecognition();
      speechRecognition.lang = 'nl-BE';
      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;

      speechRecognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        // Show live transcript
        const liveEl = document.getElementById('voice-live-text');
        if (liveEl) liveEl.textContent = interimText || finalText;

        // Send to main process
        if (window.tandem) {
          if (finalText) {
            window.tandem.sendVoiceTranscript(finalText, true);
            if (liveEl) liveEl.textContent = '';
            // Voice → ChatRouter: send final transcript to active backend
            if (window.chatRouter && window.chatRouter.router) {
              window.chatRouter.sendMessage(finalText);
            }
          } else if (interimText) {
            window.tandem.sendVoiceTranscript(interimText, false);
          }
        }
      };

      speechRecognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          stopVoiceRecognition();
        }
      };

      speechRecognition.onend = () => {
        // Auto-restart if still supposed to be listening
        if (voiceActive && speechRecognition) {
          try { speechRecognition.start(); } catch (e) { }
        }
      };

      try {
        speechRecognition.start();
        voiceActive = true;
        document.getElementById('voice-indicator').classList.add('active');
        // Switch to chat tab
        document.querySelectorAll('.panel-tab').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-panel-tab="chat"]').classList.add('active');
        document.getElementById('panel-activity').style.display = 'none';
        document.getElementById('panel-chat').style.display = 'flex';
        document.getElementById('panel-screenshots').style.display = 'none';
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }

    function stopVoiceRecognition() {
      voiceActive = false;
      if (speechRecognition) {
        try { speechRecognition.stop(); } catch (e) { }
        speechRecognition = null;
      }
      document.getElementById('voice-indicator').classList.remove('active');
      document.getElementById('voice-live-text').textContent = '';
      if (window.tandem) window.tandem.sendVoiceStatus(false);
    }

    if (window.tandem) {
      window.tandem.onVoiceToggle((data) => {
        if (data.listening) {
          startVoiceRecognition();
        } else {
          stopVoiceRecognition();
        }
      });

      // Voice transcript display (from main process, for final messages)
      window.tandem.onVoiceTranscript((data) => {
        // Already handled via onChatMessage for final messages
      });

      // Auto-snapshot request from activity tracker
      window.tandem.onAutoSnapshotRequest((data) => {
        // Trigger snap silently
        window.tandem.snapForWingman();
      });
    }

    // ═══════════════════════════════════════════════
    // Settings — open in active tab
    // ═══════════════════════════════════════════════
    function openSettings() {
      const shellPath = window.location.href.replace(/\/[^/]*$/, '');
      const settingsUrl = shellPath + '/settings.html';
      const entry = tabs.get(activeTabId);
      if (entry) {
        entry.webview.loadURL(settingsUrl);
      }
    }

    // Handle tandem://settings in URL bar
    const _origUrlBarKeydown = urlBar.onkeydown;
    urlBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = urlBar.value.trim();
        if (val === 'tandem://settings') {
          e.preventDefault();
          e.stopImmediatePropagation();
          openSettings();
          return;
        }
      }
    }, true); // capture phase to run before existing handler

    // Chat polling removed — OpenClaw webchat iframe handles everything

    // ═══════════════════════════════════════════════
    // New tab page navigation messages
    // ═══════════════════════════════════════════════
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'tandem-newtab-navigate' && e.data.url) {
        const entry = tabs.get(activeTabId);
        if (entry) entry.webview.loadURL(e.data.url);
      }
    });

    // ═══════════════════════════════════════════════
    // Bookmarks bar + star
    // ═══════════════════════════════════════════════

    const bookmarkStar = document.getElementById('btn-bookmark');
    const bookmarksBar = document.getElementById('bookmarks-bar');
    let bookmarksBarVisible = true;

    const bmToken = () => window.__TANDEM_TOKEN__ || '';

    async function updateBookmarkStar() {
      const entry = tabs.get(activeTabId);
      if (!entry) return;
      try {
        const url = entry.webview.getURL();
        if (!url || url.startsWith('file://') || url === 'about:blank') {
          bookmarkStar.textContent = '☆';
          bookmarkStar.classList.remove('bookmarked');
          return;
        }
        const resp = await fetch(`http://localhost:8765/bookmarks/check?url=${encodeURIComponent(url)}`, {
          headers: { Authorization: `Bearer ${bmToken()}` }
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.bookmarked) {
            bookmarkStar.textContent = '★';
            bookmarkStar.classList.add('bookmarked');
          } else {
            bookmarkStar.textContent = '☆';
            bookmarkStar.classList.remove('bookmarked');
          }
        }
      } catch { /* API not ready */ }
    }

    // === Bookmark star popup ===
    const bmPopup = document.getElementById('bookmark-popup');
    const bmPopupName = document.getElementById('bookmark-popup-name');
    const bmPopupFolder = document.getElementById('bookmark-popup-folder');
    const bmPopupDelete = document.getElementById('bookmark-popup-delete');
    const bmPopupSave = document.getElementById('bookmark-popup-save');
    const bmPopupCancel = document.getElementById('bookmark-popup-cancel');
    let bmPopupState = { open: false, bookmarkId: null, url: null };

    async function loadFolderOptions() {
      try {
        const res = await fetch('http://localhost:8765/bookmarks', {
          headers: { Authorization: `Bearer ${bmToken()}` }
        });
        const data = await res.json();
        const root = data.bookmarks?.[0];
        bmPopupFolder.innerHTML = '';
        // Add root option (Bookmarks Bar)
        const rootOpt = document.createElement('option');
        rootOpt.value = root?.id || '';
        rootOpt.textContent = 'Bookmarks Bar';
        bmPopupFolder.appendChild(rootOpt);
        // Recursively add folders
        function addFolders(children, depth) {
          if (!children) return;
          for (const item of children) {
            if (item.type === 'folder') {
              const opt = document.createElement('option');
              opt.value = item.id;
              opt.textContent = '\u00A0\u00A0'.repeat(depth) + item.name;
              bmPopupFolder.appendChild(opt);
              addFolders(item.children, depth + 1);
            }
          }
        }
        addFolders(root?.children, 1);
      } catch { /* ignore */ }
    }

    function positionPopup() {
      const starRect = bookmarkStar.getBoundingClientRect();
      bmPopup.style.top = (starRect.bottom + 6) + 'px';
      bmPopup.style.right = 'auto';
      bmPopup.style.left = Math.max(8, starRect.left - 120) + 'px';
    }

    async function openBookmarkPopup() {
      const entry = tabs.get(activeTabId);
      if (!entry) return;
      const url = entry.webview.getURL();
      const title = entry.webview.getTitle() || url;
      if (!url || url.startsWith('file://') || url === 'about:blank') return;

      await loadFolderOptions();

      // Check if already bookmarked
      let existingBookmark = null;
      try {
        const resp = await fetch(`http://localhost:8765/bookmarks/check?url=${encodeURIComponent(url)}`, {
          headers: { Authorization: `Bearer ${bmToken()}` }
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.bookmarked && data.bookmark) existingBookmark = data.bookmark;
        }
      } catch { /* ignore */ }

      bmPopupName.value = existingBookmark ? existingBookmark.name : title;
      bmPopupState.bookmarkId = existingBookmark?.id || null;
      bmPopupState.url = url;

      // Select the bookmark's parent folder if editing
      if (existingBookmark?.parentId) {
        bmPopupFolder.value = existingBookmark.parentId;
      } else {
        bmPopupFolder.selectedIndex = 0;
      }

      bmPopupDelete.style.display = existingBookmark ? '' : 'none';
      positionPopup();
      bmPopup.style.display = 'flex';
      bmPopupState.open = true;
      bmPopupName.focus();
      bmPopupName.select();
    }

    function closeBookmarkPopup() {
      bmPopup.style.display = 'none';
      bmPopupState.open = false;
    }

    bmPopupSave.addEventListener('click', async () => {
      const name = bmPopupName.value.trim();
      const parentId = bmPopupFolder.value;
      if (!name) return;
      try {
        if (bmPopupState.bookmarkId) {
          // Update existing bookmark
          await fetch('http://localhost:8765/bookmarks/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bmToken()}` },
            body: JSON.stringify({ id: bmPopupState.bookmarkId, name, url: bmPopupState.url }),
          });
          // Move to selected folder if changed
          await fetch('http://localhost:8765/bookmarks/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bmToken()}` },
            body: JSON.stringify({ id: bmPopupState.bookmarkId, parentId }),
          });
        } else {
          // Add new bookmark
          await fetch('http://localhost:8765/bookmarks/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bmToken()}` },
            body: JSON.stringify({ name, url: bmPopupState.url, parentId }),
          });
        }
        closeBookmarkPopup();
        updateBookmarkStar();
        loadBookmarksBar();
      } catch { /* ignore */ }
    });

    bmPopupDelete.addEventListener('click', async () => {
      if (!bmPopupState.bookmarkId) return;
      try {
        await fetch('http://localhost:8765/bookmarks/remove', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bmToken()}` },
          body: JSON.stringify({ id: bmPopupState.bookmarkId }),
        });
        closeBookmarkPopup();
        updateBookmarkStar();
        loadBookmarksBar();
      } catch { /* ignore */ }
    });

    bmPopupCancel.addEventListener('click', closeBookmarkPopup);

    // Close popup on Escape or click outside
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && bmPopupState.open) closeBookmarkPopup();
    });
    document.addEventListener('mousedown', (e) => {
      if (bmPopupState.open && !bmPopup.contains(e.target) && e.target !== bookmarkStar) {
        closeBookmarkPopup();
      }
    });

    bookmarkStar.addEventListener('click', openBookmarkPopup);

    function toggleBookmarksBar() {
      bookmarksBarVisible = !bookmarksBarVisible;
      if (bookmarksBarVisible) {
        loadBookmarksBar();
      } else {
        bookmarksBar.classList.remove('visible');
      }
      // Persist to config
      fetch('http://localhost:8765/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ general: { showBookmarksBar: bookmarksBarVisible } }),
      }).catch(() => { });
    }

    // Transparent overlay to catch clicks outside dropdowns
    const bmOverlay = document.createElement('div');
    bmOverlay.id = 'bm-click-overlay';
    bmOverlay.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:499;';
    document.body.appendChild(bmOverlay);

    function closeAllBookmarkDropdowns() {
      document.querySelectorAll('.bm-dropdown.open').forEach(d => d.classList.remove('open'));
      bmOverlay.style.display = 'none';
    }

    bmOverlay.addEventListener('click', closeAllBookmarkDropdowns);

    function openBookmarkDropdown(dropdown) {
      // Close all other dropdowns first
      document.querySelectorAll('.bm-dropdown.open').forEach(d => {
        d.classList.remove('open');
        d.style.left = '';
        d.style.right = '';
      });
      dropdown.classList.add('open');
      // Flip top-level dropdown if it overflows right edge
      const rect = dropdown.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        dropdown.style.left = 'auto';
        dropdown.style.right = '0';
      }
      bmOverlay.style.display = 'block';
    }

    function createBookmarkLink(item) {
      const a = document.createElement('a');
      let hostname = '';
      try { hostname = new URL(item.url).hostname; } catch { }
      const shortName = (item.name || hostname).substring(0, 40);
      a.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=${hostname}&sz=32" onerror="this.style.display='none'"> ${escapeHtml(shortName)}`;
      a.title = item.url;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeAllBookmarkDropdowns();
        const entry = tabs.get(activeTabId);
        if (entry) entry.webview.loadURL(item.url);
      });
      return a;
    }

    function createFolderDropdown(items) {
      const dropdown = document.createElement('div');
      dropdown.className = 'bm-dropdown';

      for (const child of items) {
        if (child.type === 'url' && child.url) {
          dropdown.appendChild(createBookmarkLink(child));
        } else if (child.type === 'folder' && child.children) {
          const subfolder = document.createElement('div');
          subfolder.className = 'bm-subfolder';
          const label = document.createElement('span');
          label.textContent = (child.name || 'Folder').substring(0, 35);
          const icon = document.createElement('span');
          icon.className = 'bm-folder-icon';
          icon.textContent = '📁';
          subfolder.appendChild(icon);
          subfolder.appendChild(label);

          const subDropdown = createFolderDropdown(child.children);
          subfolder.appendChild(subDropdown);

          // Click on the subfolder label/icon to toggle sub-dropdown
          subfolder.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Close sibling sub-dropdowns at same level
            const parent = subfolder.parentElement;
            if (parent) {
              parent.querySelectorAll('.bm-subfolder > .bm-dropdown.open').forEach(d => {
                if (d !== subDropdown) { d.classList.remove('open', 'flip-left', 'flip-top'); }
              });
            }
            subDropdown.classList.toggle('open');
            if (subDropdown.classList.contains('open')) {
              // Reset positioning
              subDropdown.classList.remove('flip-left', 'flip-top');
              const rect = subDropdown.getBoundingClientRect();
              // Flip left if overflows right edge
              if (rect.right > window.innerWidth) subDropdown.classList.add('flip-left');
              // Flip up if overflows bottom edge
              if (rect.bottom > window.innerHeight) subDropdown.classList.add('flip-top');
            }
          });

          dropdown.appendChild(subfolder);
        }
      }

      if (items.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding: 6px 12px; font-size: 11px; color: #555;';
        empty.textContent = '(empty)';
        dropdown.appendChild(empty);
      }

      return dropdown;
    }

    // Build a bar element (link or folder) from bookmark data
    function createBarElement(item) {
      if (item.type === 'url' && item.url) {
        return createBookmarkLink(item);
      } else if (item.type === 'folder' && item.children) {
        const folder = document.createElement('div');
        folder.className = 'bm-folder';
        folder.innerHTML = `<span class="bm-folder-icon">📁</span> ${escapeHtml((item.name || 'Folder').substring(0, 25))}`;
        const dropdown = createFolderDropdown(item.children);
        folder.appendChild(dropdown);
        folder.addEventListener('click', (e) => {
          e.stopPropagation();
          if (dropdown.classList.contains('open')) {
            closeAllBookmarkDropdowns();
          } else {
            openBookmarkDropdown(dropdown);
          }
        });
        return folder;
      }
      return null;
    }

    let barItems = []; // cached bookmark data for relayout

    function layoutBookmarksBar() {
      if (!bookmarksBarVisible || barItems.length === 0) return;

      bookmarksBar.innerHTML = '';
      bookmarksBar.classList.add('visible');

      // Add all items first
      const elements = [];
      for (const item of barItems) {
        const el = createBarElement(item);
        if (el) {
          bookmarksBar.appendChild(el);
          elements.push({ el, item });
        }
      }

      // Measure: find which items overflow the bar
      const barRight = bookmarksBar.getBoundingClientRect().right - 12; // minus padding
      let overflowIndex = -1;
      // Reserve ~40px for the >> button
      const reserveWidth = 40;

      for (let i = 0; i < elements.length; i++) {
        const elRect = elements[i].el.getBoundingClientRect();
        if (elRect.right > barRight - reserveWidth) {
          overflowIndex = i;
          break;
        }
      }

      if (overflowIndex < 0) return; // everything fits

      // Remove overflow items from bar
      const overflowItems = [];
      for (let i = overflowIndex; i < elements.length; i++) {
        bookmarksBar.removeChild(elements[i].el);
        overflowItems.push(elements[i].item);
      }

      // Create >> overflow button with dropdown
      const chevron = document.createElement('div');
      chevron.className = 'bm-overflow';
      chevron.textContent = '»';

      const overflowDropdown = document.createElement('div');
      overflowDropdown.className = 'bm-dropdown';
      // Build dropdown items from overflow data
      for (const item of overflowItems) {
        if (item.type === 'url' && item.url) {
          overflowDropdown.appendChild(createBookmarkLink(item));
        } else if (item.type === 'folder' && item.children) {
          const subfolder = document.createElement('div');
          subfolder.className = 'bm-subfolder';
          const icon = document.createElement('span');
          icon.className = 'bm-folder-icon';
          icon.textContent = '📁';
          const label = document.createElement('span');
          label.textContent = (item.name || 'Folder').substring(0, 35);
          subfolder.appendChild(icon);
          subfolder.appendChild(label);
          const subDropdown = createFolderDropdown(item.children);
          subfolder.appendChild(subDropdown);
          subfolder.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            overflowDropdown.querySelectorAll('.bm-subfolder > .bm-dropdown.open').forEach(d => {
              if (d !== subDropdown) d.classList.remove('open', 'flip-left', 'flip-top');
            });
            subDropdown.classList.toggle('open');
            if (subDropdown.classList.contains('open')) {
              subDropdown.classList.remove('flip-left', 'flip-top');
              const rect = subDropdown.getBoundingClientRect();
              if (rect.right > window.innerWidth) subDropdown.classList.add('flip-left');
              if (rect.bottom > window.innerHeight) subDropdown.classList.add('flip-top');
            }
          });
          overflowDropdown.appendChild(subfolder);
        }
      }

      chevron.appendChild(overflowDropdown);
      chevron.addEventListener('click', (e) => {
        e.stopPropagation();
        if (overflowDropdown.classList.contains('open')) {
          closeAllBookmarkDropdowns();
        } else {
          openBookmarkDropdown(overflowDropdown);
        }
      });

      bookmarksBar.appendChild(chevron);
    }

    // Relayout on window resize
    window.addEventListener('resize', () => {
      if (bookmarksBarVisible && barItems.length > 0) layoutBookmarksBar();
    });

    async function loadBookmarksBar() {
      if (!bookmarksBarVisible) return;

      let retries = 3;
      while (retries > 0) {
        try {
          const resp = await fetch('http://localhost:8765/bookmarks', {
            headers: { Authorization: `Bearer ${bmToken()}` }
          });
          if (!resp.ok) {
            retries--;
            if (retries > 0) { await new Promise(r => setTimeout(r, 1000)); continue; }
            return;
          }
          const data = await resp.json();
          barItems = (data.bar || []).slice(0, 30);
          if (barItems.length === 0) {
            bookmarksBar.classList.remove('visible');
            return;
          }
          layoutBookmarksBar();
          break;
        } catch (err) {
          retries--;
          if (retries > 0) { await new Promise(r => setTimeout(r, 1000)); }
        }
      }
    }

    // Load bookmarks bar on startup — respect config
    setTimeout(async () => {
      try {
        const res = await fetch('http://localhost:8765/config');
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.general && cfg.general.showBookmarksBar === false) {
            bookmarksBarVisible = false;
            bookmarksBar.classList.remove('visible');
            return;
          }
        }
      } catch { /* API not ready, show bar by default */ }
      loadBookmarksBar();
    }, 1500);

    // Update star when URL changes
    const _prevUpdateTabMeta2 = updateTabMeta;
    updateTabMeta = function (tabId, data) {
      _prevUpdateTabMeta2(tabId, data);
      if (data.url && tabId === activeTabId) {
        setTimeout(updateBookmarkStar, 200);
      }
    };

    // ═══════════════════════════════════════════════
    // Find in page
    // ═══════════════════════════════════════════════

    const findBar = document.getElementById('find-bar');
    const findInput = document.getElementById('find-input');
    const findCount = document.getElementById('find-count');
    let findActive = false;

    function toggleFindBar(show) {
      if (show === undefined) show = !findActive;
      findActive = show;
      if (show) {
        findBar.classList.add('visible');
        findInput.focus();
        findInput.select();
      } else {
        findBar.classList.remove('visible');
        findInput.value = '';
        findCount.textContent = '';
        // Stop finding
        const entry = tabs.get(activeTabId);
        if (entry) entry.webview.stopFindInPage('clearSelection');
      }
    }

    function doFind(forward) {
      const text = findInput.value;
      if (!text) {
        findCount.textContent = '';
        return;
      }
      const entry = tabs.get(activeTabId);
      if (!entry) return;
      entry.webview.findInPage(text, { forward: forward !== false });
    }

    findInput.addEventListener('input', () => doFind(true));
    findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        doFind(!e.shiftKey);
      } else if (e.key === 'Escape') {
        toggleFindBar(false);
      }
    });
    document.getElementById('find-next').addEventListener('click', () => doFind(true));
    document.getElementById('find-prev').addEventListener('click', () => doFind(false));
    document.getElementById('find-close').addEventListener('click', () => toggleFindBar(false));

    // Listen for find results from webview
    function wireFindEvents(wv) {
      wv.addEventListener('found-in-page', (e) => {
        if (e.result) {
          findCount.textContent = `${e.result.activeMatchOrdinal}/${e.result.matches}`;
        }
      });
    }

    // Wire find events for existing and new tabs
    const _origCreateTab2 = window.__tandemTabs.createTab;
    window.__tandemTabs.createTab = function (tabId, url, partition) {
      const result = _origCreateTab2.call(window.__tandemTabs, tabId, url, partition);
      const entry = tabs.get(tabId);
      if (entry && entry.webview) wireFindEvents(entry.webview);
      return result;
    };
    // Wire for initial tab
    (() => {
      const entry = tabs.get(activeTabId);
      if (entry && entry.webview) wireFindEvents(entry.webview);
    })();

    // ═══════════════════════════════════════════════
    // History page
    // ═══════════════════════════════════════════════

    function openHistoryPage() {
      const shellPath = window.location.href.replace(/\/[^/]*$/, '');
      const historyUrl = shellPath + '/history.html';
      const entry = tabs.get(activeTabId);
      if (entry) entry.webview.loadURL(historyUrl);
    }

    // Clear URL bar when on newtab page
    function isNewtabUrl(url) {
      return url && (url.includes('newtab.html') || url.startsWith('file://') && url.endsWith('newtab.html'));
    }

    // Patch updateTabMeta to clear URL bar on newtab
    const _prevUpdateTabMeta = updateTabMeta;
    updateTabMeta = function (tabId, data) {
      _prevUpdateTabMeta(tabId, data);
      if (data.url && tabId === activeTabId && isNewtabUrl(data.url)) {
        urlBar.value = '';
      }
    };

    // ═══════════════════════════════════════════════
    // Screenshot preview with actual images in panel
    // ═══════════════════════════════════════════════

    // Override screenshot-taken handler to show base64 preview
    if (window.tandem) {
      // Remove old handler and add enhanced one
      window.tandem.onScreenshotTaken((data) => {
        const listEl = document.getElementById('screenshot-list');
        const placeholder = listEl.querySelector('p');
        if (placeholder) placeholder.remove();

        const div = document.createElement('div');
        div.className = 'ss-item';
        if (data.base64) {
          const imgSrc = `data:image/png;base64,${data.base64}`;
          div.innerHTML = `
            <img src="${imgSrc}" alt="${escapeHtml(data.filename)}" title="Click to enlarge">
            <div class="ss-label">${escapeHtml(data.filename)}</div>
          `;
          div.querySelector('img').addEventListener('click', () => {
            const win = window.open('', '_blank', 'width=1200,height=800');
            if (win) {
              win.document.write(`<!DOCTYPE html><html><head><title>${data.filename}</title><style>body{margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;}img{max-width:100%;max-height:100vh;}</style></head><body><img src="${imgSrc}"></body></html>`);
            }
          });
        } else {
          div.innerHTML = `<div class="ss-label">${escapeHtml(data.filename)}</div>`;
        }
        listEl.prepend(div);
      });
    }
