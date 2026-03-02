
type ToastOptions = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

type ToastFn = (options: ToastOptions) => void;

let _toast: ToastFn = () => {
  console.warn("Toast not initialized yet");
};

export function registerToast(fn: ToastFn) {
  _toast = fn;
}

export function toast(options: ToastOptions) {
  _toast(options);
}