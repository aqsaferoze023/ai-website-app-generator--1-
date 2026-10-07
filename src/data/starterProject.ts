import type { GeneratedProject } from "../types";

export const starterProject: GeneratedProject = {
  id: "starter-design",
  title: "Digital Experiences",
  description: "A responsive product landing page with a custom device illustration and feature section.",
  createdAt: Date.now(),
  prompt: "Build a modern landing page for a digital product studio.",
  kind: "website",
  files: [
    {
      path: "src/App.jsx",
      content: `import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeatureCard from './components/FeatureCard';
import Footer from './components/Footer';
import './styles/global.css';

const features = [
  { icon: 'speed', title: 'Fast Performance', description: 'Lightning fast and optimized for all devices.' },
  { icon: 'design', title: 'Modern Design', description: 'Clean, beautiful and user-friendly interfaces.' },
  { icon: 'responsive', title: 'Fully Responsive', description: 'Looks great on desktop, tablet and mobile.' },
  { icon: 'custom', title: 'Easy to Customize', description: 'Simple code, full control, endless possibilities.' },
];

export default function App() {
  return (
    <div className="site-shell">
      <Navbar />
      <main>
        <Hero />
        <section className="features" id="features" aria-label="Our features">
          {features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
        </section>
      </main>
      <Footer />
    </div>
  );
}
`,
    },
    {
      path: "src/components/Navbar.jsx",
      content: `import React, { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-nav">
      <a className="brand" href="#home">YourBrand<span className="brand-dot">.</span></a>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? 'Close' : 'Menu'}</button>
      <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
        <a href="#home" onClick={() => setOpen(false)}>Home</a>
        <a href="#features" onClick={() => setOpen(false)}>Features</a>
        <a href="#features" onClick={() => setOpen(false)}>Pricing</a>
        <a href="#contact" onClick={() => setOpen(false)}>About</a>
      </nav>
      <a className="nav-cta" href="#contact">Get Started</a>
    </header>
  );
}
`,
    },
    {
      path: "src/components/Hero.jsx",
      content: `import React from 'react';

function DeviceIllustration() {
  return (
    <div className="device-scene" aria-hidden="true">
      <div className="scene-blob" />
      <div className="plant"><i /><i /><i /><span /></div>
      <div className="laptop">
        <div className="laptop-screen">
          <div className="app-mockup">
            <div className="mock-top"><b /><span /><span /></div>
            <div className="mock-body">
              <div className="mock-sidebar"><i /><i /><i /><i /></div>
              <div className="mock-content"><strong>Dashboard</strong><div className="mock-graph" /><em /><em /><em /></div>
            </div>
          </div>
        </div>
        <div className="laptop-base" />
      </div>
      <div className="phone"><div className="phone-screen"><b /><i /><i /><span /><span /><span /></div></div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-copy">
        <span className="hero-kicker">WELCOME TO WHAT'S NEXT</span>
        <h1>Build Amazing<br />Digital Experiences</h1>
        <p>Modern, fast and responsive websites and apps for your business. Powered by creativity.</p>
        <div className="hero-actions">
          <a className="primary-button" href="#contact">Get Started <span>\u2192</span></a>
          <a className="secondary-button" href="#features"><span>\u25b7</span> Explore Features</a>
        </div>
      </div>
      <DeviceIllustration />
    </section>
  );
}
`,
    },
    {
      path: "src/components/FeatureCard.jsx",
      content: `import React from 'react';

const paths = {
  speed: <><path d="M12 3a9 9 0 1 0 9 9" /><path d="m12 12 5-5" /><path d="M16 3h5v5" /></>,
  design: <><circle cx="12" cy="12" r="9" /><path d="M8 15c2-1 3-5 5-6 2-1 3 2 3 4" /><circle cx="8" cy="9" r="1" /></>,
  responsive: <><rect x="3" y="4" width="15" height="12" rx="2" /><path d="M8 20h5M11 16v4" /><rect x="17" y="9" width="4" height="10" rx="1" /></>,
  custom: <><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></>,
};

export default function FeatureCard({ icon, title, description }) {
  return (
    <article className="feature-card">
      <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[icon]}</svg></span>
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  );
}
`,
    },
    {
      path: "src/components/Footer.jsx",
      content: `import React from 'react';

export default function Footer() {
  return <footer className="site-footer" id="contact"><span>YourBrand.</span><p>Made for the way you create.</p><a href="mailto:hello@example.com">Let's talk \u2192</a></footer>;
}
`,
    },
    {
      path: "src/styles/global.css",
      content: `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

:root { font-family: 'DM Sans', Arial, sans-serif; color: #07334a; background: #f3faf8; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; }
a { color: inherit; text-decoration: none; }
button { font: inherit; }
.site-shell { min-height: 100vh; overflow: hidden; }
.site-nav { height: 88px; display: flex; align-items: center; padding: 0 40px; gap: 42px; background: #fffdf9; position: relative; z-index: 3; }
.brand { font-size: 25px; font-weight: 700; letter-spacing: -.8px; color: #006696; margin-right: auto; }
.brand-dot { color: #31b9ba; }
.nav-links { display: flex; gap: 38px; font-size: 15px; font-weight: 700; }
.nav-links a { transition: color .2s; }
.nav-links a:hover { color: #098db4; }
.nav-cta, .primary-button { display: inline-flex; align-items: center; justify-content: center; gap: 16px; border-radius: 13px; color: white; background: linear-gradient(120deg,#0879a7,#13a5c4); font-weight: 700; box-shadow: 0 10px 20px rgba(0,108,146,.16); transition: transform .2s, box-shadow .2s; }
.nav-cta:hover, .primary-button:hover { transform: translateY(-3px); box-shadow: 0 14px 23px rgba(0,108,146,.22); }
.nav-cta { padding: 13px 23px; font-size: 14px; }
.menu-toggle { display: none; }
.hero { min-height: 425px; background: radial-gradient(circle at 73% 15%,#e0f7ef 0,#d6f4ee 29%,transparent 55%),linear-gradient(100deg,#eaf9f5,#b9ebe4); position: relative; display: flex; align-items: center; overflow: hidden; }
.hero:after { content: ''; position: absolute; width: 490px; height: 340px; right: -130px; bottom: -205px; background: #7bcfce; opacity: .36; border-radius: 50%; transform: rotate(-14deg); }
.hero-copy { position: relative; z-index: 2; padding: 56px 40px; max-width: 595px; }
.hero-kicker { color: #1488a7; font-size: 12px; font-weight: 700; letter-spacing: 2.7px; }
h1 { font-size: clamp(43px,5vw,62px); line-height: 1.075; letter-spacing: -2.5px; margin: 16px 0 21px; color: #07334a; }
.hero-copy p { font-size: 18px; line-height: 1.55; max-width: 450px; margin: 0 0 27px; }
.hero-actions { display: flex; gap: 15px; align-items: center; }
.primary-button, .secondary-button { padding: 16px 23px; font-size: 15px; }
.secondary-button { display: inline-flex; gap: 9px; align-items: center; border: 1.5px solid #7dcbd0; border-radius: 13px; font-weight: 700; color: #006186; background: #e6fbf8; transition: background .2s; }
.secondary-button:hover { background: #fff; }
.device-scene { position: absolute; right: 41px; bottom: 35px; width: 490px; height: 323px; z-index: 1; }
.scene-blob { position: absolute; width: 490px; height: 320px; right: -65px; top: -39px; border-radius: 46% 30% 35% 50%; background: linear-gradient(135deg,#b7e9e2,#8fd5d4); opacity: .82; transform: rotate(-8deg); }
.laptop { position: absolute; width: 358px; height: 242px; left: 65px; top: 34px; filter: drop-shadow(0 18px 11px rgba(0,69,82,.23)); }
.laptop-screen { height: 224px; background: #06364b; padding: 13px 12px 16px; border-radius: 15px 15px 4px 4px; }
.app-mockup { background: #f9ffff; width: 100%; height: 100%; border-radius: 5px; overflow: hidden; }
.mock-top { height: 28px; background: #ebf7f6; border-bottom: 2px solid #d7eae7; display: flex; align-items: center; gap: 7px; padding: 0 12px; }
.mock-top b { width: 45px; height: 7px; background: #5fc3c8; border-radius: 4px; margin-right: auto; }
.mock-top span { width: 17px; height: 5px; background: #b6dadb; border-radius: 5px; }
.mock-body { display: flex; height: calc(100% - 28px); }
.mock-sidebar { width: 68px; background: #e7f6f4; padding: 17px 12px; display: flex; flex-direction: column; gap: 10px; }
.mock-sidebar i { height: 7px; background: #a9d9d9; border-radius: 3px; }
.mock-sidebar i:first-child { background: #0585aa; }
.mock-content { padding: 19px 18px; flex: 1; }
.mock-content strong { display: block; font-size: 11px; margin-bottom: 14px; }
.mock-graph { width: 100%; height: 65px; background: linear-gradient(160deg,#0b82a6,#68d1ce); border-radius: 5px; margin-bottom: 15px; position: relative; overflow: hidden; }
.mock-graph:after { content: ''; position: absolute; border: 2px solid rgba(255,255,255,.75); width: 190px; height: 70px; border-radius: 50%; top: 29px; left: 15px; transform: rotate(-11deg); }
.mock-content em { display: block; width: 92%; height: 7px; background: #d3e4e2; margin: 8px 0; border-radius: 5px; }
.mock-content em:last-child { width: 62%; }
.laptop-base { width: 390px; height: 13px; background: linear-gradient(#c7e3e2,#659fa6); border-radius: 2px 2px 40px 40px; margin-left: -16px; box-shadow: 0 8px 5px rgba(17,97,105,.16); }
.phone { position: absolute; right: 13px; top: 91px; width: 91px; height: 189px; border: 8px solid #06364b; border-radius: 17px; background: #06364b; box-shadow: 0 12px 18px rgba(0,61,76,.21); }
.phone:after { content: ''; position: absolute; width: 25px; height: 4px; background: #06364b; border-radius: 0 0 5px 5px; top: -1px; left: 25px; }
.phone-screen { height: 100%; border-radius: 8px; background: #f9ffff; padding: 23px 8px 8px; }
.phone-screen b,.phone-screen i,.phone-screen span { display: block; border-radius: 3px; }
.phone-screen b { background: #7bc9cd; height: 7px; margin-bottom: 14px; }
.phone-screen i { background: #c4e6e3; height: 24px; margin: 6px 0; }
.phone-screen i:nth-of-type(2) { background: #0f90aa; }
.phone-screen span { background: #d4e7e5; height: 5px; margin-top: 7px; }
.plant { position: absolute; left: 28px; bottom: 29px; width: 69px; height: 126px; z-index: 2; }
.plant span { position: absolute; bottom: 0; left: 19px; width: 42px; height: 48px; background: linear-gradient(90deg,#07566b,#073649); clip-path: polygon(0 0,100% 0,86% 100%,17% 100%); }
.plant i { position: absolute; width: 22px; height: 68px; background: #118f91; border-radius: 100% 0; left: 26px; bottom: 43px; transform: rotate(-27deg); }
.plant i:nth-child(2) { left: 44px; bottom: 47px; transform: rotate(35deg); background: #38b5aa; }
.plant i:nth-child(3) { left: 10px; bottom: 40px; transform: rotate(-65deg); background: #147c83; }
.features { display: grid; grid-template-columns: repeat(4,1fr); gap: 23px; padding: 34px 28px 42px; }
.feature-card { min-height: 210px; border-radius: 15px; border: 1px solid #e2edeb; background: #fffdf9; box-shadow: 0 8px 16px rgba(33,92,100,.08); padding: 27px 22px; transition: transform .25s; }
.feature-card:hover { transform: translateY(-5px); }
.feature-icon { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 15px; background: #c5eded; color: #057ca6; }
.feature-icon svg { width: 28px; height: 28px; }
.feature-card h2 { margin: 18px 0 9px; font-size: 17px; }
.feature-card p { margin: 0; color: #446978; line-height: 1.55; font-size: 14px; }
.site-footer { padding: 30px 40px; background: #07384d; color: white; display: flex; align-items: center; gap: 24px; }
.site-footer span { font-size: 20px; font-weight: 700; }
.site-footer p { color: #acd3d5; margin-right: auto; }
.site-footer a { color: #78e2d9; font-weight: 700; }
@media (max-width: 900px) { .site-nav { padding: 0 25px; gap: 20px; } .nav-links { gap: 17px; } .hero-copy { max-width: 55%; padding-left: 28px; } h1 { font-size: 43px; } .device-scene { transform: scale(.72); transform-origin: right bottom; right: 0; } .features { gap: 12px; padding: 20px; } .feature-card { padding: 18px 14px; } }
@media (max-width: 650px) { .site-nav { height: 70px; padding: 0 20px; } .brand { font-size: 23px; } .menu-toggle { display: block; border: 0; background: transparent; color: #07516c; font-weight: 700; } .nav-cta { display: none; } .nav-links { display: none; position: absolute; left: 0; right: 0; top: 70px; padding: 20px; background: white; flex-direction: column; box-shadow: 0 10px 16px #0b425018; } .nav-links.open { display: flex; } .hero { min-height: 740px; align-items: flex-start; } .hero-copy { max-width: none; padding: 49px 25px; } h1 { font-size: 46px; } .hero-copy p { font-size: 16px; } .hero-kicker { font-size: 10px; } .device-scene { right: 50%; bottom: 10px; transform: translateX(50%) scale(.72); transform-origin: center bottom; } .features { grid-template-columns: repeat(2,1fr); gap: 13px; } .feature-card { min-height: 186px; } .site-footer { flex-wrap: wrap; } .site-footer p { width: 100%; order: 2; } }
`,
    },
  ],
};