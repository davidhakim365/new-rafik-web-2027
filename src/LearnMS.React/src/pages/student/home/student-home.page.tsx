import HeroSection from "@/components/landing-page/hero-section";
import MemoriesSection from "@/components/landing-page/memories-section";
import SeniorsSection from "@/components/landing-page/seniors-section";
import AboutSection from "@/components/landing-page/about-section";
import FeaturesSection from "@/components/landing-page/features-section";
import Footer from "@/components/footer";
import GradesSection from "@/components/landing-page/grades-section";
import {
  ImportantLecturesSection,
  LatestLecturesSection,
} from "@/components/landing-page/lectures-section";
import { useGetProfile } from "@/generated/api";

const StudentHomePage = () => {
  const { data: profile } = useGetProfile();
  const isSignedIn = !!profile?.data;

  return (
    <div className="flex flex-col w-full min-h-screen">
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <GradesSection />
        {isSignedIn && <ImportantLecturesSection />}
        {isSignedIn && <LatestLecturesSection />}
        <SeniorsSection />
        <MemoriesSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
};

export default StudentHomePage;
