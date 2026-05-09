import type { WebSocket } from '@fastify/websocket'

export type WsMessage =
  | { type: 'todo_changed'; listId: string }
  | { type: 'grocery_changed' }

const connections = new Set<WebSocket>()

export function addConnection(ws: WebSocket): void {
  connections.add(ws)
  ws.on('close', () => connections.delete(ws))
}

export function broadcast(msg: WsMessage): void {
  const payload = JSON.stringify(msg)
  for (const ws of connections) {
    if (ws.readyState === ws.OPEN) {
      ws.send(payload)
    }
  }
}
