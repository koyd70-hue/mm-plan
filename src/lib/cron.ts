import cron from "node-cron";

export function startCronJobs() {
  // Run at 09:00 on the 15th of every month
  cron.schedule("0 9 15 * *", async () => {
    console.log("[Cron] Monthly MM plan email job started");
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const res = await fetch(`${appUrl}/api/cron`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("[Cron] Job completed:", data);
      } else {
        console.error("[Cron] Job failed:", res.status, await res.text());
      }
    } catch (error) {
      console.error("[Cron] Job error:", error);
    }
  });

  console.log("[Cron] Scheduled: Monthly MM plan email on 15th at 09:00");
}
