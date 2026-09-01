'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section - Photography Driven */}
      <section className="pt-24 pb-32 px-4">
        <div className="container-max">
          {/* Large Bold Text */}
          <div className={`mb-16 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="text-7xl md:text-8xl font-black leading-none mb-8">
              RICH
              <br />
              COLVILL
            </h1>
            <p className="text-xl md:text-2xl text-[#e0e0e0] max-w-2xl font-light">
              High-end branding, design, and creative production studio based in Charlotte, NC.
            </p>
          </div>

          {/* Featured Project Showcase */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Large featured image */}
            <div className="md:col-span-2 bg-[#1a1a1a] border border-[#333333] aspect-video flex items-center justify-center overflow-hidden group">
              <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center text-center">
                <div>
                  <p className="text-[#e0e0e0] mb-2">Featured Work</p>
                  <p className="text-sm text-[#999999]">Silverstone Rebrand</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className={`flex gap-4 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <a href="#work" className="btn btn-primary text-lg px-8">
              View Work
            </a>
            <a href="mailto:hello@richcolvill.com" className="btn btn-secondary text-lg px-8">
              Inquire
            </a>
          </div>
        </div>
      </section>

      {/* Work Section - Grid of Projects */}
      <section id="work" className="py-32 px-4 bg-[#0a0a0a]">
        <div className="container-max">
          <h2 className="text-6xl font-black mb-20">SELECTED WORK</h2>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Project 1 */}
            <div className="group">
              <div className="bg-[#1a1a1a] border border-[#333333] aspect-square mb-6 flex items-center justify-center group-hover:border-[#ef4444] transition-all overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] flex items-center justify-center">
                  <p className="text-[#e0e0e0]">Silverstone</p>
                </div>
              </div>
              <h3 className="text-3xl font-black mb-2">Silverstone</h3>
              <p className="text-[#e0e0e0] mb-4">Brand Identity Redesign</p>
              <p className="text-sm text-[#999999] mb-6">Automotive | 2024</p>
              <a href="#" className="link-hover font-bold">View Project →</a>
            </div>

            {/* Project 2 */}
            <div className="group">
              <div className="bg-[#1a1a1a] border border-[#333333] aspect-square mb-6 flex items-center justify-center group-hover:border-[#ef4444] transition-all overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] flex items-center justify-center">
                  <p className="text-[#e0e0e0]">Odeon Cinemas</p>
                </div>
              </div>
              <h3 className="text-3xl font-black mb-2">Odeon Cinemas</h3>
              <p className="text-[#e0e0e0] mb-4">Campaign Design</p>
              <p className="text-sm text-[#999999] mb-6">Entertainment | 2023</p>
              <a href="#" className="link-hover font-bold">View Project →</a>
            </div>

            {/* Project 3 */}
            <div className="group">
              <div className="bg-[#1a1a1a] border border-[#333333] aspect-square mb-6 flex items-center justify-center group-hover:border-[#ef4444] transition-all overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] flex items-center justify-center">
                  <p className="text-[#e0e0e0]">Wall's</p>
                </div>
              </div>
              <h3 className="text-3xl font-black mb-2">Wall's</h3>
              <p className="text-[#e0e0e0] mb-4">Brand Refresh</p>
              <p className="text-sm text-[#999999] mb-6">Food & Beverage | 2023</p>
              <a href="#" className="link-hover font-bold">View Project →</a>
            </div>

            {/* Project 4 */}
            <div className="group">
              <div className="bg-[#1a1a1a] border border-[#333333] aspect-square mb-6 flex items-center justify-center group-hover:border-[#ef4444] transition-all overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] flex items-center justify-center">
                  <p className="text-[#e0e0e0]">By Bryony</p>
                </div>
              </div>
              <h3 className="text-3xl font-black mb-2">By Bryony</h3>
              <p className="text-[#e0e0e0] mb-4">Brand Identity</p>
              <p className="text-sm text-[#999999] mb-6">Beauty | 2022</p>
              <a href="#" className="link-hover font-bold">View Project →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 px-4 bg-[#1a1a1a]">
        <div className="container-max">
          <h2 className="text-6xl font-black mb-20">WHAT WE DO</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-2xl font-black mb-4">Branding</h3>
              <p className="text-[#e0e0e0] leading-relaxed">Strategic brand identity systems, naming, visual language, and guidelines that define studios and agencies.</p>
            </div>
            <div>
              <h3 className="text-2xl font-black mb-4">Design</h3>
              <p className="text-[#e0e0e0] leading-relaxed">Creative direction, art direction, design solutions for print and digital across all mediums.</p>
            </div>
            <div>
              <h3 className="text-2xl font-black mb-4">Production</h3>
              <p className="text-[#e0e0e0] leading-relaxed">Photo direction, video production, creative asset creation, and full production management.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 px-4 bg-[#0a0a0a]">
        <div className="container-max max-w-3xl">
          <h2 className="text-6xl font-black mb-12">ABOUT</h2>
          <div className="space-y-6 text-lg text-[#e0e0e0] leading-relaxed">
            <p>Rich Colvill Studio is a creative powerhouse with 25+ years of industry experience. We've worked with the world's most respected brands across drinks, beauty, fashion, automotive, and professional services.</p>
            <p>We believe in personalized collaboration. Whether email, WhatsApp, Zoom, or over a beer—we take time to understand your vision and deliver work that moves the needle.</p>
            <p className="font-bold text-white">By appointment only: Monday & Thursday, 11am–4pm</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-32 px-4 bg-[#1a1a1a]">
        <div className="container-max text-center">
          <h2 className="text-6xl font-black mb-12">LET'S TALK</h2>
          <div className="space-y-6">
            <a href="mailto:hello@richcolvill.com" className="text-2xl font-bold text-[#ef4444] hover:underline">
              hello@richcolvill.com
            </a>
            <p className="text-[#e0e0e0]">or reach out on WhatsApp / Zoom</p>
            <div className="flex gap-4 justify-center pt-6">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="link-hover">Instagram</a>
              <a href="https://behance.net" target="_blank" rel="noopener noreferrer" className="link-hover">Behance</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="link-hover">LinkedIn</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
