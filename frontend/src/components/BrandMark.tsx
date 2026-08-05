import { Box, Stack, Typography } from "@mui/material";

interface BrandMarkProps {
  compact?: boolean;
  dark?: boolean;
}

export default function BrandMark({ compact = false, dark = false }: BrandMarkProps) {
  const textColor = dark ? "#FFFFFF" : "#071B34";
  const mutedColor = dark ? "rgba(255,255,255,.72)" : "#617087";

  return (
    <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
      <Box
        component="img"
        src="/acp-mark.svg"
        alt="شعار ACP Enterprise"
        sx={{ width: compact ? 34 : 46, height: compact ? 34 : 46, flexShrink: 0 }}
      />
      <Box minWidth={0}>
        <Typography
          component="div"
          sx={{
            color: textColor,
            fontWeight: 900,
            letterSpacing: ".04em",
            lineHeight: 1.1,
            fontSize: compact ? "0.92rem" : "1.08rem",
            whiteSpace: "nowrap",
          }}
        >
          ACP ENTERPRISE
        </Typography>
        {!compact && (
          <Typography
            component="div"
            sx={{ color: mutedColor, fontSize: "0.72rem", mt: 0.35, whiteSpace: "nowrap" }}
          >
            إدارة المشاريع والتشغيل والأصول
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
