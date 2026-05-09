import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

type WsMessage =
  | { type: 'todo_changed'; listId: string }
  | { type: 'grocery_changed' }

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
const WS_URL = `${protocol}://${window.location.host}/ws`

export function useRealtimeSync() {
  const qc = useQueryClient()
  const retryDelay = useRef(1000)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let unmounted = false

    function connect() {
      if (unmounted) return
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        retryDelay.current = 1000
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WsMessage
          if (msg.type === 'todo_changed') {
            void qc.invalidateQueries({ queryKey: ['todos', msg.listId] })
          } else if (msg.type === 'grocery_changed') {
            void qc.invalidateQueries({ queryKey: ['grocery'] })
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        if (unmounted) return
        timerRef.current = setTimeout(() => {
          retryDelay.current = Math.min(retryDelay.current * 2, 30_000)
          connect()
        }, retryDelay.current)
      }
    }

    connect()

    return () => {
      unmounted = true
      if (timerRef.current) clearTimeout(timerRef.current)
      wsRef.current?.close()
    }
  }, [qc])
}
