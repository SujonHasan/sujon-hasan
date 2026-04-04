import { Navbar } from "@/components/portfolio/navbar";
import { Footer } from "@/components/portfolio/footer";
import { connectDB } from "@/lib/db";
import About from "@/models/About";

export default async function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let socialLinks;
  try {
    await connectDB();
    const about = await About.findOne().lean();
    socialLinks = about?.socialLinks;
  } catch {
    socialLinks = undefined;
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer socialLinks={socialLinks as Record<string, string> | undefined} />
    </>
  );
}
