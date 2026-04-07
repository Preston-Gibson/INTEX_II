export default function HowWeWork() {
  return (
    <section className="bg-surface py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-[5fr_7fr] gap-20 items-center">
        {/* Left — text + bullets */}
        <div className="relative">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-secondary/[0.08] rounded-full blur-[3rem] pointer-events-none" />

          <h2 className="relative font-manrope text-[clamp(2rem,3.2vw,2.75rem)] font-extrabold text-primary mb-5">
            The Buffer Against Exploitation
          </h2>
          <p className="relative text-[1.05rem] leading-[1.8] text-on-surface-variant mb-10">
            We operate in the critical gap between vulnerability and assault. Our mission
            is to create a multi-layered defense that protects children before the worst
            can happen, and heals them if it already has.
          </p>

          <div className="relative flex flex-col gap-7">
            <div className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[1.3rem]">radar</span>
              </div>
              <div>
                <h4 className="font-manrope text-base font-bold text-on-surface mb-1">Early Detection</h4>
                <p className="text-[0.9rem] leading-[1.65] text-on-surface-variant">
                  Community-based monitoring systems to identify at-risk children before exploitation occurs.
                </p>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[1.3rem]">shield</span>
              </div>
              <div>
                <h4 className="font-manrope text-base font-bold text-on-surface mb-1">Rapid Response</h4>
                <p className="text-[0.9rem] leading-[1.65] text-on-surface-variant">
                  Immediate legal and physical intervention protocols to remove survivors from harm's way.
                </p>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[1.3rem]">favorite</span>
              </div>
              <div>
                <h4 className="font-manrope text-base font-bold text-on-surface mb-1">Generational Healing</h4>
                <p className="text-[0.9rem] leading-[1.65] text-on-surface-variant">
                  Working with families to break cycles of vulnerability and poverty through sustainable support.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — staggered image grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-4 mt-12">
            <img
              className="w-full aspect-[3/4] object-cover rounded-[1.5rem] shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDc-5Iw58mAex94y_ECAHQtA4n9hf0av1NHNuByU4bMoHAAT9oTpS22jhbYV4R04MzTsyjC5F_Q9vX3TDWxe8YC1jAO61pQhD_A1U1rV4w5Etiles8BzLN8GYbrYNQjyW-uXEZXDyGPuBRo4Cp18vM3mF-ytwFoI-0tk2i6K9mcERRu5_Df12LhMTrpIK7YgNoo2cPn-i8zMgjSRWAJZbtMj4jZXnYYTmi01esoBylFXyNOIfgywbDSZNM0z9RmmcS-0uWYVJghRg"
              alt="Child walking toward a bright horizon"
            />
            <img
              className="w-full aspect-square object-cover rounded-[1.5rem] shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1q-u2Mc2oyrCMEjBOVkG3KGUwFcLeizR7Wh3FmsWxbiXHaVj6y9lxLV2YThZsifR-Gc0Sl47Fj3yanHlY_N3GdWCBrry9bmYZE2bML9kbsaqHLS5PTwWx-8zJgbhL9yOEqf0mZHb_lIP89ee2_Z3LR66_fYjtzMxHxCXyG6HU9KFOt7NSczq8LoD841BlovzwXe37o1h9DjCgMMa_mFteWnW8XXVLXiXWfWIxDzWrUbdg9DXzM0silvbTyvWgcXDoxsrrpUVIHw"
              alt="Hands joined in support"
            />
          </div>
          <div className="flex flex-col gap-4">
            <img
              className="w-full aspect-square object-cover rounded-[1.5rem] shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfr45ik6Eaq1qzASF519xMQnsneeX6k04ynS3oQlKu28hjqEv6fcsPXVM27AEHwTMtPnNgRczQpcIxL7cOd7iZ8KdJs5GRrI5qjPWNHgrgFP_ez94dGNhG9xtaDvLioQvzt3BftmVj2LAiTnItFMsqAN5WECJ0n3zObjBNy2A24LQih7KH2YfL-sd9Tdp1sb8npBlKN1H9hYKI6rSE9W0Y02y6ggdBIs7HZY_2idNibV68OpagTKdns5TRc8xyeGvCXsPKL3qzMg"
              alt="Colorful village community"
            />
            <img
              className="w-full aspect-[3/4] object-cover rounded-[1.5rem] shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyS8-zhBehfSldtHFWdfUTMRkPhR0mJDqvom_LNVrTx5wtCXBWxWQ4JclaWhumyGTQZZCfp93PZWY9FWdoFqD4oqXTVkTnyz8V5_VsOIGsypoVRn3Qb2jLiZfv4L_Jb20HqXKpmus_mFqWPjQkHBd1P-6HbgpNHtEmnDdSfFFHO5RVQZhO6dz7CdQS_f_anwJipnjYsyiVlB-gKraBYY2mBxutv_McRRns3yddrtgAv7fYXPbmZIPBIk6rUyRmQcEMnxFAnSj5VQ"
              alt="Bright classroom scene"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
