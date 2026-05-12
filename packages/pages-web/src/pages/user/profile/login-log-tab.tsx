import { Table, Typography } from "antd";
import { useI18n } from "@nebula/core";
import { useEffect, useState } from "react";
import { fetchLoginRecords } from "../../../api/profile-api";
import type { LoginRecordItem, LoginRecordPageResult } from "@nebula/core";

export function LoginLogTab() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LoginRecordPageResult>({ data: [], total: 0 });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  useEffect(() => {
    loadRecords();
  }, [pagination.current, pagination.pageSize]);

  async function loadRecords() {
    setLoading(true);
    try {
      const result = await fetchLoginRecords({
        pageNum: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(result);
    } catch (error) {
      // 错误已由 client.ts 处理
    } finally {
      setLoading(false);
    }
  }

  function handleTableChange(page: number, pageSize: number) {
    setPagination({ current: page, pageSize });
  }

  const columns = [
    {
      title: t("user.profile.loginLog.time"),
      dataIndex: "loginTime",
      key: "loginTime",
      width: 180,
    },
    {
      title: t("user.profile.loginLog.account"),
      dataIndex: "loginAccount",
      key: "loginAccount",
      width: 120,
    },
    {
      title: t("user.profile.loginLog.type"),
      dataIndex: "loginType",
      key: "loginType",
      width: 100,
      render: (type: string) => t(`user.profile.loginLog.type.${type.toLowerCase()}`) ?? type,
    },
    {
      title: t("user.profile.loginLog.result"),
      dataIndex: "loginResult",
      key: "loginResult",
      width: 80,
      render: (result: string) => (
        <Typography.Text type={result === "SUCCESS" ? "success" : "danger"}>
          {t(`user.profile.loginLog.result.${result.toLowerCase()}`) ?? result}
        </Typography.Text>
      ),
    },
    {
      title: t("user.profile.loginLog.ip"),
      dataIndex: "loginIp",
      key: "loginIp",
      width: 140,
    },
    {
      title: t("user.profile.loginLog.device"),
      dataIndex: "deviceInfo",
      key: "deviceInfo",
      ellipsis: true,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Table
        columns={columns}
        dataSource={data.data}
        rowKey={(record) => `${record.loginTime}-${record.loginIp}`}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: data.total,
          showSizeChanger: true,
          showTotal: (total) => t("common.total", undefined, { total }),
          onChange: handleTableChange,
        }}
      />
    </div>
  );
}