import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://applyiq.dev"),
  title: {
    default: "InduVanta – Make Every Job Application Count",
    template: "%s | InduVanta",
  },
  description:
    "Tailor your resume to job descriptions, review ATS fit, prepare cover letters and interviews, and organise your job search in one private workspace.",
  keywords: [
    "AI resume builder",
    "resume tailoring",
    "ATS resume checker",
    "resume job description match",
    "AI cover letter generator",
    "job application tracker",
    "interview preparation",
    "career tools",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://applyiq.dev/",
    siteName: "InduVanta",
    title: "InduVanta – Make Every Job Application Count",
    description:
      "A focused workspace to tailor your resume, prepare application documents and organise your job search.",
  },
  twitter: {
    card: "summary_large_image",
    title: "InduVanta – Make Every Job Application Count",
    description:
      "Tailor your resume, prepare application documents and keep your job search organised with InduVanta.",
  },
  icons: { icon: "/icon.svg" },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}