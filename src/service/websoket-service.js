import SockJS from "sockjs-client"; // 修正1
import { Client } from "@stomp/stompjs";
import { STOMP_CONFIG, WS_CONFIG } from "./websocket-constants";
import { t } from "@lang";

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.connectionOptions = {};
    this.subscriptions = new Map();
  }

  connect(url = WS_CONFIG.baseUrl, options = {}) {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve(this.stompClient);
        return;
      }
      this.connectionOptions = { url, ...options };
      const socket = new SockJS(url);

      this.stompClient = new Client({
        webSocketFactory: () => socket,
        connectHeaders: options.headers || {},
        reconnectDelay: 0,
        ...STOMP_CONFIG,
        ...options,

        onConnect: () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reSubscribeAll();
          resolve(this.stompClient);
        },

        onStompError: (frame) => {
          this.isConnected = false;
          this.handleReconnect();
          reject(new Error(frame.headers.message || t("websocket.stompError"))); // 修正2
        },

        onWebSocketError: (event) => {
          this.isConnected = false;
          this.handleReconnect();
          reject(new Error(t("websocket.websocketError")));
        },

        onDisconnect: () => {
          this.isConnected = false;
          this.stompClient = null;
        },
      });

      this.stompClient.activate();
    });
  }

  disconnect() {
    if (!this.isReady()) {
      return;
    }
    this.unSubscribeAll();
    this.stompClient.deactivate();
  }

  subscribe(destination, callback) {
    if (!this.isReady()) {
      console.warn(t("websocket.cannotSubscribe"));
      return;
    }

    const subscription = this.stompClient.subscribe(destination, (message) => {
      if (typeof callback !== "function") {
        return;
      }
      try {
        let data = message.body;
        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (e) {
            // 保持原始字符串
          }
        }
        callback(data, message);
      } catch (error) {
        console.error(t("websocket.handleMsgError"), error);
      }
    });

    this.subscriptions.set(subscription.id, {
      subscription,
      config: { destination, callback },
    });
  }

  reSubscribeAll() {
    const oldSubscriptions = [...this.subscriptions.values()]; // 修正6
    this.subscriptions.clear();
    oldSubscriptions.forEach(({ config }) => {
      this.subscribe(config.destination, config.callback);
    });
  }

  unSubscribeAll() {
    this.subscriptions.forEach(({ subscription }) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  send(destination, body) {
    // 修正4
    if (!this.isReady()) {
      console.warn(t("websocket.cannotSend"));
      return false;
    }
    try {
      const messageBody =
        typeof body === "string" ? body : JSON.stringify(body);
      this.stompClient.publish({
        destination,
        body: messageBody,
      });
      return true;
    } catch (error) {
      console.error(t("websocket.sendMsgError"), error);
      return false;
    }
  }

  handleReconnect() {
    const { maxReconnectAttempts, reconnectInterval } = STOMP_CONFIG;
    if (this.reconnectAttempts < maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        const { url, options } = this.connectionOptions; // 修正3
        this.connect(url, options).catch((error) => {
          console.error(t("websocket.reconnectError"), error);
        });
      }, reconnectInterval);
    } else {
      console.error(t("websocket.maxReconnect"));
    }
  }

  isReady() {
    return this.isConnected && this.stompClient;
  }
}

export default new WebSocketService();
