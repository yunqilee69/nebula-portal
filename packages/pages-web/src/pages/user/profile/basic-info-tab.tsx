import { Button, Col, Form, Input, message, Row, Space, Spin, Typography } from "antd";
import { useAuthStore, useI18n } from "@nebula/core";
import { NeImageUpload } from "@nebula/ui-web";
import { useEffect, useState } from "react";
import { fetchUserProfile, updateUserProfile } from "../../../api/profile-api";
import { uploadStorageFile } from "../../../api/storage-api";
import type { UserProfileDetail } from "@nebula/core";

export function BasicInfoTab() {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfileDetail | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await fetchUserProfile();
      setProfile(data);
      form.setFieldsValue({
        nickname: data.nickname ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        avatar: data.avatar ?? "",
      });
    } catch (error) {
      message.error(t("user.profile.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(file: File): Promise<string> {
    const result = await uploadStorageFile({
      file,
      sourceEntity: "user-avatar",
      sourceId: crypto.randomUUID(),
    });
    return result.fileUrl ?? result.previewUrl ?? "";
  }

  async function handleSave() {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const updated = await updateUserProfile({
        nickname: values.nickname || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        avatar: values.avatar || undefined,
      });
      setProfile(updated);

      // 更新 session 中的 user 信息
      const session = useAuthStore.getState().session;
      if (session) {
        useAuthStore.getState().patchSession({
          user: {
            ...session.user,
            nickname: updated.nickname,
            avatar: updated.avatar,
            email: updated.email,
            phone: updated.phone,
          },
        });
      }

      message.success(t("user.profile.saveSuccess"));
    } catch (error) {
      // Form validation error or API error
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Form form={form} layout="vertical">
        <Row gutter={[24, 16]}>
          <Col span={24}>
            <Form.Item label={t("user.profile.avatar")} name="avatar">
              <NeImageUpload
                onUpload={handleAvatarUpload}
                shape="circle"
                size={100}
                maxSize={5 * 1024 * 1024}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label={t("user.profile.username")}>
              <Typography.Text>{profile?.username ?? "-"}</Typography.Text>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label={t("user.profile.nickname")} name="nickname">
              <Input placeholder={t("user.profile.nickname")} maxLength={50} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label={t("user.profile.email")} name="email">
              <Input placeholder={t("user.profile.email")} type="email" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label={t("user.profile.phone")} name="phone">
              <Input placeholder={t("user.profile.phone")} />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={24}>
            <Space>
              <Button type="primary" loading={saving} onClick={handleSave}>
                {t("user.profile.save")}
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  );
}