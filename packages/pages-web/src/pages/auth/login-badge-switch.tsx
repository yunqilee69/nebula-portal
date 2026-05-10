import { Tooltip, Typography } from "antd";
import type { LoginMode, LoginModeOption } from "./login-types";

export interface LoginBadgeSwitchProps {
  label: string;
  modes: LoginModeOption[];
  activeMode: LoginMode;
  onChange: (mode: LoginMode) => void;
}

export function LoginBadgeSwitch({ label, modes, activeMode, onChange }: LoginBadgeSwitchProps) {
  if (modes.length <= 1) {
    return null;
  }

  return (
    <div className="login-badge-switch">
      <Typography.Text type="secondary" className="login-badge-switch-label">
        {label}
      </Typography.Text>
      <div className="login-badge-list">
        {modes.map((mode) => {
          const isActive = mode.key === activeMode;
          return (
            <Tooltip key={mode.key} title={mode.label}>
              <button
                type="button"
                className={`login-badge-circle${isActive ? " login-badge-circle--active" : ""}${mode.key === "wechat" ? " login-badge-circle--wechat" : ""}`}
                aria-label={mode.label}
                aria-pressed={isActive}
                onClick={() => onChange(mode.key)}
              >
                {mode.icon}
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
