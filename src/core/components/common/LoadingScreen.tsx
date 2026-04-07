import { Languages } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Languages className="w-10 h-10 text-indigo-400 animate-pulse" />
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
      </div>
    </div>
  );
}
