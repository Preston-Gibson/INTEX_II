import ImpactStatsGrid from '../components/ImpactStatsGrid'
import GeographicSection from '../components/GeographicSection'
import TransparencySection from '../components/TransparencySection'
import StoriesSection from '../components/StoriesSection'
import CTASection from '../components/CTASection'

export default function Impact() {
  return (
    <div className="text-on-surface pt-10">
      <main className="px-6 max-w-7xl mx-auto">
        <header className="mb-16">
          <h1 className="text-5xl font-extrabold text-primary mb-4 tracking-tight">
            Radiant Impact. Total Transparency.
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl leading-relaxed">
            Through your support, we provide sanctuary and hope to children across Central
            America. Here is the real-world difference we've made together in 2026.
          </p>
        </header>

        <ImpactStatsGrid />

        <section className="grid grid-cols-1 lg:grid-cols-2  gap-12 mb-20 items-start">
          <GeographicSection />
          <TransparencySection />
        </section>

        <StoriesSection />

        <CTASection />
      </main>
    </div>
  )
}
