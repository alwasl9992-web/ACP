import { Box, Grid, Paper, Typography } from "@mui/material";

export default function ProjectDetails() {

  const cards = [
    "المباني",
    "البوابات",
    "الموظفون",
    "الصيانة",
    "المستودعات",
    "التقارير",
  ];

  return (
    <Box p={4}>

      <Typography variant="h4" mb={4}>
        مشروع ACP التجريبي
      </Typography>

      <Grid container spacing={3}>

        {cards.map((item) => (

          <Grid item xs={12} md={4} key={item}>

            <Paper
              sx={{
                p:4,
                textAlign:"center",
                cursor:"pointer",
                borderRadius:3,
              }}
            >

              <Typography variant="h6">

                {item}

              </Typography>

            </Paper>

          </Grid>

        ))}

      </Grid>

    </Box>
  );
}