import { ProfilePage } from "../../pages/user/profile";
import type { StaticRouteItem } from "@nebula/core";

export const userStaticRoutes: StaticRouteItem[] = [
  {
    id: "user-profile",
    path: "/user/profile",
    name: "个人信息",
    nameKey: "user.profile.title",
    visible: false,
    sort: 1000,
    componentLoader: async () => ({ default: ProfilePage }),
  },
];