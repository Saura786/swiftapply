import Link from "next/link";

const features = [
  { number: "01", symbol: "✦", title: "Tailor your resume", text: "Start with your CV and a job description. Build a focused draft that brings your most relevant experience forward." },
  { number: "02", symbol: "⌁", title: "Review ATS fit", text: "Explore how clearly your resume reflects the role's requirements and see areas you may want to strengthen." },
  { number: "03", symbol: "↗", title: "Prepare your documents", text: "Create a role-specific cover letter, review your strengths and prepare for interview conversations." },
  { number: "04", symbol: "▤", title: "Keep your search organised", text: "Track companies, application dates, follow-ups and outcomes in one private workspace." },
];

const steps = [
  ["01", "Bring your resume", "Upload a DOCX, TXT or text-based PDF, or paste your resume text."],
  ["02", "Add the role", "Paste the job description and choose the opportunity you're targeting."],
  ["03", "Make it yours", "Review the suggestions, edit your drafts and download the documents you want to use."],
];

function Brand() {
  return <Link href="/" className="marketing-brand" aria-label="ApplyIQ home"><span className="marketing-logo">A</span><span>Apply<span>IQ</span></span></Link>;
}
function Arrow() { return <span aria-hidden="true">↗</span>; }

export default function Home() {
  return (
    <main className="marketing-site">
      <header className="marketing-nav">
        <div className="marketing-container marketing-nav-inner">
          <Brand />
          <nav aria-label="Main navigation"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#faq">FAQ</a></nav>
          <div className="marketing-nav-actions"><Link href="/workspace" className="marketing-login">Log in</Link><Link href="/workspace?mode=signup" className="marketing-button marketing-button-small">Get started <Arrow /></Link></div>
        </div>
      </header>

      <section className="marketing-hero">
        <div className="marketing-hero-wash" />
        <div className="marketing-container marketing-hero-grid">
          <div className="marketing-hero-copy">
            <div className="marketing-eyebrow"><i /> YOUR JOB SEARCH, MORE FOCUSED</div>
            <h1>Make every application <em>count.</em></h1>
            <p className="marketing-lede">Bring your resume and the role you want. ApplyIQ helps you tailor your CV, prepare your documents and stay organised from first draft to follow-up.</p>
            <div className="marketing-hero-actions"><Link href="/workspace?mode=signup" className="marketing-button">Create your account <Arrow /></Link><Link href="/workspace" className="marketing-text-link">I already have an account →</Link></div>
            <div className="marketing-points"><span>✓ Five AI generations each day</span><span>✓ Private account workspace</span><span>✓ No card required to sign up</span></div>
          </div>

          <div className="marketing-visual" aria-label="Illustration of the ApplyIQ resume workspace">
            <div className="marketing-float marketing-float-top">✦ Role-aware suggestions</div>
            <div className="marketing-product-window">
              <div className="marketing-window-bar"><div className="marketing-window-brand"><span className="marketing-mini-logo">A</span> ApplyIQ</div><div className="marketing-window-controls"><i/><i/><i/></div></div>
              <div className="marketing-window-body">
                <aside className="marketing-mock-sidebar"><span className="marketing-avatar">JD</span><i className="selected"/><i/><i/><b/><i/><i/></aside>
                <div className="marketing-mock-main">
                  <small className="marketing-kicker">RESUME BUILDER</small>
                  <h3>Your next opportunity</h3>
                  <p>Senior Product Designer · Example role</p>
                  <div className="marketing-resume-sheet">
                    <div className="marketing-sheet-head"><div><b>Jordan Davis</b><small>PRODUCT DESIGNER</small></div><span>CV</span></div>
                    <div className="marketing-sheet-rule"/>
                    <strong>EXPERIENCE</strong><i/><i className="short"/><i/>
                    <strong className="skills-label">CORE SKILLS</strong>
                    <div className="marketing-pills"><span>Product strategy</span><span>Prototyping</span><span>Research</span></div>
                  </div>
                  <div className="marketing-tip"><span>✦</span><div><b>Make your impact clearer</b><small>Bring measurable project outcomes into this experience section.</small></div><Arrow/></div>
                  <div className="marketing-window-foot"><span>● Draft saved to your workspace</span><b>Review draft →</b></div>
                </div>
              </div>
            </div>
            <div className="marketing-float marketing-float-bottom">● Application saved</div>
            <p className="marketing-visual-caption">A calmer way to organise your next move.</p>
          </div>
        </div>
      </section>

      <section className="marketing-strip"><div className="marketing-container"><span>ONE PLACE FOR YOUR JOB SEARCH</span><b>Resume tailoring</b><i/><b>ATS insights</b><i/><b>Cover letters</b><i/><b>Interview prep</b><i/><b>Application tracking</b></div></section>

      <section className="marketing-section" id="features">
        <div className="marketing-container">
          <div className="marketing-section-head"><div><div className="marketing-eyebrow">A LITTLE MORE CLARITY, AT EVERY STEP</div><h2>Everything around the application,<br/><span>finally in one place.</span></h2></div><p>Less switching between documents and notes. More time to make each application thoughtful, relevant and ready to send.</p></div>
          <div className="marketing-feature-grid">{features.map(f=><article className="marketing-feature-card" key={f.number}><div className="marketing-feature-top"><span>{f.symbol}</span><small>{f.number}</small></div><h3>{f.title}</h3><p>{f.text}</p><i/></article>)}</div>
        </div>
      </section>

      <section className="marketing-section marketing-how" id="how-it-works">
        <div className="marketing-container marketing-how-grid"><div><div className="marketing-eyebrow">A SIMPLE WORKFLOW</div><h2>From “I should apply” to <em>ready to send.</em></h2><p>Start with the experience you already have. Use the role as your guide. Keep control of every change before anything leaves your desk.</p><Link href="/workspace?mode=signup" className="marketing-button">Start your first application <Arrow/></Link></div><div className="marketing-steps">{steps.map(([n,t,d],i)=><div className="marketing-step" key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div>{i!==2&&<i/>}</div>)}</div></div>
      </section>

      <section className="marketing-free"><div className="marketing-container"><div className="marketing-free-card"><div><div className="marketing-eyebrow">START WITHOUT THE PRESSURE</div><h2>A better place to begin.<br/><em>With clear limits.</em></h2><p>Create an account without adding a payment card. AI features are limited to five generations per user each UTC day and depend on the service’s available AI credits.</p><Link href="/workspace?mode=signup" className="marketing-button marketing-button-light">Create your account <Arrow/></Link><small>AI generations have a daily usage allowance. You stay in control of what you edit and download.</small></div><div className="marketing-free-art"><div className="marketing-paper"><small>YOUR NEXT CHAPTER</small><b>A clearer story.<br/><em>A stronger application.</em></b><i/><i/><i/><footer>✦ Built around the role you want</footer></div><div className="marketing-limit"><b>5</b><span>daily AI<br/>generations</span></div></div></div></div></section>

      <section className="marketing-section marketing-faq" id="faq"><div className="marketing-container marketing-faq-grid"><div><div className="marketing-eyebrow">GOOD TO KNOW</div><h2>A few things<br/>before you begin.</h2><p>A straightforward workspace, with you in control of your applications and documents.</p></div><div className="marketing-faq-list"><details open><summary>Do I need a credit card to sign up?</summary><p>No. You can create an account without adding a payment card. AI use is limited to five generations per user each UTC day and depends on the service’s available AI credits.</p></details><details><summary>Can I edit what the AI creates?</summary><p>Yes. Treat the output as a draft. Review, change and approve your resume and cover letter before using them.</p></details><details><summary>What files can I upload?</summary><p>ApplyIQ supports DOCX, TXT and text-based PDF resumes. PDF uploads are limited to 5MB.</p></details><details><summary>Does an ATS score guarantee an interview?</summary><p>No. ATS insights are guidance to help you review your application. Employers use different systems and hiring criteria, and no score can guarantee an outcome.</p></details></div></div></section>

      <section className="marketing-final"><div className="marketing-container"><div className="marketing-eyebrow">YOUR NEXT STEP STARTS HERE</div><h2>Give your next application<br/>a little more intention.</h2><p>Bring your experience. Bring the role. We’ll help you organise the rest.</p><div><Link href="/workspace?mode=signup" className="marketing-button">Create your account <Arrow/></Link><Link href="/workspace">Already have an account? Log in</Link></div></div></section>

      <footer className="marketing-footer"><div className="marketing-container"><Brand/><p>Make every application count.</p><div><a href="#features">Features</a><a href="#faq">FAQ</a><Link href="/privacy">Privacy</Link><Link href="/workspace">Log in</Link></div><small>© {new Date().getFullYear()} ApplyIQ. AI suggestions are drafts; always review your application before sending.</small></div></footer>
    </main>
  );
}
