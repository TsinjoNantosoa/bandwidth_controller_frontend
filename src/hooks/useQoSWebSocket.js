import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/qos/stream';

/**
 * Hook personnalisé pour gérer la connexion WebSocket avec le backend QoS
 * Gère automatiquement la reconnexion et la mise à jour des statistiques
 */
export const useQoSWebSocket = () => {
  const [globalStats, setGlobalStats] = useState({
    lanInterface: '',
    wanInterface: '',
    lanUploadRate: 0,
    lanDownloadRate: 0,
    wanUploadRate: 0,
    wanDownloadRate: 0,
    totalActiveIPs: 0,
    totalLimitedIPs: 0,
    globalLimit: '0',
    timestamp: null
  });

  const [ipStats, setIPStats] = useState(new Map());
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_INTERVAL = 3000;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);

          if (update.type === 'snapshot' && update.snapshot) {
            // Handle initial snapshot
            const snapshot = update.snapshot;
            
            // Update global stats from snapshot if available
            if (snapshot.global_limit) {
              setGlobalStats(prev => ({
                ...prev,
                globalLimit: snapshot.global_limit
              }));
            }
            
            // Process all IPs in snapshot
            if (snapshot.ips && Array.isArray(snapshot.ips)) {
              setIPStats(prev => {
                const newMap = new Map(prev);
                snapshot.ips.forEach(ipData => {
                  newMap.set(ipData.ip, {
                    ip: ipData.ip,
                    uploadRate: ipData.upload_rate_mbps || 0,
                    downloadRate: ipData.download_rate_mbps || 0,
                    isLimited: ipData.is_limited || false,
                    uploadLimit: ipData.bandwidth_limit || '',
                    downloadLimit: ipData.bandwidth_limit || '',
                    macAddress: ipData.mac_address || '',
                    hostname: ipData.hostname || '',
                    status: ipData.status || 'Active',
                    lastUpdate: Date.now()
                  });
                });
                return newMap;
              });
            }
          } else if (update.type === 'global' && update.global_stat) {
            // Mise à jour des statistiques globales - utilise callback pour éviter closure
            setGlobalStats(prev => ({
              lanInterface: update.global_stat.lan_interface,
              wanInterface: update.global_stat.wan_interface,
              lanUploadRate: update.global_stat.lan_upload_rate_mbps || 0,
              lanDownloadRate: update.global_stat.lan_download_rate_mbps || 0,
              wanUploadRate: update.global_stat.wan_upload_rate_mbps || 0,
              wanDownloadRate: update.global_stat.wan_download_rate_mbps || 0,
              totalActiveIPs: update.global_stat.total_active_ips || 0,
              totalLimitedIPs: update.global_stat.total_limited_ips || 0,
              globalLimit: update.global_stat.global_limit || '0',
              timestamp: new Date(update.global_stat.timestamp)
            }));
          } else if (update.type === 'ip' && update.ip_stat) {
            // Mise à jour des statistiques par IP - preserve existing fields
            setIPStats(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(update.ip_stat.ip) || {};
              
              const updatedEntry = {
                ...existing,  // Preserve existing fields
                ip: update.ip_stat.ip,
                uploadRate: update.ip_stat.upload_rate_mbps || 0,
                downloadRate: update.ip_stat.download_rate_mbps || 0,
                isLimited: update.ip_stat.is_limited !== undefined ? update.ip_stat.is_limited : existing.isLimited,
                uploadLimit: update.ip_stat.bandwidth_limit || existing.uploadLimit || '',
                downloadLimit: update.ip_stat.bandwidth_limit || existing.downloadLimit || '',
                macAddress: update.ip_stat.mac_address || existing.macAddress || '',
                hostname: update.ip_stat.hostname || existing.hostname || '',
                status: update.ip_stat.status || 'Active',
                lastUpdate: Date.now()
              };
              
              console.log('[WebSocket] IP update:', update.ip_stat.ip, {
                bandwidth_limit: update.ip_stat.bandwidth_limit,
                is_limited: update.ip_stat.is_limited,
                uploadLimit: updatedEntry.uploadLimit
              });
              
              newMap.set(update.ip_stat.ip, updatedEntry);
              return newMap;
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Tentative de reconnexion
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_INTERVAL);
        } else {
          setError('Max reconnection attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to create WebSocket connection');
      setConnectionStatus('disconnected');
    }
  }, []); // Pas de dépendances - fonction stable

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(() => connect(), 100); // Petit délai avant reconnexion
  }, [connect, disconnect]);

  // Connexion automatique au montage du composant
  useEffect(() => {
    connect();

    // Nettoyage à la désinscription
    return () => {
      disconnect();
    };
  }, []); // Pas de dépendances - ne se connecte qu'une fois au mount

  // Cleanup des IPs obsolètes (plus de 30s sans update)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setIPStats(prev => {
        const newMap = new Map();
        for (const [ip, stats] of prev) {
          if (stats.lastUpdate && now - stats.lastUpdate < 30000) {
            newMap.set(ip, stats);
          }
        }
        return newMap;
      });
    }, 10000); // Cleanup toutes les 10s

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    globalStats,
    ipStats,  // Return as Map, not array
    connectionStatus,
    error,
    reconnect
  };
};

export default useQoSWebSocket;
