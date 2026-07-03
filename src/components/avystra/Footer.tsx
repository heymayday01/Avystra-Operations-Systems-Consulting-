"use client";

import { Linkedin, Instagram, MessageCircle, Facebook, Mail, Phone, ArrowUpRight } from "lucide-react";
import AvystraLogo from "./AvystraLogo";
import { smoothScrollTo } from "@/lib/scroll";
import { useGsapReveal } from "@/lib/useGsapReveal";

interface FooterProps {
  leadCount: number;
}

/**
 * Footer — refined for glitch-free rendering.
 *
 * GLITCHES FIXED (vs. previous version):
 * 1. Brand text clipping: the massive "AVYSTRA" wordmark used a negative
 *    `marginBottom` (clamp(-0.4rem, -1.5vw, -1.5rem)) combined with
 *    `overflow-hidden` on the footer, which clipped the letter baselines —
 *    severely on mobile (only the tops of letters were visible). Now the
 *    wordmark sits in its own non-clipped band with positive padding so the
 *    full baseline always renders inside the footer.
 * 2. Heading reveal breaking on inline gold span: the `words` mode splitter
 *    wrapped "Let's re-engineer your" in overflow-hidden word spans but
 *    could not split inside the `<span class="text-gold">` child, producing
 *    an uneven reveal (3 words, then a jump to the gold phrase). Switched
 *    to a single `fade` so the whole heading lifts in as one unit — the
 *    gold span is preserved naturally.
 * 3. Janky staggered reveals: 6 separate reveals with delays up to 0.45s
 *    felt disjointed when the footer scrolled quickly into view.
 *    Consolidated to 3 cohesive groups (main / meta / brand) with tight,
 *    overlapping delays (0 / 0.12 / 0.24s) so the footer reveals as one
 *    composition in ~0.6s total.
 * 4. Repaint jank: two large blurred orbs (`blur-[140px]` / `blur-[120px]`)
 *    caused repaint stutter during scroll, especially on mobile. Replaced
 *    with a single static radial gradient on the footer background (no
 *    animated blur, no per-frame cost) — same premium ambiance, zero jank.
 */
