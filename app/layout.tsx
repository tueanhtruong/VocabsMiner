import "@mantine/core/styles.css";
import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
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
      {...mantineHtmlProps}
      className={`${notoSans.variable} ${notoSans.className} h-full antialiased`}
    >
      <head>
        <ColorSchemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
