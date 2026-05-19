"use client";

import { useEffect, useState } from "react";
import mammoth from "mammoth";
import { supabase } from "../lib/supabase";

const APP_NAME = "SwiftApply";
const DAILY_LIMIT = 3;

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

function todayKey(email: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `swiftapply-usage-${email}-${today}`;
}

function getUsage(email: string) {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(todayKey(email)) || "0");
}

function increaseUsage(email: string) {
  const current = getUsage(email);
  localStorage.setItem(todayKey(email), String(current + 1));
}

async function extractTextFromFile(file: File) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt")) return await file.text();

  if (name.endsWith(".docx")) {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  }

  throw new Error("Please upload DOCX or TXT. PDF upload will be added later.");
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

function Button({ children, onClick, loading = false, secondary = false, danger = false }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "12px 18px",
        borderRadius: 999,
        border: secondary || danger ? "1px solid #ddd" : "none",
        background: danger ? "#fff1f2" : secondary ? "#fff" : "#4f46e5",
        color: danger ? "#be123c" : secondary ? "#222" : "#fff",
        fontWeight: 800,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "Generating..." : children}
    </button>
  );
}

function Card({ children }: any) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 24,
      padding: 24,
      boxShadow: "0 18px 50px rgba(0,0,0,0.06)",
    }}>
      {children}
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 9 }: any) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 16,
          border: "1px solid #ddd",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      />
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: 13,
          borderRadius: 14,
          border: "1px solid #ddd",
          fontSize: 14,
        }}
      />
    </div>
  );
}

