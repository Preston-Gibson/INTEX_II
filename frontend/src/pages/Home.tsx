import Hero from '../components/Hero'
import ImpactSection from '../components/ImpactSection'
import MapSection from '../components/MapSection'
import HowWeWork from '../components/HowWeWork'
import CTASection from '../components/CTASection'

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <ImpactSection />
        <MapSection />
        <HowWeWork />
        <CTASection />
      </main>
    </>
  )
}
