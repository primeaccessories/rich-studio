'use client';

import { useEffect, useState } from 'react';

export default function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="pt-32 pb-24 px-4">
      <div className="container-max">
        <div className="max-w-4xl">
          {/* Animated text */}
          <h1
            className={`text-6xl md:text-7xl font-bold leading-tight mb-6 transition-all duration-700 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Let's make something
            <span className="text-[#ef4444]"> different</span>
          </h1>

          <p
            className={`text-lg md:text-xl text-[#e0e0e0] leading-relaxed mb-12 transition-all duration-700 delay-100 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            We're a creative studio specializing in high-end branding, design, and
            creative production. From concept to execution, we craft experiences
            that move the needle.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-200 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <a href="#work" className="btn btn-primary">
              View Our Work
            </a>
            <a href="mailto:hello@richcolvill.com" className="btn btn-secondary">
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
