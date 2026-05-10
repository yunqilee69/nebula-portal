import type { ReactNode } from "react";

export type LoginMode = "username" | "wechat";

export type WechatWebMode = "redirect" | "qr";

export type WechatQrStatus = "WAITING" | "SCANNED" | "SUCCESS" | "EXPIRED";

export interface LoginFormValues {
  username: string;
  password: string;
}

export interface LoginModeOption {
  key: LoginMode;
  label: string;
  description: string;
  icon: ReactNode;
}