export default function Footer({ leadCount }: FooterProps) {
  // Three cohesive reveal groups — tight, overlapping delays so the footer
  // feels like a single composition rather than a chain of disconnected fades.
  const mainRef = useGsapReveal<HTMLDivElement>("fade", { delay: 0, duration: 0.6 });
  const metaRef = useGsapReveal<HTMLDivElement>("fade", { delay: 0.12, duration: 0.5 });
  const brandRef = useGsapReveal<HTMLDivElement>("fade", { delay: 0.24, duration: 0.65, y: 20 });

  const scrollTo = (href: string) => {
    const elementId = href.substring(1);
    smoothScrollTo(elementId);
  };

  const socialLinks = [
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: "https://linkedin.com/in/kirankumar-pandey-841859218",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: "https://wa.me/918596059607",
    },
    {
      name: "Instagram",
      icon: Instagram,
      href: "https://instagram.com/kp_biobali",
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: "https://facebook.com/share/1FpxeyvRHF/",
    },
  ];

  const links = [
    { label: "Frameworks", href: "#bottlenecks" },
    { label: "Process", href: "#process" },
    { label: "Team", href: "#about" },
    { label: "Clients", href: "#testimonials" },
    { label: "FAQ", href: "#faq" },
    { label: "OGI Score", href: "#consult" },
  ];

  return (
    <footer
      className="relative bg-navy-deep text-slate-100 mt-auto overflow-hidden"
      style={{
        // Static radial gradient ambiance — replaces the two animated
        // blur orbs. Same premium glow, zero per-frame repaint cost.
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 25% 30%, rgba(184,146,78,0.06), transparent 70%), radial-gradient(ellipse 50% 40% at 80% 70%, rgba(184,146,78,0.03), transparent 70%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 w-full pt-12 sm:pt-16">
        {/* Main Footer Content — compact 3-column grid */}
        <div
          ref={mainRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-8 lg:gap-12 mb-10"
        >
          {/* Brand & Description */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-6">
            {/* Logo in footer */}
            <div className="mb-5">
              <AvystraLogo size="lg" showTagline={true} theme="dark" />
            </div>

            {/* Heading: single fade reveal — preserves the inline gold span
                naturally (words mode would unevenly split around it). */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium text-white mb-3 tracking-tight leading-[1.25]">
              Let&apos;s re-engineer your{" "}
              <span className="text-gold">business performance.</span>
            </h2>
            <p className="text-slate-400 max-w-md leading-relaxed text-sm mb-5">
              AVYSTRA helps founders and leaders build the clarity,
              accountability, and systems necessary for scalable, decisive
              growth.
            </p>

            {/* Contact quick row */}
            <div className="flex flex-wrap gap-2.5">
              <a
                href="mailto:info@avystra.co.in"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-slate-200 hover:bg-gold/10 hover:border-gold/30 hover:text-gold transition-all duration-300 text-[13px] font-medium focus-ring"
              >
                <Mail className="w-3.5 h-3.5 text-gold" />
                <span>info@avystra.co.in</span>
              </a>
              <a
                href="tel:+918596059607"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-slate-200 hover:bg-gold/10 hover:border-gold/30 hover:text-gold transition-all duration-300 text-[13px] font-medium focus-ring"
              >
                <Phone className="w-3.5 h-3.5 text-gold" />
                <span>+91 85960 59607</span>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="col-span-1 lg:col-span-3">
            <h3 className="text-[12.5px] font-mono text-gold uppercase tracking-[0.2em] mb-4 font-bold">
              Navigation
            </h3>
            <ul className="space-y-2.5">
              {links.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(item.href);
                    }}
                    className="text-slate-300 hover:text-gold transition-colors cursor-pointer inline-flex items-center gap-2 group text-[14px] focus-ring"
                  >
                    <span className="w-0 group-hover:w-3 h-px bg-gold transition-all duration-300" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect & Socials */}
          <div className="col-span-1 lg:col-span-3">
            <h3 className="text-[12.5px] font-mono text-gold uppercase tracking-[0.2em] mb-4 font-bold">
              Connect
            </h3>
            <p className="text-slate-400 text-[13px] leading-relaxed mb-4 max-w-xs">
              Follow our work for insights on leadership, execution, and
              organizational performance.
            </p>
            <div className="grid grid-cols-4 gap-2 max-w-[200px]">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-premium aspect-square flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-gold hover:text-navy-deep hover:border-gold focus-ring"
                  aria-label={link.name}
                >
                  <link.icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Meta — compact single row */}
        <div
          ref={metaRef}
          className="py-5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-mono text-slate-500"
        >
          <p className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} AVYSTRA Consulting Pvt. Ltd. All
            rights reserved.
          </p>
          <div className="flex gap-6 items-center">
            <a
              href="#consult"
              onClick={(e) => {
                e.preventDefault();
                scrollTo("#consult");
              }}
              className="cursor-pointer text-gold hover:text-gold-light transition-colors inline-flex items-center gap-1 focus-ring"
            >
              Begin Assessment
              <ArrowUpRight className="w-3 h-3" />
            </a>
            {leadCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold/20 bg-gold/5 text-[11.5px] text-gold">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                {leadCount} Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Massive Brand Name — fully contained inside the footer.
          The footer is `overflow-hidden` so the wide text never causes
          horizontal scroll AND nothing bleeds below the navy background.
          The band uses leading-[0.75] (tight) so the line box is shorter
          than the glyph cap-height region, then pads the band itself with
          generous pt/pb so the visible glyphs sit comfortably inside the
          footer's overflow boundary. This replaces the old negative
          marginBottom trick which clipped baselines (severely on mobile). */}
      <div
        ref={brandRef}
        className="w-full flex justify-center items-end select-none pointer-events-none relative pt-4 pb-5 sm:pt-6 sm:pb-8"
      >
        <span
          className="font-display font-black tracking-tighter text-navy-soft uppercase text-center whitespace-nowrap z-0 block"
          style={{
            fontSize: "clamp(3.5rem, 18vw, 16rem)",
            lineHeight: 0.75,
          }}
          aria-hidden="true"
        >
          AVYSTRA
        </span>
      </div>
    </footer>
  );
}
