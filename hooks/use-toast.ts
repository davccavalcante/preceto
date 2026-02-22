import type { ToastActionElement, ToastProps } from '@/components/ui/toast'
import * as React from 'react'

type ToastState = {
  toasts: ToasterToast[]
}

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

type ToastAction =
  | {
    type: 'ADD_TOAST'
    toast: ToasterToast
  }
  | {
    type: 'UPDATE_TOAST'
    toast: Partial<ToasterToast>
  }
  | {
    type: 'DISMISS_TOAST'
    toastId?: string
  }
  | {
    type: 'REMOVE_TOAST'
    toastId?: string
  }

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

let count = 0

function generateToastId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return `${Date.now()}-${count}`
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const listeners: Array<(state: ToastState) => void> = []

let memoryState: ToastState = { toasts: [] }

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: 'REMOVE_TOAST', toastId })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

function reducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.toast.id ? { ...toast, ...action.toast } : toast,
        ),
      }
    case 'DISMISS_TOAST': {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === toastId || toastId === undefined
            ? {
              ...toast,
              open: false,
            }
            : toast,
        ),
      }
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.toastId),
      }
    default:
      return state
  }
}

function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type ToastInput = Omit<ToasterToast, 'id'>

function toast({ onOpenChange, ...props }: ToastInput) {
  const id = generateToastId()

  const update = (toastProps: Partial<ToasterToast>) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...toastProps, id },
    })

  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        onOpenChange?.(open)
        if (!open) {
          dismiss()
        }
      },
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

export { toast, useToast }
