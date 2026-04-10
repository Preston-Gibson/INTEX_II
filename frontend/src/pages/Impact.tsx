import ImpactStatsGrid from '../components/ImpactStatsGrid'
import GeographicSection from '../components/GeographicSection'
import TransparencySection from '../components/TransparencySection'
import StoriesSection from '../components/StoriesSection'
import CTASection from '../components/CTASection'
import { useLanguage } from '../context/LanguageContext'

export default function Impact() {
  const { t } = useLanguage()

  return (
    <div className="text-on-surface pt-10">
      <main className="px-6 max-w-7xl mx-auto">
        <header className="mb-16">
          <h1 className="text-3xl md:text-5xl font-extrabold text-primary mb-4 tracking-tight">
            {t('impact.page.heading')}
          </h1>
          <p className="text-base md:text-xl text-on-surface-variant max-w-2xl leading-relaxed">
            {t('impact.page.subheading')}
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
