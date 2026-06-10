import React, { Component } from 'react';

interface Props {
  children: React.ReactNode;
  fallback: (error: Error, retry: () => void) => React.ReactNode;
  resetKey?: unknown;
}
interface State { error: Error | null; }
interface BoundaryComponentInstance {
  props: Props;
  state: State;
  setState(update: State | ((state: State) => State)): void;
}

// React is shipped as JavaScript in this project, so provide the class surface
// used by this boundary without changing the runtime base class.
const BoundaryComponent = Component as unknown as new (props: Props) => BoundaryComponentInstance;

/** Prevents a rendering failure in one subsystem from unmounting the full UI. */
export class ErrorBoundary extends BoundaryComponent {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    console.error('Bio Galaxy UI boundary caught an error:', error, info.componentStack);
  }

  componentDidUpdate(previous: Props): void {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  private retry = (): void => this.setState({ error: null });

  render(): React.ReactNode {
    return this.state.error ? this.props.fallback(this.state.error, this.retry) : this.props.children;
  }
}
