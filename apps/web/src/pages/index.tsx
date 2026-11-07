'use client'

import { useEffect, useState } from 'react'
import { Activity, ArrowRight, BriefcaseMedical, Check, ChevronLeft, ChevronRight, CircleCheck, Clock3, Database, ExternalLink, HeartPulse, Menu, Play, Radio, ShieldCheck, Sparkles, Stethoscope, X } from 'lucide-react'

const slides = [
  {
    eyebrow: 'For modern care teams',
    title: 'Less admin. More time for the people who need you.',
    body: 'SynapseMed brings your clinical day into focus — from first appointment to follow-up — so your team can move with confidence.',
    image: '/doctor-hero.png',
  },
  {
    eyebrow: 'For better patient journeys',
    title: 'Make every patient feel seen, heard, and cared for.',
    body: 'Keep the right information moving between your team and your patients with one calm, connected workspace.',
    image: '/doctor-hero.png',
  },
  {
    eyebrow: 'For healthier practices',
    title: 'Turn a busy practice into a better experience.',
    body: 'Reduce friction, improve visibility, and give your people more room to deliver exceptional care.',
    image: '/doctor-hero.png',
  },
]

const benefits = [
  { icon: Clock3, label: 'Save valuable hours', copy: 'Automate the routine work that slows your team down.' },
  { icon: HeartPulse, label: 'Care with context', copy: 'See the full patient story when it matters most.' },
  { icon: ShieldCheck, label: 'Stay secure', copy: 'Keep sensitive health information protected and in control.' },
]

const companionApps = [
  {
    icon: BriefcaseMedical,
    name: 'MediGig',
    tag: 'Workforce network',
    description: 'A South African marketplace where practices find verified locum professionals and clinicians pick up shifts with escrow-protected payments.',
    points: ['Verified medical professionals', 'AI-assisted shift matching', 'Clear rates and protected payments'],
    href: 'https://github.com/beyondthens/MediGig',
  },
  {
    icon: Radio,
    name: 'CardioTrack',
    tag: 'Remote monitoring',
    description: 'A cardiovascular telehealth platform for real-time vitals, trend analytics, remote chronic care, and practice-management connectivity.',
    points: ['BP, heart rate, SpO2 and glucose', 'HL7 FHIR and Healthbridge add-ons', 'POPIA-aware audit trails and alerts'],
    href: 'https://github.com/beyondthens/CardioTrack',
  },
]

