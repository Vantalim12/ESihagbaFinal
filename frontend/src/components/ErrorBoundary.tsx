import React, { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[60vh] flex items-center justify-center p-8">
                    <div className="max-w-md w-full text-center space-y-6">
                        {/* Error Icon */}
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-destructive"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                />
                            </svg>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold">Something went wrong</h2>
                            <p className="text-muted-foreground text-sm">
                                An unexpected error occurred. This has been logged for investigation.
                            </p>
                        </div>

                        {/* Error Details (collapsed) */}
                        {this.state.error && (
                            <details className="text-left bg-muted/50 rounded-xl p-4 text-xs">
                                <summary className="cursor-pointer text-muted-foreground font-medium">
                                    Technical Details
                                </summary>
                                <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-destructive/80">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2.5 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
