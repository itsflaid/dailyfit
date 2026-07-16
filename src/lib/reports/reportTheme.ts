import { StyleSheet } from "@react-pdf/renderer";
import { ExerciseCategory } from "@prisma/client";

export const CRIMSON = "#C41230";
export const INK = "#0F0A0B";
export const MUTED = "#8A8A8A";
export const OFF = "#F6F4F1";

export const CATEGORY_TINT: Record<string, string> = {
  STRENGTH: "#FBE7EA",
  CARDIO: "#E7EEFD",
  BALANCE: "#E5F5EA",
  FLEXIBILITY: "#F3E8FC",
};

export const CATEGORY_COLOR: Record<string, string> = {
  STRENGTH: "#C41230",
  CARDIO: "#2563EB",
  BALANCE: "#16A34A",
  FLEXIBILITY: "#9333EA",
};

export const WEEKDAY = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function formatFullDate(d: Date) {
  return `${WEEKDAY[d.getDay()]}, ${d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
}

export const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  content: { padding: 32, paddingBottom: 48 },
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
  tableWrap: { borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "#E5E0DA", marginTop: 4 },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: CRIMSON, paddingVertical: 6, paddingHorizontal: 10 },
  tableHeaderCell: { fontSize: 7, fontWeight: 700, color: MUTED, letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 10 },
  tableRowAlt: { backgroundColor: "#FAF9F7" },
  colExercise: { width: "50%" },
  colCategory: { width: "27%" },
  colAmount: { width: "23%", textAlign: "right" },
  exerciseNameCell: { fontSize: 9, color: INK, fontWeight: 600 },
  amountCell: { fontSize: 9, color: INK, fontWeight: 700, textAlign: "right" },
  categoryBadge: { alignSelf: "flex-start", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  categoryBadgeText: { fontSize: 7, fontWeight: 700 },
});