export default function Page() {
  const [active, setActive] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const slide = slides[active]

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 7000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9f7] text-[#172522]">
      <div className="announcement"><Sparkles size={14} /> Built for the way healthcare works today <ArrowRight size={14} /></div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="SynapseMed home"><span className="brand-mark"><HeartPulse className="ecg-icon" size={21} strokeWidth={2.5} /></span>Synapse<span>Med</span></a>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
          <a href="#why">Why SynapseMed</a><a href="#solutions">Solutions</a><a href="#security">Security</a><a href="#contact">Contact</a>
          <a className="mobile-action" href="#contact">Book a demo <ArrowRight size={16} /></a>
        </nav>
        <div className="header-actions"><a className="sign-in" href="#contact">Sign in</a><a className="button button-dark small" href="#contact">Book a demo <ArrowRight size={16} /></a></div>
        <button className="menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" />{slide.eyebrow}</div>
          <h1>{slide.title}</h1>
          <p>{slide.body}</p>
          <div className="hero-actions"><a className="button button-teal" href="#contact">See SynapseMed in action <ArrowRight size={17} /></a><a className="watch-link" href="#solutions"><span className="play"><Play size={13} fill="currentColor" /></span> Explore the platform</a></div>
          <div className="proof-row"><div className="avatar-stack"><span>AM</span><span>TK</span><span>NS</span><span className="more">+</span></div><p><strong>Trusted by care teams</strong><br /><span>Across clinics, hospitals &amp; practices</span></p></div>
        </div>
        <div className="hero-visual">
          <div className="shape shape-one" /><div className="shape shape-two" />
          <div className="floating-card card-top"><CircleCheck size={18} /><div><strong>Patient ready</strong><small>All the context in one place</small></div></div>
          <div className="image-frame"><img src={slide.image} alt="Black woman doctor holding a tablet in a modern clinic" /></div>
          <div className="floating-card card-bottom"><div className="mini-icon"><HeartPulse className="ecg-icon" size={17} /></div><div><strong>Care, connected</strong><small>SynapseMed platform</small></div></div>
          <div className="slider-controls"><button aria-label="Previous slide" onClick={() => setActive((active - 1 + slides.length) % slides.length)}><ChevronLeft size={18} /></button><span>{String(active + 1).padStart(2, '0')} <i>/</i> 03</span><button aria-label="Next slide" onClick={() => setActive((active + 1) % slides.length)}><ChevronRight size={18} /></button></div>
        </div>
      </section>

      <section className="trust-strip"><p>Designed to remove the friction from</p><div><span>CLINICAL WORKFLOWS</span><span>PATIENT EXPERIENCES</span><span>HEALTHCARE OPERATIONS</span></div></section>

      <section id="why" className="pain-section"><div className="section-label">The care gap</div><div className="pain-grid"><h2>Healthcare is human.<br /><em>Your systems should be too.</em></h2><div><p className="large-copy">When care teams spend their days chasing information, patients feel the distance.</p><p className="muted-copy">SynapseMed gives your practice a simpler way forward — connecting your people, processes, and patients around the care that matters.</p><a className="text-link" href="#solutions">A better way to work <ArrowRight size={16} /></a></div></div></section>

      <section id="solutions" className="benefit-section"><div className="section-label">One connected platform</div><div className="benefit-heading"><h2>Good care starts with<br /><span>less getting in the way.</span></h2><p>Everything your team needs to spend less time managing care and more time delivering it.</p></div><div className="benefit-grid">{benefits.map(({ icon: Icon, label, copy }) => <article className="benefit-card" key={label}><div className="benefit-icon"><Icon size={21} /></div><h3>{label}</h3><p>{copy}</p><a href="#contact" aria-label={`Learn more about ${label}`}><ArrowRight size={18} /></a></article>)}</div></section>

      <section id="ecosystem" className="ecosystem-section"><div className="section-label">A stronger care ecosystem</div><div className="ecosystem-heading"><h2>Pair SynapseMed with<br /><span>purpose-built health apps.</span></h2><p>Extend the front door of your practice with focused tools for workforce, remote monitoring, and clinical continuity.</p></div><div className="companion-grid">{companionApps.map(({ icon: Icon, name, tag, description, points, href }) => <article className="companion-card" key={name}><div className="companion-top"><div className="companion-icon"><Icon size={23} /></div><span>{tag}</span></div><h3>{name}</h3><p>{description}</p><ul>{points.map((point) => <li key={point}><Check size={15} />{point}</li>)}</ul><a className="companion-link" href={href} target="_blank" rel="noreferrer">Explore {name} <ExternalLink size={15} /></a></article>)}</div><div className="ecosystem-note"><Database size={18} /><span>Built to make connected care more practical across South African healthcare teams.</span><Activity size={19} /></div></section>

      <section id="how-it-works" className="workflow-section"><div className="section-label">See the work, not just the promise</div><div className="workflow-heading"><h2>One calm view of<br /><span>your whole day.</span></h2><p>SynapseMed turns scattered tasks into a simple care rhythm your team can see, share, and act on.</p></div><div className="product-window"><div className="window-top"><div className="window-brand"><span className="window-brand-mark"><HeartPulse className="ecg-icon" size={14} /></span><strong>SynapseMed</strong></div><span className="window-date">Tuesday, 24 June 2026</span><div className="window-avatar">AM</div></div><div className="window-body"><aside className="window-sidebar"><span className="sidebar-active"><Activity size={16} /> Overview</span><span><Clock3 size={16} /> Schedule</span><span><HeartPulse className="ecg-icon" size={16} /> Patients</span><span><Database size={16} /> Reports</span><div className="sidebar-help"><ShieldCheck size={16} /><small>Secure workspace<br /><strong>POPIA ready</strong></small></div></aside><div className="window-content"><div className="window-greeting"><div><small>Good morning, Dr. Mokoena</small><h3>Your care overview</h3></div><button>+ Add patient</button></div><div className="metric-row"><div><small>Today&apos;s appointments</small><strong>18</strong><span className="positive">+12% vs last week</span></div><div><small>Patients needing follow-up</small><strong>06</strong><span className="attention">Needs attention</span></div><div><small>Care team availability</small><strong>92%</strong><span className="positive">All systems healthy</span></div></div><div className="window-columns"><div className="schedule-card"><div className="card-heading"><strong>Today&apos;s schedule</strong><span>View all <ArrowRight size={13} /></span></div><div className="appointment active"><span className="time">09:30</span><div className="patient-dot teal" /><div><strong>Thandi Maseko</strong><small>Follow-up · Hypertension</small></div><span className="status">In progress</span></div><div className="appointment"><span className="time">10:15</span><div className="patient-dot blue" /><div><strong>Jonas Ndlovu</strong><small>New patient · General care</small></div><span className="status muted">Upcoming</span></div><div className="appointment"><span className="time">11:00</span><div className="patient-dot amber" /><div><strong>Leah Williams</strong><small>Review · CardioTrack sync</small></div><span className="status muted">Upcoming</span></div></div><div className="insight-card"><div className="insight-title"><span><HeartPulse className="ecg-icon" size={16} /> Care pulse</span><span className="live-dot">Live</span></div><div className="pulse-chart"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><strong>Patients are staying connected</strong><small>78% of follow-ups completed on time</small><div className="progress-track"><span /></div></div></div></div></div></div></section>

      <section id="security" className="feature-band"><div className="feature-icon"><Stethoscope size={25} /></div><div><div className="section-label">Made for healthcare</div><h2>Clarity for your team.<br />Confidence for every patient.</h2></div><div className="feature-points"><p><Check size={17} /> Built around real clinical workflows</p><p><Check size={17} /> Secure by design, simple by nature</p><p><Check size={17} /> Ready to grow with your practice</p></div></section>

      <section className="platform-visuals" aria-label="SynapseMed on web and mobile"><div className="section-label">Care wherever work happens</div><div className="platform-visuals-heading"><h2>One platform. Every screen.</h2><p>A quick look at the calm, connected experience your team can carry from the practice to the patient.</p></div><div className="device-stage"><div className="browser-mockup"><div className="mockup-bar"><span /><span /><span /><small>app.synapsemed.com</small></div><div className="browser-grid"><div className="browser-nav"><span className="mock-logo"><HeartPulse className="ecg-icon" size={11} /></span><i /><i /><i /><i /></div><div className="browser-main"><small>Care overview</small><strong>Good morning, Dr. Mokoena</strong><div className="browser-stats"><span><b>18</b>Appointments</span><span><b>06</b>Follow-ups</span></div><div className="browser-chart"><span /><span /><span /><span /><span /><span /><span /></div></div></div></div><div className="phone-mockup"><div className="phone-speaker" /><div className="phone-screen"><div className="phone-top"><span className="mock-logo"><HeartPulse className="ecg-icon" size={11} /></span><span className="phone-avatar">AM</span></div><small>Today, 24 June</small><strong>Your care plan</strong><div className="phone-card"><div className="phone-pulse"><HeartPulse className="ecg-icon" size={15} /></div><span><b>Thandi Maseko</b><small>Follow-up in 20 min</small></span><ArrowRight size={14} /></div><div className="phone-card muted"><div className="phone-pulse blue"><Activity size={15} /></div><span><b>Vitals synced</b><small>All readings look good</small></span><Check size={14} /></div></div></div></div></section>

      <section id="contact" className="cta-section"><div className="cta-orb" /><div className="section-label">Start a better day</div><h2>Give your team more<br /><em>time to care.</em></h2><p>See how SynapseMed can help your practice move forward.</p><a className="button button-light" href="mailto:hello@synapsemed.com">Book your demo <ArrowRight size={17} /></a></section>

      <footer><a className="brand" href="#top"><span className="brand-mark"><HeartPulse className="ecg-icon" size={19} /></span>Synapse<span>Med</span></a><p>Healthcare, connected with intention.</p><div className="footer-links"><a href="#why">Why SynapseMed</a><a href="#security">Privacy</a><a href="#contact">Contact</a></div><p className="copyright">© 2026 SynapseMed</p></footer>
    </main>
  )
}
