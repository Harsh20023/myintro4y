import Hero from './components/Hero';
import BrandMarquee from './components/BrandMarquee';
import ServicesGrid from './components/ServicesGrid';
import StatsCounter from './components/StatsCounter';
import ProcessSteps from './components/ProcessSteps';
import WhyUs from './components/WhyUs';
import ProductCards from './components/ProductCards';
import Testimonials from './components/Testimonials';
import BlogGrid from './components/BlogGrid';
import CtaBanner from './components/CtaBanner';

export default function Home() {
  return (
    <>
      <Hero />
      <BrandMarquee />
      <ServicesGrid />
      <StatsCounter />
      <ProcessSteps />
      <WhyUs />
      <ProductCards />
      <Testimonials />
      <BlogGrid />
      <CtaBanner />
    </>
  );
}
