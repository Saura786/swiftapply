import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "How ApplyIQ handles account information, resume drafts and AI requests.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <header className="legal-nav"><div className="legal-nav-inner"><Link href="/" className="legal-brand"><span className="marketing-logo">A</span> Apply<span>IQ</span></Link><Link href="/workspace" className="legal-nav-link">Open workspace →</Link></div></header>
      <article className="legal-content">
        <Link href="/" className="legal-back">← Back to ApplyIQ</Link>
        <div className="marketing-eyebrow">YOUR INFORMATION</div>
        <h1>Privacy notice</h1>
        <p className="legal-updated">Last updated: 18 November 2026</p>
        <p>ApplyIQ helps you prepare job applications. This notice explains, in plain language, what information the current application handles and which services process it. It describes the app as it is currently built; it is not a promise about features that may be added later.</p>

        <h2>1. Information you provide</h2>
        <p>When you create an account, ApplyIQ processes your email address and authentication information through Supabase. When you use the workspace, you may enter resume text, job descriptions, company and role details, application statuses, notes, and AI-generated drafts.</p>

        <h2>2. Where workspace drafts are stored</h2>
        <p>The current app saves resume text, job descriptions, generated drafts and application-tracker entries in your browser's local storage, under a key associated with your signed-in Supabase user ID. These workspace drafts are not currently synchronised between devices. Anyone with access to your unlocked browser profile may be able to access local browser data, so use a private device and sign out when appropriate.</p>
        <p>Supabase is used for account authentication and the server-enforced daily AI-generation quota. The application code does not intentionally save your resume or job-description text in the ApplyIQ Supabase database.</p>

        <h2>3. When content is sent for AI processing</h2>
        <p>When you request an AI feature, the relevant text you submit (which may include resume content and a job description) is sent from the ApplyIQ server to Anthropic's Claude AI service to generate a response. Do not submit information you are not comfortable sending to an AI service. Review Anthropic's own privacy and service terms to understand its handling of API inputs and outputs.</p>
        <p>DOCX and TXT files are read in your browser. Text-based PDF files are uploaded to the ApplyIQ server for text extraction; the server returns the extracted text to your browser. The app code does not intentionally store the uploaded PDF file as an application record.</p>

        <h2>4. Service providers</h2>
        <p>ApplyIQ currently relies on these providers to operate core features:</p>
        <ul>
          <li><a href="https://supabase.com/privacy" target="_blank" rel="noreferrer">Supabase</a> — account authentication and daily usage records.</li>
          <li><a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noreferrer">Anthropic</a> — AI processing when you request a generation.</li>
          <li><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel</a> — website hosting and server execution.</li>
        </ul>
        <p>These providers process information under their own terms and privacy notices. ApplyIQ does not control their independent systems or retention practices.</p>

        <h2>5. Your choices</h2>
        <p>You can avoid using AI features, choose what content to submit, edit generated drafts before using them, and remove local workspace drafts by clearing the site's browser storage. Clearing browser storage also removes the locally saved workspace and may sign you out. Logging out alone does not delete locally saved drafts. Account authentication and quota records are held by Supabase; this version of the site does not yet provide a self-service account-deletion control.</p>

        <h2>6. Security and retention</h2>
        <p>ApplyIQ uses authenticated server routes for AI generation and PDF text extraction. No internet service can guarantee perfect security. Protect your account credentials, keep your device secure, and avoid submitting unnecessary sensitive information. Browser-stored drafts remain until you remove them or the browser clears that data. Provider records are subject to the relevant provider's policies.</p>

        <h2>7. Changes and contact</h2>
        <p>This notice should be reviewed and updated as the service, providers or applicable legal requirements change. For privacy or account requests, contact the ApplyIQ site operator through the support channel provided to you by the service owner.</p>

        <div className="legal-note"><b>Please note:</b> AI suggestions are drafts, not legal, recruitment or employment advice. Check every document for accuracy before sending it to an employer.</div>
        <Link href="/workspace?mode=signup" className="marketing-button legal-cta">Create an account <span>↗</span></Link>
      </article>
      <footer className="legal-footer"><Link href="/">ApplyIQ</Link><span>© {new Date().getFullYear()} ApplyIQ</span><Link href="/workspace">Log in</Link></footer>
    </main>
  );
}
