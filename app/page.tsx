"use client";

import { useEffect, useState } from "react";
import mammoth from "mammoth";
import { supabase } from "../lib/supabase";

const APP_NAME = "SwiftApply";
const DAILY_LIMIT = 3;
const MAX_INPUT = 7000;

const TABS = [
  "Dashboard",
  "Resume Builder",
  "ATS Score",
  "Cover Letter",
  "Strength Analysis",
  "Interview Prep",
  "Application Tracker",
  "Follow-Up",
];

const STATUSES = [
  "Saved",
  "Applied",
  "Follow-Up Needed",
  "Interview",
  "Interviewed",
  "Documentation Needed",
  "Visa",
  "Offer",
  "Rejected",
  "Ghosted",
];

const SAMPLE_RESUME = `John Doe
Software Engineer | john@email.com | Dublin, Ireland

EXPERIENCE
Senior Frontend Developer — TechCorp, 2021–Present
- Led migration from Vue 2 to React 18
- Mentored junior developers

SKILLS
React, TypeScript, Node.js, AWS`;

const SAMPLE_JD = `We are looking for a Senior Frontend Engineer.
Requirements:
- React
- TypeScript
- AWS
- Leadership experience`;

function shortText(text: string) {
  return String(text || "").slice(0, MAX_INPUT);
}

function todayKey(email: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `swiftapply-usage-${email}-${today}`;
}

function getUsage(email: string) {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(todayKey(email)) || "0");
}

function increaseUsage(email: string) {
  localStorage.setItem(todayKey(email), String(getUsage(email) + 1));
}

