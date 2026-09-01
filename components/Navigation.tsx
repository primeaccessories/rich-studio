'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-[#333333]">
      <div className="container-max flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="font-bold text-2xl">
          Rich Colvill
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
          <Link href="/#work" className="link-hover text-sm font-medium">
            Work
          </Link>
          <Link href="/#about" className="link-hover text-sm font-medium">
            About
          </Link>
          <Link href="/#services" className="link-hover text-sm font-medium">
            Services
          </Link>
          <a
            href="mailto:hello@richcolvill.com"
            className="btn btn-primary text-sm"
          >
            Get in Touch
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <span
            className="w-6 h-0.5 bg-white transition-all"
            style={{
              transform: isOpen ? 'rotate(45deg) translateY(12px)' : 'none',
            }}
          />
          <span
            className="w-6 h-0.5 bg-white transition-all"
            style={{ opacity: isOpen ? 0 : 1 }}
          />
          <span
            className="w-6 h-0.5 bg-white transition-all"
            style={{
              transform: isOpen ? 'rotate(-45deg) translateY(-12px)' : 'none',
            }}
          />
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-[#333333]">
          <div className="container-max py-6 flex flex-col gap-4">
            <Link
              href="/#work"
              className="link-hover text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              Work
            </Link>
            <Link
              href="/#about"
              className="link-hover text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <Link
              href="/#services"
              className="link-hover text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              Services
            </Link>
            <a
              href="mailto:hello@richcolvill.com"
              className="btn btn-primary text-sm"
            >
              Get in Touch
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
