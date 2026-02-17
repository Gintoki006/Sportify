import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import SportChips from '@/components/SportChips';
import FeaturedEvents from '@/components/FeaturedEvents';
import AboutSection from '@/components/AboutSection';
import CTABanner from '@/components/CTABanner';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SportChips />
        <FeaturedEvents />
        <AboutSection />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
