export const STOMP_CONFIG = {
  maxReconnectAttempts: 5,
  reconnectinterval: 3000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
  reconnectDelay: 0,
  debug: window.isDev ? console.log : () => {},
};

export const WS_CONFIG = {
  baseUrl: process.env.VUE_APP_WS_URL || "/ws",
};

export const WS_TOPICS = {
  subscribeConversation: "/topic/conversation/",
  sendChat: "/app/conversation/chat",
};
