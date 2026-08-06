import { alpha, createTheme } from "@mui/material/styles";

export const acpColors = {
  ink: "#091A2B",
  navy: "#0D2742",
  navySoft: "#19486F",
  navyMist: "#EAF0F6",
  gold: "#B58A2B",
  goldDeep: "#8A681D",
  goldSoft: "#F6EFD9",
  canvas: "#F5F7FA",
  canvasWarm: "#FAF9F6",
  paper: "#FFFFFF",
  surface: "#F9FBFD",
  border: "#D8E0E9",
  borderStrong: "#C5D0DC",
  text: "#13263B",
  muted: "#68778A",
  success: "#157347",
  warning: "#A76413",
  error: "#B42318",
  info: "#1769AA",
} as const;

const executiveShadow = "0 18px 48px rgba(13, 39, 66, 0.10)";
const floatingShadow = "0 10px 28px rgba(13, 39, 66, 0.12)";

export const acpTheme = createTheme({
  direction: "rtl",
  palette: {
    mode: "light",
    primary: {
      main: acpColors.navy,
      light: acpColors.navySoft,
      dark: acpColors.ink,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: acpColors.gold,
      light: acpColors.goldSoft,
      dark: acpColors.goldDeep,
      contrastText: acpColors.ink,
    },
    background: {
      default: acpColors.canvas,
      paper: acpColors.paper,
    },
    text: {
      primary: acpColors.text,
      secondary: acpColors.muted,
    },
    divider: acpColors.border,
    success: { main: acpColors.success },
    warning: { main: acpColors.warning },
    error: { main: acpColors.error },
    info: { main: acpColors.info },
  },
  typography: {
    fontFamily:
      '"IBM Plex Sans Arabic", "Noto Sans Arabic", Tahoma, Arial, sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.035em",
      lineHeight: 1.18,
    },
    h2: {
      fontWeight: 800,
      letterSpacing: "-0.03em",
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 800,
      letterSpacing: "-0.025em",
      lineHeight: 1.22,
    },
    h4: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
      lineHeight: 1.25,
    },
    h5: { fontWeight: 800, lineHeight: 1.3 },
    h6: { fontWeight: 800, lineHeight: 1.35 },
    subtitle1: { fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
    body1: { lineHeight: 1.75 },
    body2: { lineHeight: 1.65 },
    button: {
      fontWeight: 800,
      textTransform: "none",
      letterSpacing: 0,
    },
    overline: {
      fontWeight: 800,
      letterSpacing: "0.08em",
    },
  },
  shape: { borderRadius: 16 },
  shadows: [
    "none",
    "0 1px 2px rgba(13, 39, 66, 0.05)",
    "0 2px 6px rgba(13, 39, 66, 0.06)",
    "0 4px 10px rgba(13, 39, 66, 0.07)",
    "0 6px 16px rgba(13, 39, 66, 0.08)",
    floatingShadow,
    "0 12px 32px rgba(13, 39, 66, 0.11)",
    executiveShadow,
    "0 22px 58px rgba(13, 39, 66, 0.13)",
    "0 26px 68px rgba(13, 39, 66, 0.14)",
    ...Array(15).fill(executiveShadow),
  ] as unknown as NonNullable<Parameters<typeof createTheme>[0]>["shadows"],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "html, body, #root": {
          minHeight: "100%",
        },
        body: {
          backgroundColor: acpColors.canvas,
          backgroundImage:
            "radial-gradient(circle at 88% 2%, rgba(181,138,43,.08), transparent 24%), radial-gradient(circle at 8% 94%, rgba(25,72,111,.07), transparent 28%)",
          backgroundAttachment: "fixed",
          color: acpColors.text,
        },
        "*": {
          scrollbarColor: `${alpha(acpColors.navy, 0.28)} transparent`,
          scrollbarWidth: "thin",
        },
        "*::-webkit-scrollbar": { width: 8, height: 8 },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: alpha(acpColors.navy, 0.22),
          borderRadius: 999,
        },
        "::selection": {
          backgroundColor: alpha(acpColors.gold, 0.28),
          color: acpColors.ink,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderColor: acpColors.border,
        },
        rounded: {
          borderRadius: 18,
        },
        outlined: {
          borderColor: acpColors.border,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${acpColors.border}`,
          boxShadow: "0 8px 24px rgba(13, 39, 66, 0.07)",
          transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: floatingShadow,
            borderColor: acpColors.borderStrong,
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 42,
          borderRadius: 12,
          paddingInline: 18,
          transition: "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease",
          "&:active": { transform: "translateY(1px)" },
        },
        containedPrimary: {
          boxShadow: "0 8px 18px rgba(13, 39, 66, 0.18)",
          "&:hover": {
            boxShadow: "0 10px 24px rgba(13, 39, 66, 0.24)",
          },
        },
        containedSecondary: {
          backgroundColor: acpColors.gold,
          color: acpColors.ink,
          "&:hover": { backgroundColor: acpColors.goldDeep, color: "#FFFFFF" },
        },
        outlined: {
          borderWidth: 1.5,
          "&:hover": { borderWidth: 1.5 },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: acpColors.paper,
          transition: "box-shadow 160ms ease, background-color 160ms ease",
          "&:hover": { backgroundColor: acpColors.surface },
          "&.Mui-focused": {
            boxShadow: `0 0 0 4px ${alpha(acpColors.navy, 0.08)}`,
          },
        },
        notchedOutline: { borderColor: acpColors.borderStrong },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 30,
          borderRadius: 9,
          fontWeight: 800,
        },
        filled: {
          border: `1px solid ${alpha(acpColors.navy, 0.06)}`,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${acpColors.border}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: acpColors.border,
          paddingBlock: 14,
        },
        head: {
          backgroundColor: acpColors.navyMist,
          color: acpColors.navy,
          fontWeight: 800,
          borderBottom: `1px solid ${acpColors.borderStrong}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "0 1px 0 rgba(13, 39, 66, 0.08)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderInlineEnd: `1px solid ${acpColors.border}`,
          backgroundColor: acpColors.paper,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          marginInline: 8,
          marginBlock: 2,
          "&.Mui-selected": {
            backgroundColor: acpColors.navyMist,
            color: acpColors.navy,
            "&::before": {
              content: '""',
              width: 4,
              height: 24,
              borderRadius: 999,
              backgroundColor: acpColors.gold,
              position: "absolute",
              insetInlineStart: 0,
            },
          },
          "&.Mui-selected:hover": { backgroundColor: acpColors.navyMist },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 999,
          backgroundColor: acpColors.gold,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 48,
          fontWeight: 800,
          textTransform: "none",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: "1px solid",
        },
        standardSuccess: { borderColor: alpha(acpColors.success, 0.22) },
        standardWarning: { borderColor: alpha(acpColors.warning, 0.22) },
        standardError: { borderColor: alpha(acpColors.error, 0.22) },
        standardInfo: { borderColor: alpha(acpColors.info, 0.22) },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: acpColors.ink,
          borderRadius: 8,
          fontSize: 12,
        },
      },
    },
  },
});
