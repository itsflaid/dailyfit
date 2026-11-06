import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveToday } from "@/lib/stats";
import { renderToBuffer } from "@react-pdf/renderer";
import { getWeeklyReportData } from "@/lib/reports/weekly";
import { WeeklyReportPdf } from "@/lib/reports/WeeklyReportPdf";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const today = resolveToday(new URL(req.url).searchParams.get("today"));
    const data = await getWeeklyReportData(session.user.id, session.user.name ?? "Pengguna", today);
    const buffer = await renderToBuffer(<WeeklyReportPdf data={data} />);

    const filename = `dailyfit-laporan-mingguan-${today}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Gagal membuat laporan mingguan:", error);
    return NextResponse.json({ message: "Gagal membuat laporan" }, { status: 500 });
  }
}
