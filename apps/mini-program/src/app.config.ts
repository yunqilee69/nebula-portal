export default defineAppConfig({
  pages: ["pages/sign-in/index"],
  tabBar: {
    color: "#475467",
    selectedColor: "#355dff",
    backgroundColor: "#ffffff",
    borderStyle: "black",
    list: [
      {
        pagePath: "pages/index/index",
        text: "Home",
      },
    ],
  },
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#ffffff",
    navigationBarTitleText: "Nebula Mini Program",
    navigationBarTextStyle: "black",
    backgroundColor: "#f5f7fb",
  },
})
