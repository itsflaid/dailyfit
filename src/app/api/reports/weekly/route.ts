import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { getWeeklyReportData } from "@/lib/reports/weekly";
import { WeeklyReportPdf } from "@/lib/reports/WeeklyReportPdf";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = await getWeeklyReportData(session.user.id, session.user.name ?? "Pengguna");
  const buffer = await renderToBuffer(<WeeklyReportPdf data={data} />);

  const filename = `dailyfit-laporan-mingguan-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
