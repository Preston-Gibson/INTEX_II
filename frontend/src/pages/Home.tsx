import Nav from '../components/Nav'
import Hero from '../components/Hero'
import ImpactSection from '../components/ImpactSection'
import MapSection from '../components/MapSection'
import HowWeWork from '../components/HowWeWork'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ImpactSection />
        <MapSection />
        <HowWeWork />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
