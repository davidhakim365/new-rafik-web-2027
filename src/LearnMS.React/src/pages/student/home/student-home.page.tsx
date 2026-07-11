import HeroSection from "@/components/landing-page/hero-section";
import MemoriesSection from "@/components/landing-page/memories-section";
import SeniorsSection from "@/components/landing-page/seniors-section";
import AboutSection from "@/components/landing-page/about-section";
import Footer from "@/components/footer";
import GradesSection from "@/components/landing-page/grades-section";
import { ImportantLecturesSection } from "@/components/landing-page/lectures-section";

const StudentHomePage = () => {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <main className="flex-1">
        <HeroSection />
        <GradesSection />
        {/* <ImportantLecturesSection />*/}
        <SeniorsSection />
        {/* <LatestLecturesSection /> */}
        <MemoriesSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
};

export default StudentHomePage;
