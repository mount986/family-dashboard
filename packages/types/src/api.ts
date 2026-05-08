/** Standard API success envelope */
export interface ApiResponse<T> {
  data: T
}

/** Standard API error envelope */
export interface ApiError {
  error: string
  message: string
  statusCode: number
}

/** WebSocket message wrapper */
export type WsEvent<T extends string, P> = {
  type: T
  payload: P
}

// ── WebSocket event types ────────────────────────────────────────────────────

import type { TodoItem } from './todo.js'
import type { GroceryItem } from './grocery.js'

export type TodoItemUpdatedEvent = WsEvent<'todo:item:updated', TodoItem>
export type TodoItemDeletedEvent = WsEvent<'todo:item:deleted', { id: string; listId: string }>
export type GroceryItemUpdatedEvent = WsEvent<'grocery:item:updated', GroceryItem>
export type GroceryItemDeletedEvent = WsEvent<'grocery:item:deleted', { id: string }>
export type GroceryClearedEvent = WsEvent<'grocery:cleared', Record<string, never>>

export type WsMessage =
  | TodoItemUpdatedEvent
  | TodoItemDeletedEvent
  | GroceryItemUpdatedEvent
  | GroceryItemDeletedEvent
  | GroceryClearedEvent
