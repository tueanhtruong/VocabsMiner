import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto",
  subsets: ["latin", "latin-ext"], // latin-ext covers IPA Unicode range
  weight: ["400", "500", "700"],
});
export const metadata: Metadata = {
  title: "VocabMiner - IELTS Vocabulary Extraction Tool",
  description:
    "Stop pausing your IELTS practice to look up words. VocabMiner extracts, defines, and contextualizes high-impact academic vocabulary from your reading passages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${notoSans.className} h-full antialiased`}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning />
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
