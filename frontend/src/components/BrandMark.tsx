import { Box, Stack, Typography } from "@mui/material";

interface BrandMarkProps {
  compact?: boolean;
  dark?: boolean;
}

export default function BrandMark({ compact = false, dark = false }: BrandMarkProps) {
  const textColor = dark ? "#FFFFFF" : "#08182B";
  const mutedColor = dark ? "rgba(255,255,255,.68)" : "#66758A";

  return (
    <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
      <Box
        component="img"
        src="/acp-mark.svg"
        alt="شعار ACP Enterprise"
        sx={{
          width: compact ? 34 : 48,
          height: compact ? 34 : 48,
          flexShrink: 0,
          filter: dark ? "drop-shadow(0 5px 12px rgba(0,0,0,.22))" : "drop-shadow(0 7px 16px rgba(8,24,43,.12))",
        }}
      />
      <Box minWidth={0}>
        <Typography
          component="div"
          sx={{
            color: textColor,
            fontWeight: 900,
            letterSpacing: ".055em",
            lineHeight: 1.05,
            fontSize: compact ? "0.91rem" : "1.08rem",
            whiteSpace: "nowrap",
          }}
        >
          ACP ENTERPRISE
        </Typography>
        {!compact && (
          <Typography
            component="div"
            sx={{
              color: mutedColor,
              fontSize: "0.71rem",
              fontWeight: 600,
              mt: 0.45,
              whiteSpace: "nowrap",
            }}
          >
            إدارة المشاريع والتشغيل والأصول
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
