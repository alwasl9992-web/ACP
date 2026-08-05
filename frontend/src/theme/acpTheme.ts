import { createTheme } from "@mui/material/styles";

export const acpColors = {
  navy: "#071B34",
  navySoft: "#0B315B",
  gold: "#C9A227",
  goldSoft: "#F3E8BD",
  canvas: "#F4F7FB",
  paper: "#FFFFFF",
  border: "#DCE3EC",
  text: "#10243E",
  muted: "#617087",
} as const;

export const acpTheme = createTheme({
  direction: "rtl",
  palette: {
    mode: "light",
    primary: { main: acpColors.navy, light: acpColors.navySoft },
    secondary: { main: acpColors.gold, contrastText: acpColors.navy },
    background: { default: acpColors.canvas, paper: acpColors.paper },
    text: { primary: acpColors.text, secondary: acpColors.muted },
    divider: acpColors.border,
    success: { main: "#16794A" },
    warning: { main: "#B7791F" },
    error: { main: "#B42318" },
    info: { main: "#1769AA" },
  },
  typography: {
    fontFamily:
      '"IBM Plex Sans Arabic", "Noto Sans Arabic", Tahoma, Arial, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 800 },
    button: { fontWeight: 700, textTransform: "none" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: acpColors.canvas },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderColor: acpColors.border,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 40, borderRadius: 10 },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#EEF3F8",
          color: acpColors.navy,
          fontWeight: 800,
        },
      },
    },
  },
});
