import { Button, Drawer } from "antd";
import type { ReactNode } from "react";

/**
 * Props accepted by {@link NeFormDrawer}.
 */
export interface NeFormDrawerProps {
  /**
   * Drawer title displayed in the header area.
   */
  title: string;
  /**
   * Controls whether the drawer is visible.
   */
  open: boolean;
  /**
   * Called when the drawer should close, such as clicking the close icon or mask.
   */
  onClose: () => void;
  /**
   * Called when the primary action button is clicked. This is typically used to submit a form.
   */
  onSubmit: () => void;
  /**
   * When true, shows a loading state on the primary action button.
   */
  submitting?: boolean;
  /**
   * Drawer width in pixels. Defaults to `420`.
   */
  width?: number;
  /**
   * Text shown on the primary action button. Defaults to `Save`.
   */
  submitText?: string;
  /**
   * Form content rendered inside the drawer body.
   */
  children: ReactNode;
}

/**
 * Nebula standard form drawer that provides a consistent save action for create and edit flows.
 */
export function NeFormDrawer({
  title,
  open,
  onClose,
  onSubmit,
  submitting = false,
  width = 420,
  submitText = "Save",
  children,
}: NeFormDrawerProps) {
  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      width={width}
      extra={
        <Button type="primary" loading={submitting} onClick={onSubmit}>
          {submitText}
        </Button>
      }
    >
      {children}
    </Drawer>
  );
}
