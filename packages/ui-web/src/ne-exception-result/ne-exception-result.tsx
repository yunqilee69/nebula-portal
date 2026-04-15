import { Button, Result } from "antd";

export interface NeExceptionResultProps {
  status?: "403" | "404" | "500" | "warning" | "error" | "info" | "success";
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
}

export function NeExceptionResult({ status = "info", title, subtitle, actionText, onAction }: NeExceptionResultProps) {
  return (
    <Result
      className="ne-exception-result"
      status={status}
      title={title}
      subTitle={subtitle}
      extra={actionText && onAction ? <Button onClick={onAction}>{actionText}</Button> : undefined}
    />
  );
}
