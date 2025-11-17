// src/components/ErrorBoundary.tsx
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (in development)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to error tracking service (e.g., Sentry)
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="space-y-2">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold">เกิดข้อผิดพลาด</h1>
              <p className="text-muted-foreground">
                ขออภัย เกิดข้อผิดพลาดบางอย่างขึ้น
              </p>
            </div>

            {/* Show error details in development mode */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-muted p-4 rounded-md text-sm">
                <summary className="cursor-pointer font-semibold mb-2 hover:text-primary">
                  รายละเอียดข้อผิดพลาด (Dev Mode)
                </summary>
                <div className="space-y-2 mt-2">
                  <div>
                    <p className="font-semibold text-destructive">Error:</p>
                    <pre className=" overflow-auto bg-background p-2 rounded mt-1">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <p className="font-semibold text-destructive">Component Stack:</p>
                      <pre className=" overflow-auto bg-background p-2 rounded mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} className="w-full sm:w-auto">
                ลองอีกครั้ง
              </Button>
              <Button
                variant="outline"
                onClick={this.handleReload}
                className="w-full sm:w-auto"
              >
                รีโหลดหน้า
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full sm:w-auto"
              >
                กลับหน้าหลัก
              </Button>
            </div>

            {/* Additional help text */}
            <p className=" text-muted-foreground">
              หากปัญหายังคงอยู่ กรุณาติดต่อทีมสนับสนุน
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
