/**
 * IP Synchronization Orchestrator
 * Manages loading cached IP state, websocket streaming, and fallback HTTP sync
 */

import { loadStoredSnapshot, saveStoredSnapshot } from './ipStore';

const WS_URL = 'ws://localhost:8080/qos/stream';
const SNAPSHOT_TIMEOUT_MS = 2000; // Wait 2s for snapshot before HTTP fallback

/**
 * Start IP synchronization with IndexedDB persistence
 * @param {Function} onUpdate - Callback(state) called when state changes
 * @param {Object} options - Configuration options
 * @returns {Object} - Control object with close() and getState() methods
 */
export function startIPSync(onUpdate, options = {}) {
  const wsUrl = options.wsUrl || WS_URL;
  
  let state = {
    ips: [],
    sequence: 0,
    timestamp: new Date().toISOString(),
    initialSyncComplete: false,
    isConnected: false,
    error: null,
  };

  let ws = null;
  let bufferedUpdates = [];
  let snapshotTimeout = null;
  let reconnectTimer = null;

  /**
   * Update state and notify listener
   */
  function updateState(updates) {
    state = { ...state, ...updates };
    if (onUpdate) {
      onUpdate({ ...state });
    }
  }

  /**
   * Apply a delta update to the IP array
   */
  function applyDelta(update) {
    if (!update.IPStat && !update.ip_stat) {
      return; // Not an IP update
    }

    const ipStat = update.IPStat || update.ip_stat;
    const ip = ipStat.ip || ipStat.IP;
    
    if (!ip) return;

    const newIps = [...state.ips];
    const existingIndex = newIps.findIndex(item => item.ip === ip || item.IP === ip);

    if (existingIndex >= 0) {
      // Update existing IP
      newIps[existingIndex] = { ...newIps[existingIndex], ...ipStat };
    } else {
      // Add new IP
      newIps.push(ipStat);
    }

    return newIps;
  }

  /**
   * Handle incoming websocket message
   */
  function handleMessage(event) {
    try {
      const msg = JSON.parse(event.data);

      // Handle initial snapshot
      if (msg.type === 'snapshot' && msg.snapshot) {
        const snap = msg.snapshot;
        
        // Only accept snapshots with newer or equal sequence
        if (snap.sequence >= state.sequence) {
          console.log('[ipSync] Snapshot received, sequence:', snap.sequence);
          
          state.ips = snap.ips || [];
          state.sequence = snap.sequence || 0;
          state.timestamp = snap.timestamp || new Date().toISOString();
          state.initialSyncComplete = true;
          state.error = null;

          // Apply buffered updates that are newer than snapshot
          if (bufferedUpdates.length > 0) {
            console.log('[ipSync] Applying', bufferedUpdates.length, 'buffered updates');
            bufferedUpdates.forEach(bufferedMsg => {
              if (bufferedMsg.type === 'ip') {
                const updatedIps = applyDelta(bufferedMsg);
                if (updatedIps) state.ips = updatedIps;
              }
            });
          }
          bufferedUpdates = [];

          // Persist to IndexedDB
          saveStoredSnapshot(state.ips, state.sequence, state.timestamp).catch(err => {
            console.error('[ipSync] Failed to save snapshot:', err);
          });

          // Clear snapshot timeout since we received it
          if (snapshotTimeout) {
            clearTimeout(snapshotTimeout);
            snapshotTimeout = null;
          }

          updateState({ ...state });
        }
        return;
      }

      // Handle delta updates
      if (msg.type === 'ip') {
        if (!state.initialSyncComplete) {
          // Buffer deltas until we have the snapshot
          bufferedUpdates.push(msg);
          console.log('[ipSync] Buffering delta (waiting for snapshot)');
        } else {
          // Apply delta immediately
          const updatedIps = applyDelta(msg);
          if (updatedIps) {
            state.ips = updatedIps;
            // Note: We don't have sequence in deltas currently, could add later
            state.timestamp = new Date().toISOString();
            
            // Don't save deltas to IndexedDB - only save snapshots
            // This prevents stale cached data from persisting
            // The next snapshot will have the correct full state

            updateState({ ...state });
          }
        }
      }

      // Handle global stats (pass through, don't affect IP state)
      if (msg.type === 'global') {
        // Could emit global stats separately if needed
        updateState({ lastGlobalUpdate: msg.GlobalStat || msg.global_stat });
      }

    } catch (error) {
      console.error('[ipSync] Error parsing message:', error);
    }
  }

  /**
   * Fallback: fetch snapshot via HTTP if websocket doesn't provide it
   */
  async function fetchSnapshotHTTP() {
    try {
      console.log('[ipSync] Fetching snapshot via HTTP fallback');
      const response = await fetch('http://localhost:8080/qos/ips');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const snap = await response.json();

      if (snap && snap.sequence >= state.sequence) {
        state.ips = snap.ips || [];
        state.sequence = snap.sequence || 0;
        state.timestamp = snap.timestamp || new Date().toISOString();
        state.initialSyncComplete = true;
        state.error = null;

        await saveStoredSnapshot(state.ips, state.sequence, state.timestamp);
        updateState({ ...state });
        
        console.log('[ipSync] HTTP snapshot loaded successfully');
      }
    } catch (error) {
      console.error('[ipSync] HTTP fallback failed:', error);
      state.error = 'Failed to sync with server';
      updateState({ ...state });
    }
  }

  /**
   * Connect to websocket
   */
  function connect() {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      return; // Already connected/connecting
    }

    console.log('[ipSync] Connecting to websocket:', wsUrl);
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[ipSync] WebSocket connected');
      state.isConnected = true;
      state.error = null;
      updateState({ ...state });

      // Immediately fetch snapshot via HTTP for faster initial load
      if (!state.initialSyncComplete) {
        console.log('[ipSync] Fetching initial snapshot via HTTP');
        fetchSnapshotHTTP();
        
        // Still start timeout as backup in case HTTP fails
        snapshotTimeout = setTimeout(() => {
          if (!state.initialSyncComplete) {
            console.warn('[ipSync] Snapshot still not complete after HTTP attempt');
          }
        }, SNAPSHOT_TIMEOUT_MS);
      }
    };

    ws.onmessage = handleMessage;

    ws.onerror = (error) => {
      console.error('[ipSync] WebSocket error:', error);
      state.error = 'WebSocket connection error';
      updateState({ ...state });
    };

    ws.onclose = () => {
      console.log('[ipSync] WebSocket closed');
      state.isConnected = false;
      updateState({ ...state });

      // Try HTTP fallback if we never got initial sync
      if (!state.initialSyncComplete) {
        fetchSnapshotHTTP();
      }

      // Attempt reconnect after 3 seconds
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          console.log('[ipSync] Attempting reconnect...');
          connect();
        }, 3000);
      }
    };
  }

  /**
   * Initialize: Load from IndexedDB and start websocket
   */
  async function init() {
    try {
      // Don't load cache - always get fresh data from server
      // This prevents showing stale data during sync
      console.log('[ipSync] Skipping cache, will load fresh data from server');

      // Connect websocket immediately
      connect();
    } catch (error) {
      console.error('[ipSync] Initialization error:', error);
      state.error = 'Failed to initialize';
      updateState({ ...state });
    }
  }

  // Start initialization
  init();

  // Return control object
  return {
    close: () => {
      if (snapshotTimeout) clearTimeout(snapshotTimeout);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.close();
        ws = null;
      }
    },
    getState: () => ({ ...state }),
    reconnect: () => connect(),
  };
}
