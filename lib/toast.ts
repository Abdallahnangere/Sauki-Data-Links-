type ToastType = 'success' | 'error' | 'info';
type ToastListener = (message: string, type: ToastType) => void;

let listener: ToastListener | null = null;

export const toast = {
  success: (msg: string) => listener && listener(msg, 'success'),
  error: (msg: string) => listener && listener(msg, 'error'),
  info: (msg: string) => listener && listener(msg, 'info'),
  subscribe: (l: ToastListener) => {
    listener = l;
    return () => { listener = null; };
  }
};