function ResultBox({ title, text, onClear, fileBase }: any) {
  if (!text) return null;

  return (
    <div style={{
      marginTop: 24,
      padding: 22,
      borderRadius: 20,
      background: "#f8f7ff",
      border: "1px solid #dedbff",
      whiteSpace: "pre-wrap",
      lineHeight: 1.7,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

function LoadingBox({ message }: any) {
  if (!message) return null;

  return (
    <div style={{
      marginTop: 18,
      marginBottom: 18,
      padding: 16,
      borderRadius: 18,
      background: "#eef2ff",
      color: "#3730a3",
      fontWeight: 700,
    }}>
      ⏳ {message}
    </div>
  );
}

function ResumeUpload({ label, setResume }: any) {
  const [status, setStatus] = useState("");

  async function upload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatus("Reading file...");
      const text = await extractTextFromFile(file);
      setResume(text);
      setStatus(`Uploaded: ${file.name}`);
    } catch (err: any) {
      setStatus("Error: " + err.message);
    }
  }

  return (
    <div style={{ padding: 18, borderRadius: 18, border: "1px dashed #9ca3af", background: "#f9fafb" }}>
      <strong>{label}</strong>
      <p style={{ color: "#666", margin: "6px 0 10px" }}>Upload DOCX or TXT. PDF upload will be added later.</p>
      <input type="file" accept=".docx,.txt" onChange={upload} />
      {status && <p style={{ color: "#4f46e5" }}>{status}</p>}
    </div>
  );
}

function statusColor(status: string) {
  if (status === "Offer") return "#dcfce7";
  if (status === "Rejected") return "#fee2e2";
  if (status === "Interview" || status === "Interviewed") return "#fef3c7";
  if (status === "Ghosted") return "#f3f4f6";
  return "#eef2ff";
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
        email: authEmail,
        password: authPassword,
      });

      setAuthLoading(false);

      if (error) alert(error.message);
      else alert("Account created. If email confirmation is enabled, check your email. Otherwise, log in now.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
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

    const current = getUsage(user.email);
    if (current >= DAILY_LIMIT) {
      throw new Error(`Daily test limit reached. You can generate ${DAILY_LIMIT} items per day during beta testing.`);
    }

    const text = await callAPI(prompt);
    increaseUsage(user.email);
    return text;
  }

  async function callAPI(prompt: string) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "API failed");
    return String(data.text || "").replaceAll("#", "").trim();
  }

  async function generateTailoredResume() {
    setLoading("Building a complete tailored resume...");
    try {
      const text = await protectedCall(`
You are an expert resume strategist and ATS resume writer.

Create a COMPLETE tailored resume for the job description.

Rules:
- Do NOT use markdown heading symbols.
- Do NOT use # symbols.
- Do NOT stop halfway.
- Do NOT invent fake jobs, dates, education, companies, certificates, or personal details.
- Keep the candidate's real background truthful.
- Improve wording, structure, keywords, achievements, ATS match, and relevance.
- If the original resume is long, compress it intelligently but still return a complete resume.
- Output only the complete resume. Do not add explanation after it.

Candidate resume:
${resume}

Target company the candidate is applying to:
${company}

Target role the candidate is applying for:
${role}

Job description:
${jd}
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
You are an ATS resume evaluator.

Analyse the resume against the job description and give a realistic ATS compatibility score.

Rules:
- Do NOT use # symbols.
- Be honest and practical.
- Do not invent experience.
- Explain what is missing and how to improve.

Return in this format:
ATS Compatibility Score: X/100

Verdict:
Short verdict.

Keyword Match:
List matching keywords.

Missing Keywords:
List important missing keywords.

Formatting & ATS Risk:
Mention formatting risks.

Top Improvements:
Give 5 clear improvements.

Resume:
${resume}

Target company the candidate is applying to:
${company}

Target role the candidate is applying for:
${role}

Job description:
${jd}
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
Write a complete tailored cover letter.

Rules:
- Do NOT use markdown heading symbols.
- Do NOT use # symbols.
- Do NOT invent fake experience.
- Use only the candidate's real resume details.
- Match the target company and target role.
- Keep it human, confident, specific, and under 350 words.
- Output only the cover letter.

Resume:
${resume}

Target company the candidate is applying to:
${company}

Target role the candidate is applying for:
${role}

Job description:
${jd}
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
Compare this resume against the job description.

Rules:
- Do NOT use # symbols.

Give:
1. Match score out of 10
2. Top strengths
3. Weaknesses/gaps
4. Missing ATS keywords
5. What the candidate should add/change
6. What skills to focus on before applying

Resume:
${resume}

Target company the candidate is applying to:
${company}

Target role the candidate is applying for:
${role}

Job description:
${jd}
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
Prepare this candidate for interview.

Rules:
- Do NOT use # symbols.

Include:
1. Strong self-introduction
2. Likely technical questions
3. Likely behavioural questions
4. STAR answer suggestions based only on resume
5. Questions candidate should ask interviewer
6. Target company research checklist

Resume:
${resume}

Target company the candidate is applying to:
${company}

Target role the candidate is applying for:
${role}

Job description:
${jd}
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
Write a professional follow-up email for this job application.

Rules:
- Do NOT use # symbols.

Target company the candidate applied to:
${company}

Target role the candidate applied for:
${role}

Resume context:
${resume}

Job description:
${jd}

Make it short, polite, and confident.
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
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#eef2ff,#ffffff)", fontFamily: "Arial", padding: 20 }}>
        <Card>
          <h1 style={{ marginTop: 0, fontSize: 38 }}>SwiftApply</h1>
          <p style={{ color: "#666", marginBottom: 30 }}>AI-powered job application workspace</p>

          <Input label="Email" type="email" value={authEmail} onChange={setAuthEmail} placeholder="you@example.com" />
          <Input label="Password" type="password" value={authPassword} onChange={setAuthPassword} placeholder="Minimum 6 characters" />

          <button onClick={loginOrSignup} disabled={authLoading} style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", background: "#4f46e5", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
            {authLoading ? "Please wait..." : authMode === "login" ? "Login" : "Create Account"}
          </button>

          <button onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} style={{ width: "100%", padding: 16, borderRadius: 14, border: "1px solid #ddd", background: "white", color: "#111827", fontWeight: 700, cursor: "pointer", fontSize: 15, marginTop: 12 }}>
            {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
          </button>
        </Card>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh" }}>
        <aside style={{ background: "#111827", color: "white", padding: 24 }}>
          <h1 style={{ fontSize: 28, marginTop: 0 }}>{APP_NAME}</h1>
          <p style={{ color: "#cbd5e1", fontSize: 14 }}>AI job application workspace</p>

          <div style={{ background: "#1f2937", padding: 12, borderRadius: 14, marginTop: 18 }}>
            <strong>{remaining}/{DAILY_LIMIT}</strong>
            <p style={{ margin: "6px 0 0", color: "#cbd5e1", fontSize: 13 }}>AI generations left today</p>
          </div>

          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 8 }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: activeTab === tab ? "#4f46e5" : "transparent",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 30, fontSize: 13, color: "#cbd5e1" }}>{user.email}</div>
          <button onClick={logout} style={{ marginTop: 12, padding: "10px 14px", borderRadius: 999, border: "1px solid #374151", background: "transparent", color: "white", cursor: "pointer" }}>
            Logout
          </button>
        </aside>

        <section style={{ padding: 30 }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 34, margin: 0 }}>{activeTab}</h2>
            <p style={{ color: "#64748b" }}>Create stronger job applications with less time and more confidence.</p>
          </div>

          <LoadingBox message={loading} />

          {activeTab === "Dashboard" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
              <Card><h3>Saved Applications</h3><p style={{ fontSize: 32, fontWeight: 900 }}>{jobs.length}</p></Card>
              <Card><h3>Resume Output</h3><p>{tailoredResume ? "Generated" : "Not generated yet"}</p></Card>
              <Card><h3>ATS Score</h3><p>{atsScore ? "Available" : "Not checked yet"}</p></Card>
              <Card><h3>Daily Limit</h3><p>{remaining}/{DAILY_LIMIT} generations left</p></Card>
            </div>
          )}

          {activeTab === "Resume Builder" && (
            <Card>
              <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                <Button secondary={activeResume !== "resume1"} onClick={() => setActiveResume("resume1")}>Resume 1</Button>
                <Button secondary={activeResume !== "resume2"} onClick={() => setActiveResume("resume2")}>Resume 2</Button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                <ResumeUpload label="Upload Selected Resume" setResume={setResume} />
                <div>
                  <Input label="Target Company" value={company} onChange={setCompany} placeholder="Example: Google" />
                  <Input label="Target Role" value={role} onChange={setRole} placeholder="Example: Product Analyst" />
                </div>
              </div>

              <TextArea label="Your Resume" value={resume} onChange={setResume} rows={12} />
              <TextArea label="Job Description" value={jd} onChange={setJd} rows={10} />

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
              <p style={{ color: "#666" }}>Track target company, target role, applied date, follow-up date, status, and notes.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 12 }}>
                <Input label="Target Company" value={trackerCompany} onChange={setTrackerCompany} />
                <Input label="Target Role" value={trackerRole} onChange={setTrackerRole} />
                <Input label="Date Applied" type="date" value={trackerAppliedDate} onChange={setTrackerAppliedDate} />
                <Input label="Follow-Up Date" type="date" value={trackerFollowUpDate} onChange={setTrackerFollowUpDate} />

                <div>
                  <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Status</label>
                  <select value={trackerStatus} onChange={(e) => setTrackerStatus(e.target.value)} style={{ width: "100%", padding: 13, borderRadius: 14, border: "1px solid #ddd" }}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <Input label="Notes" value={trackerNotes} onChange={setTrackerNotes} />
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button onClick={addApplicationManual}>Add Application</Button>
                <Button secondary onClick={() => exportTrackerCSV(jobs)}>Export Tracker CSV</Button>
              </div>

              <div style={{ marginTop: 24 }}>
                {jobs.length === 0 && <p>No applications tracked yet.</p>}

                {jobs.map((job) => (
                  <div key={job.id} style={{ padding: 18, borderRadius: 18, border: "1px solid #ddd", marginBottom: 14, background: statusColor(job.status) }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <strong>{job.company}</strong> — {job.role}
                        <p style={{ color: "#475569", margin: "6px 0" }}>
                          Applied: {job.appliedDate || "Not set"} | Follow-up: {job.followUpDate || "Not set"}
                        </p>
                      </div>
                      <Button danger onClick={() => deleteJob(job.id)}>Delete</Button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 12 }}>
                      <select value={job.status} onChange={(e) => updateJob(job.id, "status", e.target.value)}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                      <input type="date" value={job.followUpDate} onChange={(e) => updateJob(job.id, "followUpDate", e.target.value)} />
                      <input placeholder="Notes" value={job.notes} onChange={(e) => updateJob(job.id, "notes", e.target.value)} />
                    </div>
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
      </div>
    </main>
  );
}