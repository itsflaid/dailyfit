import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="min-h-screen grid md:grid-cols-[55%_45%] bg-off">
      {/* LEFT */}
      <div
        className="order-2 md:order-1
          relative flex flex-col justify-between
          overflow-hidden
          min-h-[320px]
          px-6 py-8
          sm:px-10 sm:py-10
          md:px-[60px] md:py-[52px]
        "
        style={{ background: "#C41230" }}
      >
        {/* CIRCLE BG */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 560,
            height: 560,
            border: "90px solid rgba(255,255,255,0.06)",
            bottom: -180,
            left: -160,
          }}
        />

        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 200,
            height: 200,
            border: "36px solid rgba(255,255,255,0.05)",
            top: -50,
            right: 40,
          }}
        />

        {/* LOGO */}
        <span
          className="
            relative z-10
            font-display
            text-[0.75rem]
            sm:text-[0.9rem]
            tracking-[4px]
            uppercase
          "
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          DailyFit
        </span>

        {/* HERO */}
        <div className="relative z-10 md:ml-12 my-10 md:my-0">
          <h1
            className="
              font-display
              leading-[0.9]
              text-white
              uppercase
            "
            style={{
              fontSize: "clamp(3rem, 10vw, 8rem)",
              fontWeight: 900,
            }}
          >
            <div>Latih.</div>

            <div style={{ color: "rgba(255,255,255,0.22)" }}>
              Catat.
            </div>

            <div>Ulangi.</div>
          </h1>

          <p
            className="
              mt-5
              text-sm
              sm:text-[0.92rem]
              leading-[1.7]
              max-w-[320px]
            "
            style={{ color: "rgba(255,255,255,0.58)" }}
          >
            Tracker &amp; planner home workout yang sepenuhnya
            milikmu — kamu yang atur, kamu yang kontrol.
          </p>
        </div>

        {/* FOOTER */}
        <span
          className="relative z-10 text-[0.65rem] sm:text-[0.7rem]"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          © 2026 DailyFit
        </span>
      </div>

      {/* RIGHT */}
      <div
        className="order-1 md:order-2
          relative flex flex-col justify-center
          overflow-hidden
          border-t md:border-t-0 md:border-l
          px-20 py-10
          sm:px-10
          md:px-[64px] md:py-[52px]
        "
        style={{
          background: "#F6F4F1",
          borderColor: "rgba(0,0,0,0.06)",
        }}
      >
        {/* BG TEXT */}
        <div
          className="
            absolute
            font-display
            pointer-events-none
            select-none
            leading-none
            hidden sm:block
          "
          style={{
            fontSize: "clamp(8rem, 18vw, 18rem)",
            color: "rgba(196,18,48,0.045)",
            right: -30,
            bottom: -20,
            fontWeight: 900,
            letterSpacing: "-6px",
          }}
        >
          DF
        </div>

        {/* FORM */}
        <div className="relative z-10 w-full max-w-[380px]">
          {children}
        </div>
      </div>
    </div>
  );
}