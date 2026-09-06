/* His sign-off, verbatim. The live site still says COPYRIGHT 23; we keep
   his line but stop the year being wrong. */
export default function SiteFooter() {
  const year = new Date().getFullYear().toString().slice(-2);

  return (
    <footer className="site-footer sheet">
      <p className="t-display footer-shout" data-split>THAT&#39;S ALL F**KS</p>
      <div className="footer-rule" aria-hidden="true" />
      <div className="footer-meta">
        <span className="t-mono">
          <span className="rc-mark" aria-hidden="true" />RICH COLVILL &#169;COPYRIGHT {year}, ALL RIGHTS RESERVED
        </span>
        <span className="t-mono">
          <a href="https://www.instagram.com/" rel="noopener noreferrer" target="_blank">
            STALK US
          </a>
        </span>
      </div>
    </footer>
  );
}
