import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { getMonthlyReportData } from "@/lib/reports/monthly";
import { MonthlyReportPdf } from "@/lib/reports/MonthlyReportPdf";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = await getMonthlyReportData(session.user.id, session.user.name ?? "Pengguna");
  const buffer = await renderToBuffer(<MonthlyReportPdf data={data} />);

  const filename = `dailyfit-laporan-bulanan-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
