import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { MonthlyReportData } from "./monthly";
import { CATEGORY_LABEL } from "./monthly";
import { styles, CRIMSON, CATEGORY_COLOR, CATEGORY_TINT, formatFullDate } from "./reportTheme";

export function MonthlyReportPdf({ data }: { data: MonthlyReportData }) {
  const maxCount = Math.max(1, ...data.days.map((d) => d.totalCount));
  const maxCategoryCount = Math.max(1, ...data.summary.categoryBreakdown.map((c) => c.count));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBanner}>
          <Text style={styles.headerBrand}>DAILYFIT</Text>
          <Text style={styles.headerTitle}>Laporan Progres Bulanan</Text>
          <Text style={styles.headerPeriod}>{data.periodLabel}</Text>
          <Text style={{ fontSize: 9, color: "#FFFFFF", opacity: 0.75, marginTop: 2 }}>30 hari terakhir</Text>
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
          <Text style={styles.summaryTitle}>Ringkasan Bulan Ini</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Hari Latihan</Text>
            <View>
              <Text style={styles.summaryValue}>{data.summary.daysTrained} dari {data.days.length} hari</Text>
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
