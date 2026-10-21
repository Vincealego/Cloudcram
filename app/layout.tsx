import "./globals.css";
import { CERT } from "@/lib/certs/az900";
export const metadata = { title: "CloudCram: unofficial AZ-900 study companion" };
const blobs = [{ width: 340, height: 340, background: "#60a5fa", left: -90, top: -70 }, { width: 300, height: 300, background: "#a78bfa", right: -80, top: "35%", animationDelay: "-7s" },
  { width: 300, height: 300, background: "#6ee7b7", left: "20%", bottom: -90, animationDelay: "-3s" }];
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><head><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet" /></head>
    <body>{blobs.map((s, i) => <div key={i} className="bl" style={s} />)}
      <main><div className="ban glass">{CERT.disclaimer} Questions are original and based on the public AZ-900 skills outline (as of January 14, 2026). Always check the official Microsoft Learn study guide.</div>{children}</main>
      <div id="fx" /></body></html>);
}
