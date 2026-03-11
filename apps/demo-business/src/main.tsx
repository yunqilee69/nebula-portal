import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { createRoot } from "react-dom/client";
import App from "./app";

createRoot(document.getElementById("root")!).render(
  <ConfigProvider
    locale={zhCN}
    theme={{
      token: {
        colorPrimary: "#9c4221",
      },
    }}
  >
    <App />
  </ConfigProvider>,
);
