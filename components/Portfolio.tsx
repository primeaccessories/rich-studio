'use client';

import { useState } from 'react';

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState('all');

  const projects = [
    {
      id: 1,
      title: 'Silverstone',
      category: 'branding',
      industry: 'automotive',
      year: '2024',
    },
    {
      id: 2,
      title: 'Odeon Cinemas',
      category: 'design',
      industry: 'entertainment',
      year: '2023',
    },
    {
      id: 3,
      title: "Wall's",
      category: 'branding',
      industry: 'food',
      year: '2023',
    },
    {
      id: 4,
      title: 'Astute',
      category: 'design',
      industry: 'professional-services',
      year: '2022',
    },
    {
      id: 5,
      title: 'By Bryony',
      category: 'branding',
      industry: 'beauty',
      year: '2022',
    },
    {
      id: 6,
      title: 'Wingmen',
      category: 'design',
      industry: 'fashion',
      year: '2024',
    },
  ];

  const categories = [
    { label: 'All', value: 'all' },
    { label: 'Branding', value: 'branding' },
    { label: 'Design', value: 'design' },
  ];

  const filtered =
    activeFilter === 'all'
      ? projects
      : projects.filter((p) => p.category === activeFilter);

  return (
    <section id="work" className="py-24 px-4">
      <div className="container-max">
        <h2 className="text-5xl font-bold mb-12">Recent Work</h2>

        {/* Filters */}
        <div className="flex gap-4 mb-16 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveFilter(cat.value)}
              className={`px-6 py-2 text-sm font-medium transition-all ${
                activeFilter === cat.value
                  ? 'bg-[#ef4444] text-white'
                  : 'bg-[#1a1a1a] text-[#e0e0e0] hover:border-[#ef4444] border border-[#333333]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((project, index) => (
            <div
              key={project.id}
              className="group cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Placeholder */}
              <div className="bg-[#1a1a1a] border border-[#333333] aspect-square mb-4 group-hover:border-[#ef4444] transition-colors flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[#e0e0e0] text-sm mb-2">
                    {project.title}
                  </p>
                  <p className="text-xs text-[#999999]">{project.year}</p>
                </div>
              </div>

              {/* Info */}
              <h3 className="text-lg font-bold mb-2">{project.title}</h3>
              <p className="text-sm text-[#e0e0e0] mb-3 capitalize">
                {project.category} / {project.industry.replace('-', ' ')}
              </p>
              <a
                href="#"
                className="link-hover text-sm font-medium"
                onClick={(e) => e.preventDefault()}
              >
                View Project →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
