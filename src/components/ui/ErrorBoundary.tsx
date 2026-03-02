"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <AlertTriangle className="mb-3 h-8 w-8 text-yellow-500" />
          <p className="text-sm font-medium text-white">데이터를 불러오는 중 오류가 발생했습니다</p>
          <p className="mt-1 text-xs text-gray-500">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
