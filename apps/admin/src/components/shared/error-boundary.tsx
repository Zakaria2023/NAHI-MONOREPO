"use client";

import { Component, ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: (error: Error, retry: () => void) => ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError = (error: Error): ErrorBoundaryState => ({ error });

  retry = () => this.setState({ error: null });

  render = () => (this.state.error ? this.props.fallback(this.state.error, this.retry) : this.props.children);
}
