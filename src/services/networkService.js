import NetInfo from '@react-native-community/netinfo';

class NetworkService {
  constructor() {
    this.isConnected = false;
    this.listeners = new Set();
    this.initialize();
  }

  initialize() {
    // Subscribe to network state changes
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected && state.isInternetReachable;

      // Notify listeners if connection status changed
      if (wasConnected !== this.isConnected) {
        this.notifyListeners();
      }
    });

    // Get initial state
    NetInfo.fetch().then(state => {
      this.isConnected = state.isConnected && state.isInternetReachable;
    });
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.isConnected);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }

  async checkConnection() {
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected && state.isInternetReachable;
    return this.isConnected;
  }

  isOnline() {
    return this.isConnected;
  }

  waitForConnection(timeout = 30000) {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error('Connection timeout'));
      }, timeout);

      const unsubscribe = this.addListener(connected => {
        if (connected) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }
}

export default new NetworkService();
