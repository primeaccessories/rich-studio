export default function Services() {
  const services = [
    {
      title: 'Branding',
      description:
        'Strategic brand identity, naming, and visual systems that define your studio.',
    },
    {
      title: 'Design',
      description:
        'Creative direction, art direction, and design solutions for print and digital.',
    },
    {
      title: 'Creative Production',
      description:
        'Photo direction, video production, and creative asset creation.',
    },
  ];

  return (
    <section id="services" className="py-24 px-4 bg-[#1a1a1a]">
      <div className="container-max">
        <h2 className="text-5xl font-bold mb-16">What We Do</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {services.map((service, index) => (
            <div
              key={index}
              className="p-8 bg-[#0a0a0a] border border-[#333333] hover:border-[#ef4444] transition-colors"
            >
              <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
              <p className="text-[#e0e0e0] leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
