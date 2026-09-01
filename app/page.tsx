'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('all');

  const projects = [
    { id: 1, title: 'Silverstone', discipline: 'Branding', industry: 'Automotive', year: 2024, featured: true },
    { id: 2, title: 'Odeon Cinemas', discipline: 'Design', industry: 'Entertainment', year: 2023, featured: true },
    { id: 3, title: "Wall's", discipline: 'Branding', industry: 'Food & Beverage', year: 2023, featured: true },
    { id: 4, title: 'Astute', discipline: 'Design', industry: 'Professional Services', year: 2022, featured: true },
    { id: 5, title: 'By Bryony', discipline: 'Branding', industry: 'Beauty', year: 2022, featured: true },
    { id: 6, title: 'Wingmen', discipline: 'Design', industry: 'Fashion', year: 2024, featured: false },
  ];

  const disciplines = ['all', 'Branding', 'Design'];
  const filtered = activeFilter === 'all' ? projects : projects.filter(p => p.discipline === activeFilter);

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="container-max py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">RICH COLVILL STUDIO</Link>
          <div className="flex gap-8 items-center">
            <Link href="#work" className="text-sm hover:underline">Work</Link>
            <Link href="#about" className="text-sm hover:underline">About</Link>
            <a href="mailto:hello@richcolvill.com" className="text-sm hover:underline">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section - Featured Projects */}
      <section className="py-16 px-4 bg-white">
        <div className="container-max">
          <h1 className="text-5xl md:text-7xl font-black mb-16 leading-tight">
            REBRANDING THE WORLD'S MOST ICONIC BRANDS
          </h1>
          
          {/* Featured Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {projects.filter(p => p.featured).slice(0, 4).map((project) => (
              <div key={project.id} className="group cursor-pointer">
                <div className="bg-gray-100 border border-gray-300 aspect-square mb-4 flex items-center justify-center overflow-hidden hover:border-black transition-all">
                  <div className="w-full h-full flex items-center justify-center text-center">
                    <p className="text-gray-500">[{project.title} GIF]</p>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">{project.title}</h3>
                <p className="text-sm text-gray-600">{project.discipline} / {project.industry} / {project.year}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Work Section */}
      <section id="work" className="py-20 px-4 bg-white">
        <div className="container-max">
          <h2 className="text-5xl font-black mb-12">SELECTED WORK</h2>
          
          {/* Filters */}
          <div className="flex gap-4 mb-16 flex-wrap">
            {disciplines.map((d) => (
              <button
                key={d}
                onClick={() => setActiveFilter(d)}
                className={`px-6 py-2 text-sm font-bold transition-all ${
                  activeFilter === d
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-black hover:bg-gray-200 border border-gray-300'
                }`}
              >
                {d === 'all' ? 'ALL' : d.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Portfolio Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((project) => (
              <div key={project.id} className="group">
                <div className="bg-gray-100 border border-gray-300 aspect-square mb-4 flex items-center justify-center overflow-hidden group-hover:border-black transition-all">
                  <p className="text-gray-500 text-center">[{project.title} Image]</p>
                </div>
                <h3 className="text-lg font-bold mb-1">{project.title}</h3>
                <p className="text-xs text-gray-600">{project.discipline} / {project.industry}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-gray-50">
        <div className="container-max max-w-2xl">
          <h2 className="text-5xl font-black mb-12">ABOUT</h2>
          <div className="space-y-6 text-lg leading-relaxed">
            <p>Rich Colvill Studio is a creative powerhouse with 25+ years of industry experience specializing in high-end branding, design, and creative production.</p>
            <p>We've worked with the world's most respected brands across drinks, beauty, fashion, consumer goods, professional services, and automotive sectors.</p>
            <p>We believe in personalized collaboration. Whether email, WhatsApp, Zoom, or over a beer—we take time to understand your vision and deliver work that moves the needle.</p>
            <p className="font-bold">By appointment only: Monday & Thursday, 11am–4pm</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container-max text-center">
          <h2 className="text-5xl font-black mb-8">LET'S GET TOGETHER</h2>
          <p className="text-xl mb-8">Over email, WhatsApp, Zoom, phone or better yet over a beer</p>
          <div className="space-y-4">
            <a href="mailto:hello@richcolvill.com" className="block text-lg font-bold hover:underline">hello@richcolvill.com</a>
            <div className="flex gap-8 justify-center">
              <a href="https://instagram.com" target="_blank" className="hover:underline">Instagram</a>
              <a href="https://behance.net" target="_blank" className="hover:underline">Behance</a>
              <a href="https://linkedin.com" target="_blank" className="hover:underline">LinkedIn</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-300 py-12">
        <div className="container-max text-center text-sm text-gray-600">
          <p>© 2026 Rich Colvill Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
