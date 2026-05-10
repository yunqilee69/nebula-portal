import { Card, Typography } from "antd";
import type { ReactNode } from "react";

export interface LoginCardProps {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  badges?: ReactNode;
}

export function LoginCard({ title, description, children, badges }: LoginCardProps) {
  return (
    <Card className="login-card" variant="borderless">
      <section className="login-section-title">
        <Typography.Title level={2}>{title}</Typography.Title>
        <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
      </section>
      <section className="login-section-form">{children}</section>
      {badges ? <section className="login-section-badges">{badges}</section> : null}
    </Card>
  );
}
