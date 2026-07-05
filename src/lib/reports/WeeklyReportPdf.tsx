import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { WeeklyReportData } from "./weekly";
import { CATEGORY_LABEL } from "./weekly";

const CRIMSON = "#C41230";
const INK = "#0F0A0B";
const MUTED = "#8A8A8A";
const OFF = "#F6F4F1";

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  content: { padding: 32 },
  headerBanner: { backgroundColor: CRIMSON, paddingVertical: 28, paddingHorizontal: 32, marginBottom: 4 },
  headerBrand: { fontSize: 10, fontWeight: 700, color: "#FFFFFF", letterSpacing: 2, marginBottom: 8, opacity: 0.85 },
  headerTitle: { fontSize: 22, fontWeight: 700, color: "#FFFFFF", marginBottom: 6 },
  headerPeriod: { fontSize: 11, color: "#FFFFFF", opacity: 0.9 },
  headerMetaRow: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 32, paddingTop: 10, marginBottom: 8 },
  headerMetaText: { fontSize: 8, color: MUTED },
  divider: { height: 1, backgroundColor: "#E5E0DA", marginVertical: 14 },
  dayHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  dayLabel: { fontSize: 12, fontWeight: 700, color: INK },
  dayDate: { fontSize: 9, color: MUTED },
  intensityBarTrack: { height: 3, backgroundColor: "#EFEAE3", borderRadius: 2, marginBottom: 8, marginTop: 2 },
  intensityBarFill: { height: 3, backgroundColor: CRIMSON, borderRadius: 2 },
  exerciseGrid: { flexDirection: "row", flexWrap: "wrap" },
  exerciseLine1Col: { width: "100%", fontSize: 10, marginBottom: 3, flexDirection: "row" },
  exerciseLine2Col: { width: "50%", fontSize: 10, marginBottom: 3, paddingRight: 8, flexDirection: "row" },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 3, marginRight: 6 },
  exerciseName: { color: INK },
  exerciseAmount: { color: MUTED },
  restDay: { fontSize: 10, color: MUTED, fontStyle: "italic", marginBottom: 8 },
  dayBlock: { marginBottom: 16 },
  summaryBox: { backgroundColor: OFF, borderRadius: 8, padding: 16, marginTop: 8 },
  summaryTitle: { fontSize: 13, fontWeight: 700, color: INK, marginBottom: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: 9, color: MUTED },
  summaryValue: { fontSize: 11, fontWeight: 700, color: INK },
  dotsRow: { flexDirection: "row", marginTop: 3 },
  dayDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  categoryBarRow: { marginBottom: 6 },
  categoryBarLabel: { fontSize: 8, color: MUTED, marginBottom: 2 },
  categoryBarTrack: { height: 5, backgroundColor: "#EFEAE3", borderRadius: 3 },
  categoryBarFill: { height: 5, backgroundColor: CRIMSON, borderRadius: 3 },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 8, color: MUTED, textAlign: "center" },
});

const CATEGORY_COLOR: Record<string, string> = {
  STRENGTH: "#C41230",
  CARDIO: "#2563EB",
  BALANCE: "#16A34A",
  FLEXIBILITY: "#9333EA",
};

const WEEKDAY = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function formatFullDate(d: Date) {
  return `${WEEKDAY[d.getDay()]}, ${d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
}

export function WeeklyReportPdf({ data }: { data: WeeklyReportData }) {
  const maxCount = Math.max(1, ...data.days.map((d) => d.totalCount));
  const maxCategoryCount = Math.max(1, ...data.summary.categoryBreakdown.map((c) => c.count));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBanner}>
          <Text style={styles.headerBrand}>DAILYFIT</Text>
          <Text style={styles.headerTitle}>Laporan Progres Mingguan</Text>
          <Text style={styles.headerPeriod}>{data.periodLabel}</Text>
        </View>

        <View style={styles.headerMetaRow}>
          <Text style={styles.headerMetaText}>
            {data.userName} · Dibuat {data.generatedAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </View>

        <View style={styles.content}>
        <View style={styles.divider} />

        {data.days.map((day) => {
          const useGrid = day.exercises.length > 4;
          return (
            <View key={day.dayNumber} style={styles.dayBlock} wrap>
              <View style={styles.dayHeaderRow}>
                <Text style={styles.dayLabel}>Hari {day.dayNumber}</Text>
                <Text style={styles.dayDate}>{formatFullDate(day.date)}</Text>
              </View>

              {day.exercises.length > 0 && (
                <View style={styles.intensityBarTrack}>
                  <View
                    style={[
                      styles.intensityBarFill,
                      { width: `${(day.totalCount / maxCount) * 100}%` },
                    ]}
                  />
                </View>
              )}

              {day.exercises.length === 0 ? (
                <Text style={styles.restDay}>Tidak ada latihan</Text>
              ) : (
                <View style={styles.exerciseGrid}>
                  {day.exercises.map((ex, idx) => (
                    <View key={idx} style={useGrid ? styles.exerciseLine2Col : styles.exerciseLine1Col}>
                      <View style={[styles.dot, { backgroundColor: CATEGORY_COLOR[ex.category] }]} />
                      <Text>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        <Text style={styles.exerciseAmount}>{"  "}{ex.amount}{ex.unit === "x" ? "x" : " detik"}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.divider} />

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Ringkasan Minggu Ini</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Hari Latihan</Text>
            <View>
              <Text style={styles.summaryValue}>{data.summary.daysTrained} dari 7 hari</Text>
              <View style={styles.dotsRow}>
                {data.days.slice().reverse().map((d) => (
                  <View
                    key={d.dayNumber}
                    style={[
                      styles.dayDot,
                      { backgroundColor: d.totalCount > 0 ? CRIMSON : "#E5E0DA" },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Exercise Dilakukan</Text>
            <Text style={styles.summaryValue}>{data.summary.totalExercises}x</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Exercise Paling Sering</Text>
            <Text style={styles.summaryValue}>
              {data.summary.topExercise
                ? `${data.summary.topExercise.name} (${data.summary.topExercise.count}x)`
                : "-"}
            </Text>
          </View>

          {data.summary.categoryBreakdown.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.summaryLabel, { marginBottom: 6 }]}>Breakdown Tipe Latihan</Text>
              {data.summary.categoryBreakdown.map((c) => (
                <View key={c.category} style={styles.categoryBarRow}>
                  <Text style={styles.categoryBarLabel}>
                    {CATEGORY_LABEL[c.category]} ({c.count}x)
                  </Text>
                  <View style={styles.categoryBarTrack}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        {
                          width: `${(c.count / maxCategoryCount) * 100}%`,
                          backgroundColor: CATEGORY_COLOR[c.category],
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        </View>

        <Text style={styles.footer} fixed>
          Dibuat otomatis oleh DailyFit — laporan ini mencerminkan aktivitas checklist yang tercatat di aplikasi.
        </Text>
      </Page>
    </Document>
  );
}
