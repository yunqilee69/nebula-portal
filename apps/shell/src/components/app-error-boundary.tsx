import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import { NeExceptionResult } from "@platform/ui";
import { useI18nStore } from "../modules/i18n/i18n-store";
import { translateShellMessage } from "../modules/i18n/translate";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AppErrorBoundary", error, info);
  }

  render() {
    if (this.state.hasError) {
      const locale = useI18nStore.getState().locale;
      return <NeExceptionResult status="error" title={translateShellMessage(locale, "errorBoundary.title")} subtitle={translateShellMessage(locale, "errorBoundary.subtitle")} actionText={translateShellMessage(locale, "errorBoundary.action")} onAction={() => window.location.reload()} />;
    }

    return this.props.children;
  }
}
