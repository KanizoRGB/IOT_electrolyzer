import { type LiveSensorData } from "@shared/schema";

export type WebSocketMessage = {
  type: 'connection' | 'sensorData' | 'alert' | 'subscribed';
  data?: LiveSensorData | any;
  systemId?: string;
  message?: string;
};

export class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;


  // private connect() {
  //   if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.CONNECTING)) {
  //     return;
  //   }

  //   this.isConnecting = true;

  //   try {
  //     // Construct WebSocket URL based on current location
  //     const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  //     const wsUrl = `${protocol}//${window.location.host}/ws`;
      
  //     console.log("Connecting to WebSocket:", wsUrl);
  //     this.socket = new WebSocket(wsUrl);

  //     this.socket.onopen = () => {
  //       console.log("WebSocket connected successfully");
  //       this.isConnecting = false;
  //       this.reconnectAttempts = 0;
  //       this.emit('connection', { connected: true });
  //     };

  //     this.socket.onmessage = (event) => {
  //       try {
  //         const message: WebSocketMessage = JSON.parse(event.data);
  //         console.log("WebSocket message received:", message);
          
  //         // Emit to specific listeners based on message type
  //         this.emit(message.type, message.data || message);
          
  //         // Also emit to general message listeners
  //         this.emit('message', message);
  //       } catch (error) {
  //         console.error("Error parsing WebSocket message:", error);
  //       }
  //     };

  //     this.socket.onclose = (event) => {
  //       console.log("WebSocket connection closed:", event.code, event.reason);
  //       this.isConnecting = false;
  //       this.socket = null;
  //       this.emit('connection', { connected: false });
        
  //       // Attempt to reconnect if not manually closed
  //       if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
  //         this.scheduleReconnect();
  //       }
  //     };

  //     this.socket.onerror = (error) => {
  //       console.error("WebSocket error:", error);
  //       this.isConnecting = false;
  //       this.emit('error', error);
  //     };

  //   } catch (error) {
  //     console.error("Failed to create WebSocket connection:", error);
  //     this.isConnecting = false;
  //     this.scheduleReconnect();
  //   }
  // }
private connect() {
  if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  this.isConnecting = true;

  try {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;

    // Use port 3001 for WS server in dev
    const port = (host === 'localhost' || host === '127.0.0.1') ? '3001' : window.location.port;

    const wsUrl = `${protocol}//${host}:${port}/ws`;

    console.log("Connecting to WebSocket:", wsUrl);
    this.socket = new WebSocket(wsUrl);

    // ...rest of your code
  } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.isConnecting = false;
      this.scheduleReconnect();  }
}

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Subscribe to specific system updates
  public subscribeToSystem(systemId: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'subscribe',
        systemId: systemId
      }));
    }
  }

  // Add event listener
  public on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  // Remove event listener
  public off(event: string, callback: (data: any) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Emit event to listeners
  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Send message to server
  public send(message: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message);
    }
  }

  // Get connection status
  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // Manually disconnect
  public disconnect() {
    if (this.socket) {
      this.socket.close(1000, "Manual disconnect");
      this.socket = null;
    }
  }

  // Get latest sensor data for a system
  public getLatestSensorData(): Map<string, LiveSensorData> {
    return this.latestSensorData;
  }

  private latestSensorData: Map<string, LiveSensorData> = new Map();

  constructor() {
    this.connect();
    
    // Store latest sensor data for each system
    this.on('sensorData', (data: LiveSensorData) => {
      this.latestSensorData.set(data.systemId, data);
    });
  }
}

// Create and export singleton instance
export const websocketService = new WebSocketService();