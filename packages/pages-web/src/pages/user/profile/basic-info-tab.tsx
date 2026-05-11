import { Avatar, Button, Col, Row, Space, Tag, Typography } from "antd";
import { useAuthStore, useI18n } from "@nebula/core";
import { useMemo } from "react";

export function BasicInfoTab() {
  const { t } = useI18n();
  const session = useAuthStore((state) => state.session);

  const user = session?.user;

  const roleTags = useMemo(() => {
    if (!user?.roles?.length) {
      return null;
    }
    return user.roles.map((role) => (
      <Tag key={role} color="blue">
        {role}
      </Tag>
    ));
  }, [user?.roles]);

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Space align="center" size={16}>
            <Typography.Text type="secondary" style={{ width: 80 }}>
              {t("user.profile.avatar")}
            </Typography.Text>
            <Avatar size={80} src={user?.avatar} style={{ backgroundColor: "#1890ff" }}>
              {user?.username?.slice(0, 1).toUpperCase() ?? "G"}
            </Avatar>
            <Button type="link">{t("user.profile.changeAvatar")}</Button>
          </Space>
        </Col>

        <Col span={12}>
          <Space align="center" size={16}>
            <Typography.Text type="secondary" style={{ width: 80 }}>
              {t("user.profile.username")}
            </Typography.Text>
            <Typography.Text>{user?.username ?? "-"}</Typography.Text>
          </Space>
        </Col>

        <Col span={12}>
          <Space align="center" size={16}>
            <Typography.Text type="secondary" style={{ width: 80 }}>
              {t("user.profile.nickname")}
            </Typography.Text>
            <Typography.Text>-</Typography.Text>
            <Button type="link">{t("user.profile.modify")}</Button>
          </Space>
        </Col>

        <Col span={12}>
          <Space align="center" size={16}>
            <Typography.Text type="secondary" style={{ width: 80 }}>
              {t("user.profile.phone")}
            </Typography.Text>
            <Typography.Text>-</Typography.Text>
            <Button type="link">{t("user.profile.modify")}</Button>
          </Space>
        </Col>

        <Col span={12}>
          <Space align="center" size={16}>
            <Typography.Text type="secondary" style={{ width: 80 }}>
              {t("user.profile.email")}
            </Typography.Text>
            <Typography.Text>-</Typography.Text>
            <Button type="link">{t("user.profile.modify")}</Button>
          </Space>
        </Col>

        <Col span={12}>
          <Space align="center" size={16}>
            <Typography.Text type="secondary" style={{ width: 80 }}>
              {t("user.profile.organization")}
            </Typography.Text>
            <Typography.Text>-</Typography.Text>
          </Space>
        </Col>

        <Col span={12}>
          <Space align="center" size={16}>
            <Typography.Text type="secondary" style={{ width: 80 }}>
              {t("user.profile.roles")}
            </Typography.Text>
            {roleTags ?? <Typography.Text>-</Typography.Text>}
          </Space>
        </Col>
      </Row>
    </div>
  );
}
