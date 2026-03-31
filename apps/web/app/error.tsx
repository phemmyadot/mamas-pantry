"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold text-gray-800">Something went wrong</h2>
      <p className="max-w-md text-sm text-gray-500">
        {error.message ?? "An unexpected error occurred. Please try again."}
      </p>
      <button
        className="rounded-full bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  );
}