async function extractTextFromFile(file: File) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt")) {
    return await file.text();
  }

  if (name.endsWith(".docx")) {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({
      arrayBuffer: buffer,
    });
    return result.value;
  }

  if (name.endsWith(".pdf")) {
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("PDF too large. Please upload a text-based PDF under 2MB, or use DOCX.");
    }

    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs?url");

    (pdfjsLib as any).GlobalWorkerOptions.workerSrc =
      (worker as any).default || worker;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    const maxPages = Math.min(pdf.numPages, 5);

    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();

      const pageText = content.items
        .map((item: any) => item.str || "")
        .join(" ");

      fullText += pageText + "\n";
    }

    const cleaned = fullText.trim();

    if (!cleaned || cleaned.length < 50) {
      throw new Error("Could not read this PDF. It may be scanned or image-based. Please upload DOCX or paste resume text.");
    }

    return cleaned;
  }

  throw new Error("Unsupported file type. Please upload DOCX, TXT, or a small text-based PDF.");
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadWord(filename: string, text: string) {
  const html = `<html><head><meta charset="utf-8"></head><body><pre style="font-family:Arial;white-space:pre-wrap;line-height:1.5;">${text}</pre></body></html>`;
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function printPDF(title: string, text: string) {
  const win = window.open("", "_blank");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial; padding: 40px; line-height: 1.6; }
          pre { white-space: pre-wrap; font-family: Arial; }
        </style>
      </head>
      <body>
        <pre>${text}</pre>
        <script>window.print()</script>
      </body>
    </html>
  `);

  win.document.close();
}

function exportTrackerCSV(jobs: any[]) {
  const headers = ["Company", "Role", "Date Applied", "Follow Up Date", "Status", "Notes"];
  const rows = jobs.map((job) => [
    job.company,
    job.role,
    job.appliedDate,
    job.followUpDate,
    job.status,
    job.notes,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "swiftapply-application-tracker.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function statusColor(status: string) {
  if (status === "Offer") return "#dcfce7";
  if (status === "Rejected") return "#fee2e2";
  if (status === "Interview" || status === "Interviewed") return "#fef3c7";
  if (status === "Ghosted") return "#f3f4f6";
  return "#eef2ff";
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={type === "email" ? "email" : type === "password" ? "current-password" : "off"}
        inputMode={type === "email" ? "email" : "text"}
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 9,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} />
    </div>
  );
}

function Button({
  children,
  onClick,
  loading = false,
  secondary = false,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`btn ${secondary ? "secondary" : ""} ${danger ? "danger" : ""}`}
    >
      {loading ? "Generating..." : children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

function ResultBox({
  title,
  text,
  onClear,
  fileBase,
}: {
  title: string;
  text: string;
  onClear: () => void;
  fileBase: string;
}) {
  if (!text) return null;

  return (
    <div className="result">
      <div className="resultTop">
        <h3>{title}</h3>

        <div className="actions">
          <Button secondary onClick={() => downloadWord(`${fileBase}.doc`, text)}>Word</Button>
          <Button secondary onClick={() => printPDF(title, text)}>PDF</Button>
          <Button secondary onClick={() => downloadText(`${fileBase}.txt`, text)}>TXT</Button>
          <Button danger onClick={onClear}>Clear</Button>
        </div>
      </div>

      {text}
    </div>
  );
}

function ResumeUpload({
  label,
  setResume,
}: {
  label: string;
  setResume: (value: string) => void;
}) {
  const [status, setStatus] = useState("");

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatus("Reading file...");
      const text = await extractTextFromFile(file);
      setResume(shortText(text));
      setStatus(`Uploaded: ${file.name}`);
    } catch (err: any) {
      setStatus("Error: " + err.message);
    }
  }

  return (
    <div className="upload">
      <strong>{label}</strong>
      <p>Upload DOCX, TXT, or small text-based PDF under 2MB. DOCX is recommended.</p>
      <input type="file" accept=".docx,.txt,.pdf" onChange={upload} />
      {status && <p className="status">{status}</p>}
    </div>
  );
}

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [resume1, setResume1] = useState(SAMPLE_RESUME);
  const [resume2, setResume2] = useState("");
  const [activeResume, setActiveResume] = useState("resume1");

  const resume = activeResume === "resume1" ? resume1 : resume2;
  const setResume = activeResume === "resume1" ? setResume1 : setResume2;

  const [jd, setJd] = useState(SAMPLE_JD);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const [tailoredResume, setTailoredResume] = useState("");
  const [atsScore, setAtsScore] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [interviewPrep, setInterviewPrep] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [loading, setLoading] = useState("");

  const [jobs, setJobs] = useState<any[]>([]);
  const [trackerCompany, setTrackerCompany] = useState("");
  const [trackerRole, setTrackerRole] = useState("");
  const [trackerAppliedDate, setTrackerAppliedDate] = useState(new Date().toISOString().slice(0, 10));
  const [trackerFollowUpDate, setTrackerFollowUpDate] = useState("");
  const [trackerStatus, setTrackerStatus] = useState("Applied");
  const [trackerNotes, setTrackerNotes] = useState("");

  const usage = user?.email ? getUsage(user.email) : 0;
  const remaining = Math.max(DAILY_LIMIT - usage, 0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("swiftapply-state");

    if (saved) {
      const s = JSON.parse(saved);
      setResume1(s.resume1 || SAMPLE_RESUME);
      setResume2(s.resume2 || "");
      setJd(s.jd || SAMPLE_JD);
      setCompany(s.company || "");
      setRole(s.role || "");
      setTailoredResume(s.tailoredResume || "");
      setAtsScore(s.atsScore || "");
      setCoverLetter(s.coverLetter || "");
      setAnalysis(s.analysis || "");
      setInterviewPrep(s.interviewPrep || "");
      setFollowUp(s.followUp || "");
      setJobs(s.jobs || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "swiftapply-state",
      JSON.stringify({
        resume1,
        resume2,
        jd,
        company,
        role,
        tailoredResume,
        atsScore,
        coverLetter,
        analysis,
        interviewPrep,
        followUp,
        jobs,
      })
    );
  }, [resume1, resume2, jd, company, role, tailoredResume, atsScore, coverLetter, analysis, interviewPrep, followUp, jobs]);

  async function loginOrSignup() {
    if (!authEmail || !authPassword) {
      alert("Enter email and password.");
      return;
    }

    setAuthLoading(true);

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
      });

      setAuthLoading(false);

      if (error) alert(error.message);
      else alert("Account created. Please log in now.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });

    setAuthLoading(false);

    if (error) alert(error.message);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function protectedCall(prompt: string) {
    if (!user?.email) throw new Error("Please login first.");

    if (getUsage(user.email) >= DAILY_LIMIT) {
      throw new Error(`Daily test limit reached. You can generate ${DAILY_LIMIT} items per day during beta testing.`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: shortText(prompt) }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "API failed");

      increaseUsage(user.email);
      return String(data.text || "").replaceAll("#", "").trim();
    } catch (err: any) {
      clearTimeout(timeout);

      if (err.name === "AbortError") {
        throw new Error("Request took too long. Try a shorter resume or job description.");
      }

      throw err;
    }
  }

  async function generateTailoredResume() {
    setLoading("Building a complete tailored resume...");

    try {
      const text = await protectedCall(`
Create a COMPLETE tailored resume. Keep it truthful. Do not invent details.
No markdown symbols. No explanation after the resume.

Resume:
${shortText(resume)}

Target company:
${company}

Target role:
${role}

Job description:
${shortText(jd)}
`);

      setTailoredResume(text);
    } catch (err: any) {
      setTailoredResume("Error: " + err.message);
    } finally {
      setLoading("");
    }
  }

  async function generateATSScore() {
    setLoading("Calculating ATS score and keyword match...");

    try {
      const text = await protectedCall(`
Give ATS Compatibility Score out of 100.
Include verdict, matching keywords, missing keywords, formatting risk, and 5 improvements.
No markdown symbols.

Resume:
${shortText(resume)}

Target company:
${company}

Target role:
${role}

Job description:
${shortText(jd)}
`);

      setAtsScore(text);
    } catch (err: any) {
      setAtsScore("Error: " + err.message);
    } finally {
      setLoading("");
    }
  }

  async function generateCoverLetter() {
    setLoading("Writing tailored cover letter...");

    try {
      const text = await protectedCall(`
Write a tailored cover letter under 350 words.
Use only real resume details. No fake experience. No markdown symbols.

Resume:
${shortText(resume)}

Target company:
${company}

Target role:
${role}

Job description:
${shortText(jd)}
`);

      setCoverLetter(text);
    } catch (err: any) {
      setCoverLetter("Error: " + err.message);
    } finally {
      setLoading("");
    }
  }

  async function generateAnalysis() {
    setLoading("Analysing strengths and weaknesses...");

    try {
      const text = await protectedCall(`
Compare resume with job description.
Give match score, strengths, weaknesses, missing keywords, changes to make, and skills to focus on.
No markdown symbols.

Resume:
${shortText(resume)}

Target company:
${company}

Target role:
${role}

Job description:
${shortText(jd)}
`);

      setAnalysis(text);
    } catch (err: any) {
      setAnalysis("Error: " + err.message);
    } finally {
      setLoading("");
    }
  }

  async function generateInterviewPrep() {
    setLoading("Preparing interview guide...");

    try {
      const text = await protectedCall(`
Create interview prep for this candidate.
Include intro, likely technical questions, behavioural questions, STAR answers, questions to ask, and company research checklist.
No markdown symbols.

Resume:
${shortText(resume)}

Target company:
${company}

Target role:
${role}

Job description:
${shortText(jd)}
`);

      setInterviewPrep(text);
    } catch (err: any) {
      setInterviewPrep("Error: " + err.message);
    } finally {
      setLoading("");
    }
  }

  async function generateFollowUp() {
    setLoading("Writing follow-up message...");

    try {
      const text = await protectedCall(`
Write a short professional follow-up email. No markdown symbols.

Target company:
${company}

Target role:
${role}
`);

      setFollowUp(text);
    } catch (err: any) {
      setFollowUp("Error: " + err.message);
    } finally {
      setLoading("");
    }
  }

  function addApplicationFromBuilder(status = "Applied") {
    if (!company || !role) {
      alert("Add target company and target role first.");
      return;
    }

    setJobs([
      ...jobs,
      {
        id: Date.now(),
        company,
        role,
        status,
        appliedDate: new Date().toISOString().slice(0, 10),
        followUpDate: "",
        notes: "",
      },
    ]);

    setActiveTab("Application Tracker");
  }

  function addApplicationManual() {
    if (!trackerCompany || !trackerRole) {
      alert("Add target company and target role.");
      return;
    }

    setJobs([
      ...jobs,
      {
        id: Date.now(),
        company: trackerCompany,
        role: trackerRole,
        appliedDate: trackerAppliedDate,
        followUpDate: trackerFollowUpDate,
        status: trackerStatus,
        notes: trackerNotes,
      },
    ]);

    setTrackerCompany("");
    setTrackerRole("");
    setTrackerAppliedDate(new Date().toISOString().slice(0, 10));
    setTrackerFollowUpDate("");
    setTrackerStatus("Applied");
    setTrackerNotes("");
  }

  function updateJob(id: number, key: string, value: string) {
    setJobs(jobs.map((j) => (j.id === id ? { ...j, [key]: value } : j)));
  }

  function deleteJob(id: number) {
    setJobs(jobs.filter((j) => j.id !== id));
  }

  if (!user) {
    return (
      <>
        <style>{styles}</style>

        <main className="loginPage">
          <div className="loginCard">
            <h1>SwiftApply</h1>
            <p>AI-powered job application workspace</p>

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={authEmail}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                enterKeyHint="next"
                onChange={(e) => setAuthEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={authPassword}
                placeholder="Minimum 6 characters"
                autoComplete="current-password"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                enterKeyHint="done"
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>

            <button className="mainLoginBtn" onClick={loginOrSignup} disabled={authLoading}>
              {authLoading ? "Please wait..." : authMode === "login" ? "Login" : "Create Account"}
            </button>

            <button className="switchBtn" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
              {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <main className="app">
        <aside className="sidebar">
          <h1>{APP_NAME}</h1>
          <p>AI job application workspace</p>

          <div className="usage">
            <strong>{remaining}/{DAILY_LIMIT}</strong>
            <span>AI generations left today</span>
          </div>

          <nav>
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? "active" : ""}>
                {tab}
              </button>
            ))}
          </nav>

          <div className="userEmail">{user.email}</div>
          <button className="logout" onClick={logout}>Logout</button>
        </aside>

        <section className="content">
          <div className="pageTitle">
            <h2>{activeTab}</h2>
            <p>Create stronger job applications with less time and more confidence.</p>
          </div>

          {loading && <div className="loading">⏳ {loading}</div>}

          {activeTab === "Dashboard" && (
            <div className="grid">
              <Card><h3>Saved Applications</h3><b>{jobs.length}</b></Card>
              <Card><h3>Resume Output</h3><p>{tailoredResume ? "Generated" : "Not generated yet"}</p></Card>
              <Card><h3>ATS Score</h3><p>{atsScore ? "Available" : "Not checked yet"}</p></Card>
              <Card><h3>Daily Limit</h3><p>{remaining}/{DAILY_LIMIT} generations left</p></Card>
            </div>
          )}

          {activeTab === "Resume Builder" && (
            <Card>
              <div className="actions">
                <Button secondary={activeResume !== "resume1"} onClick={() => setActiveResume("resume1")}>Resume 1</Button>
                <Button secondary={activeResume !== "resume2"} onClick={() => setActiveResume("resume2")}>Resume 2</Button>
              </div>

              <div className="twoCol">
                <ResumeUpload label="Upload Selected Resume" setResume={setResume} />

                <div>
                  <Input label="Target Company" value={company} onChange={setCompany} placeholder="Example: Google" />
                  <Input label="Target Role" value={role} onChange={setRole} placeholder="Example: Product Analyst" />
                </div>
              </div>

              <TextArea label="Your Resume" value={resume} onChange={(v: string) => setResume(shortText(v))} rows={12} />
              <TextArea label="Job Description" value={jd} onChange={(v: string) => setJd(shortText(v))} rows={10} />

              <div className="actions">
                <Button onClick={generateTailoredResume} loading={loading.includes("resume")}>Tailor Resume</Button>
                <Button secondary onClick={() => addApplicationFromBuilder("Applied")}>Mark Application as Applied</Button>
              </div>

              <ResultBox title="Tailored Resume" text={tailoredResume} fileBase="tailored-resume" onClear={() => setTailoredResume("")} />
            </Card>
          )}

          {activeTab === "ATS Score" && (
            <Card>
              <p>This checks how closely your selected resume matches the target job description.</p>
              <Button onClick={generateATSScore} loading={loading.includes("ATS")}>Calculate ATS Score</Button>
              <ResultBox title="ATS Score Report" text={atsScore} fileBase="ats-score-report" onClear={() => setAtsScore("")} />
            </Card>
          )}

          {activeTab === "Cover Letter" && (
            <Card>
              <p>This uses your selected resume, target company, target role and job description.</p>
              <Button onClick={generateCoverLetter} loading={loading.includes("cover")}>Generate Cover Letter</Button>
              <ResultBox title="Cover Letter" text={coverLetter} fileBase="cover-letter" onClear={() => setCoverLetter("")} />
            </Card>
          )}

          {activeTab === "Strength Analysis" && (
            <Card>
              <p>This uses your selected resume, target company, target role and job description.</p>
              <Button onClick={generateAnalysis} loading={loading.includes("strength")}>Analyse Strengths & Weaknesses</Button>
              <ResultBox title="Strength Analysis" text={analysis} fileBase="strength-analysis" onClear={() => setAnalysis("")} />
            </Card>
          )}

          {activeTab === "Interview Prep" && (
            <Card>
              <p>This gives AI interview prep for the target company and target role.</p>
              <Button onClick={generateInterviewPrep} loading={loading.includes("interview")}>Generate Interview Prep</Button>
              <ResultBox title="Interview Prep" text={interviewPrep} fileBase="interview-prep" onClear={() => setInterviewPrep("")} />
            </Card>
          )}

          {activeTab === "Application Tracker" && (
            <Card>
              <h2>Application Tracker</h2>
              <p>Track target company, target role, applied date, follow-up date, status, and notes.</p>

              <div className="twoCol">
                <Input label="Target Company" value={trackerCompany} onChange={setTrackerCompany} />
                <Input label="Target Role" value={trackerRole} onChange={setTrackerRole} />
                <Input label="Date Applied" type="date" value={trackerAppliedDate} onChange={setTrackerAppliedDate} />
                <Input label="Follow-Up Date" type="date" value={trackerFollowUpDate} onChange={setTrackerFollowUpDate} />

                <div className="field">
                  <label>Status</label>
                  <select value={trackerStatus} onChange={(e) => setTrackerStatus(e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <Input label="Notes" value={trackerNotes} onChange={setTrackerNotes} />
              </div>

              <div className="actions">
                <Button onClick={addApplicationManual}>Add Application</Button>
                <Button secondary onClick={() => exportTrackerCSV(jobs)}>Export Tracker CSV</Button>
              </div>

              <div className="jobList">
                {jobs.length === 0 && <p>No applications tracked yet.</p>}

                {jobs.map((job) => (
                  <div key={job.id} className="job" style={{ background: statusColor(job.status) }}>
                    <div>
                      <strong>{job.company}</strong> — {job.role}
                      <p>Applied: {job.appliedDate || "Not set"} | Follow-up: {job.followUpDate || "Not set"}</p>
                    </div>

                    <Button danger onClick={() => deleteJob(job.id)}>Delete</Button>

                    <select value={job.status} onChange={(e) => updateJob(job.id, "status", e.target.value)}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>

                    <input type="date" value={job.followUpDate} onChange={(e) => updateJob(job.id, "followUpDate", e.target.value)} />
                    <input placeholder="Notes" value={job.notes} onChange={(e) => updateJob(job.id, "notes", e.target.value)} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "Follow-Up" && (
            <Card>
              <p>Use this after applying or interviewing for the target company and target role.</p>
              <Button onClick={generateFollowUp} loading={loading.includes("follow")}>Generate Follow-Up</Button>
              <ResultBox title="Follow-Up Message" text={followUp} fileBase="follow-up-message" onClear={() => setFollowUp("")} />
            </Card>
          )}
        </section>
      </main>
    </>
  );
}

const styles = `
* { box-sizing: border-box; }
body { margin: 0; }

input, textarea, select {
  background: white !important;
  color: #111827 !important;
  -webkit-text-fill-color: #111827 !important;
}

input::placeholder,
textarea::placeholder {
  color: #9ca3af !important;
  -webkit-text-fill-color: #9ca3af !important;
}

.loginPage {
  min-height: 100vh;
  background: linear-gradient(135deg,#111827,#4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.loginCard {
  width: 100%;
  max-width: 430px;
  background: white;
  border-radius: 28px;
  padding: 32px;
  box-shadow: 0 28px 80px rgba(0,0,0,0.25);
}

.loginCard h1 {
  margin: 0;
  font-size: 42px;
  color: #111827;
}

.loginCard p {
  color: #64748b;
}

.mainLoginBtn,
.switchBtn {
  width: 100%;
  padding: 15px;
  border-radius: 15px;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
}

.mainLoginBtn {
  border: none;
  background: #4f46e5;
  color: white;
}

.switchBtn {
  border: 1px solid #ddd;
  background: white;
  color: #111827;
  margin-top: 12px;
}

.app {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
  background: #f8fafc;
  font-family: Arial, sans-serif;
}

.sidebar {
  background: #111827;
  color: white;
  padding: 24px;
}

.sidebar h1 {
  margin: 0;
  font-size: 28px;
}

.sidebar p,
.userEmail {
  color: #cbd5e1;
  font-size: 13px;
}

.usage {
  background: #1f2937;
  padding: 12px;
  border-radius: 14px;
  margin-top: 18px;
}

.usage span {
  display: block;
  color: #cbd5e1;
  font-size: 13px;
  margin-top: 4px;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
}

nav button {
  text-align: left;
  padding: 12px 14px;
  border-radius: 14px;
  border: none;
  background: transparent;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

nav button.active {
  background: #4f46e5;
}

.logout {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid #374151;
  background: transparent;
  color: white;
  cursor: pointer;
}

.content {
  padding: 30px;
}

.pageTitle h2 {
  margin: 0;
  font-size: 34px;
}

.pageTitle p {
  color: #64748b;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 18px 50px rgba(0,0,0,0.06);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
  gap: 18px;
}

.grid b {
  font-size: 32px;
}

.twoCol {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(240px,1fr));
  gap: 16px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-weight: 800;
  margin-bottom: 8px;
  color: #111827;
}

.field input,
.field textarea,
.field select,
select,
input {
  width: 100%;
  padding: 13px;
  border-radius: 14px;
  border: 1px solid #d1d5db;
  font-size: 16px;
}

.field textarea {
  line-height: 1.6;
}

.btn {
  padding: 12px 18px;
  border-radius: 999px;
  border: none;
  background: #4f46e5;
  color: white;
  font-weight: 800;
  cursor: pointer;
}

.btn.secondary {
  background: white;
  color: #111827;
  border: 1px solid #ddd;
}

.btn.danger {
  background: #fff1f2;
  color: #be123c;
  border: 1px solid #fecdd3;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 12px 0;
}

.result {
  margin-top: 24px;
  padding: 22px;
  border-radius: 20px;
  background: #f8f7ff;
  border: 1px solid #dedbff;
  white-space: pre-wrap;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.resultTop {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.upload {
  padding: 18px;
  border-radius: 18px;
  border: 1px dashed #9ca3af;
  background: #f9fafb;
}

.upload p {
  color: #666;
}

.status {
  color: #4f46e5 !important;
}

.loading {
  padding: 16px;
  border-radius: 18px;
  background: #eef2ff;
  color: #3730a3;
  font-weight: 700;
  margin-bottom: 18px;
}

.job {
  padding: 18px;
  border-radius: 18px;
  border: 1px solid #ddd;
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

@media (max-width: 800px) {
  .app {
    display: block;
  }

  .sidebar {
    position: static;
    padding: 18px;
  }

  nav {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  nav button {
    white-space: nowrap;
    min-width: max-content;
    font-size: 13px;
  }

  .content {
    padding: 16px;
  }

  .pageTitle h2 {
    font-size: 28px;
  }

  .card {
    padding: 18px;
    border-radius: 20px;
  }

  .loginCard {
    padding: 24px;
    border-radius: 22px;
  }

  .loginCard h1 {
    font-size: 34px;
  }

  .btn,
  .mainLoginBtn,
  .switchBtn {
    width: 100%;
  }

  .actions {
    flex-direction: column;
  }

  .resultTop {
    flex-direction: column;
  }
}
`;
