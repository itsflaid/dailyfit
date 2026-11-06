import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveToday } from "@/lib/stats";
import { renderToBuffer } from "@react-pdf/renderer";
import { getMonthlyReportData } from "@/lib/reports/monthly";
import { MonthlyReportPdf } from "@/lib/reports/MonthlyReportPdf";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const today = resolveToday(new URL(req.url).searchParams.get("today"));
    const data = await getMonthlyReportData(session.user.id, session.user.name ?? "Pengguna", today);
    const buffer = await renderToBuffer(<MonthlyReportPdf data={data} />);

    const filename = `dailyfit-laporan-bulanan-${today}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Gagal membuat laporan bulanan:", error);
    return NextResponse.json({ message: "Gagal membuat laporan" }, { status: 500 });
  }
}
