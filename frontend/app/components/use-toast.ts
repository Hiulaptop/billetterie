// Inspired by react-hot-toast library
import * as React from 'react';

type ToasterToast = {
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
} & (
    | {
    variant: 'default';
    className?: string;
}
    | {
    variant: 'destructive';
    className?: string;
}
    );

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToastTimeouts = {
    [key: string]: ReturnType<typeof setTimeout>;
};

const internalState = {
    toasts: [] as ToasterToast[],
    timeouts: {} as ToastTimeouts,
};

const listeners: Array<(state: typeof internalState) => void> = [];

let memoryState: typeof internalState = { ...internalState };

function dispatch(action: { type: 'ADD_TOAST' | 'REMOVE_TOAST' | 'UPDATE_TOAST' | 'DISMISS_TOAST'; toast?: ToasterToast; toastId?: string }) {
    if (action.type === 'ADD_TOAST') {
        const { toast } = action;
        if (!toast) return;

        const toasts = [toast, ...memoryState.toasts].slice(0, TOAST_LIMIT);
        const timeouts = {
            ...memoryState.timeouts,
            [toast.id]: setTimeout(() => {
                dispatch({ type: 'DISMISS_TOAST', toastId: toast.id });
            }, TOAST_REMOVE_DELAY),
        };

        memoryState = { ...memoryState, toasts, timeouts };
    } else if (action.type === 'DISMISS_TOAST') {
        const { toastId } = action;
        if (!toastId) return;

        const timeouts = { ...memoryState.timeouts };
        if (timeouts[toastId]) {
            clearTimeout(timeouts[toastId]);
            delete timeouts[toastId];
        }

        const toasts = memoryState.toasts.filter(t => t.id !== toastId);
        memoryState = { ...memoryState, toasts, timeouts };
    } else if (action.type === 'REMOVE_TOAST') {
        memoryState = {
            ...memoryState,
            toasts: [],
            timeouts: {},
        };
    }

    listeners.forEach(listener => listener(memoryState));
}

type Toast = Omit<ToasterToast, 'id'>;

function toast(props: Toast) {
    const id = Math.random().toString(36).substring(2, 9);
    const toast = { ...props, id };
    dispatch({ type: 'ADD_TOAST', toast });
    return {
        id: id,
        dismiss: () => dispatch({ type: 'DISMISS_TOAST', toastId: id }),
        update: (props: ToasterToast) =>
            dispatch({ type: 'UPDATE_TOAST', toast: { ...props, id } }),
    };
}

function useToast() {
    const [state, setState] = React.useState(memoryState);

    React.useEffect(() => {
        listeners.push(setState);
        return () => {
            const index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, [state]);

    return {
        ...state,
        toast,
        dismiss: (toastId?: string) => {
            if (toastId) {
                dispatch({ type: 'DISMISS_TOAST', toastId });
            } else {
                dispatch({ type: 'REMOVE_TOAST' });
            }
        },
    };
}

export { useToast, toast };
