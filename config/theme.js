/** Hotel Sea Shore brand palette — matches login page */
export const hsColors = {
  deep: "#04343a",
  ocean: "#0b5c66",
  lagoon: "#14919b",
  lagoonSoft: "#3db5be",
  mist: "#e8f4f3",
  pearl: "#f7fbfa",
  sand: "#c9a66b",
  ink: "#142a2e",
  muted: "#5f7478",
};

export const hsGradients = {
  primary: `linear-gradient(135deg, ${hsColors.ocean} 0%, ${hsColors.lagoon} 100%)`,
  primaryDeep: `linear-gradient(135deg, ${hsColors.lagoon} 0%, ${hsColors.ocean} 50%, ${hsColors.deep} 100%)`,
  primarySoft: `linear-gradient(135deg, ${hsColors.lagoonSoft} 0%, ${hsColors.lagoon} 50%, ${hsColors.ocean} 100%)`,
  primaryAlt: `linear-gradient(135deg, ${hsColors.ocean} 0%, ${hsColors.deep} 50%, #032a2e 100%)`,
  sider: `linear-gradient(180deg, #ffffff 0%, ${hsColors.mist} 100%)`,
  page: "linear-gradient(160deg, #f8fbfb 0%, #eef7f6 50%, #e8f2f4 100%)",
  loading: `linear-gradient(135deg, ${hsColors.ocean} 0%, ${hsColors.lagoon} 100%)`,
};

export const antdTheme = {
  token: {
    colorPrimary: hsColors.ocean,
    colorInfo: hsColors.lagoon,
    colorLink: hsColors.ocean,
    colorSuccess: "#2f9e6a",
    colorWarning: hsColors.sand,
    borderRadius: 10,
    fontFamily:
      'var(--font-geist-sans), system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  components: {
    Button: {
      primaryShadow: "0 4px 12px rgba(11, 92, 102, 0.25)",
    },
    Menu: {
      itemSelectedBg: hsColors.mist,
      itemSelectedColor: hsColors.ocean,
    },
  },
};
