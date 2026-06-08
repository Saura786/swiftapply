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
  title: "ApplyIQ – AI Resume Builder & ATS Optimizer",
  description:
    "Tailor your resume to any job description, improve ATS scores, generate cover letters, prepare for interviews, and track applications with AI.",
  keywords: [
    "AI resume builder",
    "resume tailoring",
    "ATS resume",
    "ATS score",
    "cover letter generator",
    "job application tracker",
    "interview preparation",
    "resume optimization",
    "career tools",
    "job search",
  ],
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