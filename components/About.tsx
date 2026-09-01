export default function About() {
  return (
    <section id="about" className="py-24 px-4 bg-[#1a1a1a]">
      <div className="container-max max-w-3xl">
        <h2 className="text-5xl font-bold mb-12">About Us</h2>

        <div className="space-y-8 text-lg text-[#e0e0e0] leading-relaxed">
          <p>
            Rich Colvill Studio is a creative powerhouse specializing in
            high-end branding, design, and creative production. With over 25
            years of industry experience, we've worked with some of the world's
            most respected brands across drinks, beauty, fashion, consumer
            goods, professional services, and automotive sectors.
          </p>

          <p>
            We believe in personalized collaboration. Whether it's over email,
            WhatsApp, Zoom, or—better yet—over a beer, we take time to
            understand your vision and craft solutions that move the needle.
          </p>

          <p>
            Our approach is strategic yet creative. We combine data-driven
            insights with artistic vision to produce work that not only looks
            stunning but performs exceptionally. From brand identity to digital
            experiences, from creative direction to video production, we handle
            it all with meticulous attention to detail.
          </p>

          <div className="bg-[#0a0a0a] p-8 border border-[#333333] mt-12">
            <h3 className="font-bold text-lg mb-6">By Appointment Only</h3>
            <p className="mb-4">Available Monday & Thursday, 11am–4pm</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="mailto:hello@richcolvill.com" className="btn btn-primary">
                Email Us
              </a>
              <a href="tel:+441234567890" className="btn btn-secondary">
                Call
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
