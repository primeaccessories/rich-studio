export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#333333] py-12">
      <div className="container-max">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-4">Rich Colvill Studio</h3>
            <p className="text-[#e0e0e0] text-sm">
              High-end branding, design, and creative production.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-sm">
              <a href="mailto:hello@richcolvill.com" className="link-hover">
                hello@richcolvill.com
              </a>
              <p className="text-[#e0e0e0]">
                Monday & Thursday<br />
                11am - 4pm
              </p>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-4">Social</h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link-hover text-sm"
              >
                Instagram
              </a>
              <a
                href="https://behance.net"
                target="_blank"
                rel="noopener noreferrer"
                className="link-hover text-sm"
              >
                Behance
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link-hover text-sm"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[#333333] pt-8">
          <p className="text-[#e0e0e0] text-sm text-center">
            © 2026 Rich Colvill Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
