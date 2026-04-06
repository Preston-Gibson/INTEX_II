export default function DonorDashboard() {
  return (
    <div className="text-on-surface">
      <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
        {/* Hero Header */}
        <header className="mb-16">
          <h1 className="text-5xl font-extrabold text-blue-900 mb-4 tracking-tight">
            Radiant Impact. Total Transparency.
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl leading-relaxed">
            Through your support, we provide sanctuary and hope to children
            across Central America. Here is the real-world difference we've made
            together in 2024.
          </p>
        </header>

        {/* High-Level Stats Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="p-8 bg-surface-container-lowest rounded-xl border border-outline-variant/10 flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined text-secondary text-3xl mb-4">
                home_pin
              </span>
              <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                Residents Served
              </h3>
              <p className="text-5xl font-extrabold text-blue-900">482</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-secondary font-medium">
              <span className="material-symbols-outlined text-sm">
                trending_up
              </span>
              <span>12% increase from 2023</span>
            </div>
          </div>

          <div className="p-8 bg-surface-container-lowest rounded-xl border border-outline-variant/10 flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined text-secondary text-3xl mb-4">
                volunteer_activism
              </span>
              <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                Successful Reintegrations
              </h3>
              <p className="text-5xl font-extrabold text-blue-900">156</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-secondary font-medium">
              <span className="material-symbols-outlined text-sm">
                check_circle
              </span>
              <span>Stable home environments secured</span>
            </div>
          </div>

          <div className="p-8 aurora-gradient rounded-xl flex flex-col justify-between text-white">
            <div>
              <span className="material-symbols-outlined text-white/80 text-3xl mb-4">
                history_edu
              </span>
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-2">
                Education Hours Provided
              </h3>
              <p className="text-5xl font-extrabold">24,500+</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-white/90 font-medium">
              <span className="material-symbols-outlined text-sm">school</span>
              <span>Accredited curriculum programs</span>
            </div>
          </div>
        </section>

        {/* Visualization Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 items-start">
          <div className="space-y-8">
            <div className="p-8 bg-surface-container-low rounded-xl">
              <h3 className="text-2xl font-bold text-blue-900 mb-6">
                Geographic Reach
              </h3>
              <div className="aspect-video relative bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  alt="Map of Central America"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuATgFL3w7J3C0SUWdNIVy1NzI6LG7pX7han4WmS9wPSl2sx8nNS9mdJx5pSoa64hAN8PRArxRFOGS96_ORKj8PT29uRDpagh1pKCRQK_L9TAeVCjmphJpedW13eR3xhq0UnQyUklVOYbJb3h8Otcb0zgbUm_UzBfyON7ha8NG0aZLd3W3BZNJoae1uxHusRIjRlarD9d7zDWwQkjR0BCdwTXkUnihzGZO_1WdsJzMBhS_ITeXEp-LESNWV_DrGldU8Zy3cCLeai9A"
                />
                <div className="relative z-10 flex flex-col items-center">
                  <span
                    className="material-symbols-outlined text-primary text-4xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    location_on
                  </span>
                  <span className="bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    Santa Rosa de Copán
                  </span>
                </div>
              </div>
              <div className="mt-6 flex justify-between items-center text-sm font-medium text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  Honduras (65%)
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-secondary"></span>
                  Guatemala (20%)
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tertiary-fixed-dim"></span>
                  Others (15%)
                </div>
              </div>
            </div>

            <div className="p-8 bg-surface-container-low rounded-xl">
              <h3 className="text-2xl font-bold text-blue-900 mb-6">
                Year-Over-Year Impact
              </h3>
              <div className="space-y-4">
                <div className="flex items-end gap-2 h-48">
                  <div
                    className="flex-1 bg-surface-container-highest rounded-t-lg transition-all hover:bg-primary-fixed"
                    style={{ height: '40%' }}
                  ></div>
                  <div
                    className="flex-1 bg-surface-container-highest rounded-t-lg transition-all hover:bg-primary-fixed"
                    style={{ height: '55%' }}
                  ></div>
                  <div
                    className="flex-1 bg-surface-container-highest rounded-t-lg transition-all hover:bg-primary-fixed"
                    style={{ height: '70%' }}
                  ></div>
                  <div
                    className="flex-1 bg-primary rounded-t-lg transition-all"
                    style={{ height: '95%' }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase px-2">
                  <span>2021</span>
                  <span>2022</span>
                  <span>2023</span>
                  <span>2024 (Projected)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transparency Breakdown */}
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10">
            <h3 className="text-2xl font-bold text-blue-900 mb-2">
              Where Your Money Goes
            </h3>
            <p className="text-on-surface-variant mb-8 leading-relaxed">
              For every $1 donated, 92 cents goes directly to program costs and
              essential care for our residents.
            </p>
            <div className="space-y-10">
              <div>
                <div className="flex justify-between mb-3 text-sm font-bold">
                  <span>Direct Care &amp; Nutrition</span>
                  <span>55%</span>
                </div>
                <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[55%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-3 text-sm font-bold">
                  <span>Education &amp; Vocational Training</span>
                  <span>22%</span>
                </div>
                <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full w-[22%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-3 text-sm font-bold">
                  <span>Medical &amp; Mental Health Support</span>
                  <span>15%</span>
                </div>
                <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                  <div className="bg-tertiary-fixed-dim h-full w-[15%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-3 text-sm font-bold">
                  <span>Operations &amp; Administration</span>
                  <span>8%</span>
                </div>
                <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                  <div className="bg-outline-variant h-full w-[8%]"></div>
                </div>
              </div>
            </div>
            <div className="mt-12 p-6 bg-slate-50 rounded-xl flex items-center gap-4">
              <span className="material-symbols-outlined text-tertiary-container text-4xl">
                verified_user
              </span>
              <div>
                <p className="font-bold text-blue-900 text-sm">
                  Platinum Transparency Rating
                </p>
                <p className="text-xs text-on-surface-variant">
                  Independently audited by GuideStar 2024
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="mb-20">
          <div className="flex justify-between items-end mb-12">
            <div className="max-w-xl">
              <h2 className="text-4xl font-extrabold text-blue-900 mb-4 tracking-tight">
                The Lives Behind the Data
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                Names and locations have been changed to protect the privacy and
                safety of our residents.
              </p>
            </div>
            <button className="text-primary font-bold flex items-center gap-2 hover:underline">
              View More Stories
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Story Card 1 */}
            <div className="group relative bg-white p-8 rounded-xl overflow-hidden border border-outline-variant/10 hover:shadow-xl transition-shadow">
              <div className="flex gap-6 items-start">
                <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-4 border-primary-fixed">
                  <img
                    alt="Anonymized success story avatar"
                    className="w-full h-full object-cover grayscale"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfjKjAN4tA4fl-SHjbfAQJAE3IiAvVSQyhEKumwszQL2DvfG7QLUkS8Uv0afLVXDPJJN2HHPZ_ZFDlCKLzUaP4SyUpE-Z3H3wMaMsTyTm3O42tVlLCxh_4qqofrPzoC2RMRuJ-w6dakUnaF9-doISnCSDbRfYNY-SO8No-NuySWXvbRXVbCiFhnrx8E8m7e-ilZKD0C9h3CWsHFHn-QsaKsLXJZlAQGgWm0ND-YXle6I12kVdjNt-amee6CzZSmXWj_yKTCqMemA"
                  />
                </div>
                <div>
                  <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase rounded-full mb-3 tracking-widest">
                    Case Highlight: Reintegration
                  </span>
                  <h4 className="text-xl font-bold text-blue-900 mb-3">
                    Elena's Journey to Independence
                  </h4>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-6 italic">
                    "After three years in our transition program, Elena graduated
                    from her nursing vocational course and has been safely
                    reunited with her extended family."
                  </p>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-xs font-bold text-primary uppercase">
                        Program
                      </p>
                      <p className="text-xs">Vocational Path</p>
                    </div>
                    <div className="w-px h-8 bg-outline-variant/30"></div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-primary uppercase">
                        Duration
                      </p>
                      <p className="text-xs">3.5 Years</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Story Card 2 */}
            <div className="group relative bg-white p-8 rounded-xl overflow-hidden border border-outline-variant/10 hover:shadow-xl transition-shadow">
              <div className="flex gap-6 items-start">
                <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-4 border-tertiary-fixed">
                  <img
                    alt="Anonymized success story avatar"
                    className="w-full h-full object-cover grayscale"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSXMkLp9xmDpTWkTHKG0dJh5zhA7Eb6fuefBAEG-Y0VlpgO-o6xJ4Jf9Paa_lzmX70sfRPI2pJSCcbZbUV8ZozhRg64plNwMc8vB86obIwTMaLIgrwGKQSAWFRJlHm_lQ27ArTa96kjlZ8tQHO4WwAV17HYG39dLqnKsFfUfEW4S1r69WHSXJc0_47A8zkHyVnTan1BmSwJLjPOd13qY9DmcECoheN0Kcefmsm-5d7_GHaSUReP1L6dHseUXFz6iFKZEGNb3sumA"
                  />
                </div>
                <div>
                  <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold uppercase rounded-full mb-3 tracking-widest">
                    Case Highlight: Literacy
                  </span>
                  <h4 className="text-xl font-bold text-blue-900 mb-3">
                    Mateo's First Chapter
                  </h4>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-6 italic">
                    "Mateo arrived at Lucero with no formal schooling. In just 18
                    months, he is reading at grade level and leading our weekly
                    youth council meetings."
                  </p>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-xs font-bold text-primary uppercase">
                        Program
                      </p>
                      <p className="text-xs">Accelerated Literacy</p>
                    </div>
                    <div className="w-px h-8 bg-outline-variant/30"></div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-primary uppercase">
                        Age
                      </p>
                      <p className="text-xs">9 Years Old</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="aurora-gradient rounded-3xl p-12 text-center text-white mb-20 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold mb-6">
              Continue the Impact
            </h2>
            <p className="text-white/80 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Your transparency report is updated monthly. Join us in our
              mission to reach 1,000 children by the end of 2025.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="bg-white text-blue-900 px-8 py-4 rounded-xl font-extrabold text-lg transition-transform hover:scale-105 active:scale-95">
                Make a Donation
              </button>
              <button className="bg-transparent border-2 border-white/30 hover:bg-white/10 px-8 py-4 rounded-xl font-extrabold text-lg">
                Partner With Us
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </section>
      </main>
    </div>
  );
}
