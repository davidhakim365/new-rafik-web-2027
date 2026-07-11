import { useGetProfile } from "@/generated/api";
import { Link } from "react-router-dom";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { FlowButton } from "../ui/flow-button";
import { Heading } from "../ui/heading";
import { Paragraph } from "../ui/paragraph";
import { Highlight } from "@/components/ui/hero-highlight";
import {
  FloatingFormulas,
  AtomOrbit,
  PhysicsGrid,
  GlowOrb,
  WavePattern,
} from "@/components/ui/physics-graphics";
import { Atom, BookOpen, Users } from "lucide-react";
import type { GetStudentProfileResult } from "@/generated/model";

const getLeftToRightVariants = (isRTL: boolean) => ({
  hidden: { opacity: 0, filter: "blur(20px)", x: isRTL ? 300 : -300 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    x: 0,
    transition: { duration: 1.0, ease: "easeInOut" },
  },
});

const getRightToLeftVideoVariants = (isRTL: boolean) => ({
  hidden: { opacity: 0, scale: 0.95, filter: "blur(20px)", x: isRTL ? -300 : 300 },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
});

const HeroSection = () => {
  const { data: profile } = useGetProfile();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const videoDelay = (5 - 1) * 0.15 + 1.0 + 0.2;
  const leftToRightVariants = getLeftToRightVariants(isRTL);
  const rightToLeftVideoVariants = getRightToLeftVideoVariants(isRTL);

  const stats = [
    { icon: BookOpen, label: t("hero.stats.courses") },
    { icon: Users, label: t("hero.stats.students") },
    { icon: Atom, label: t("hero.stats.subjects") },
  ];

  const browseCoursesHref = (() => {
    const isStudent =
      profile?.data && profile.data.$type === "GetStudentProfileResult";
    if (!isStudent) return "/courses";

    const level = (profile.data as GetStudentProfileResult).level;
    const match = /Level(\d+)/.exec(level);
    if (match?.[1] !== undefined) {
      return `/courses/levels/${match[1]}`;
    }
    return "/courses";
  })();

  return (
    <motion.section
      dir={isRTL ? "rtl" : "ltr"}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex items-center justify-center min-h-screen py-24 overflow-hidden bg-hero lg:py-0"
    >
      <PhysicsGrid />
      <FloatingFormulas />
      <GlowOrb className="top-20 -left-40 size-[30rem] from-color2/25 to-color1/15" />
      <GlowOrb className="bottom-10 -right-40 size-[28rem] from-color1/20 to-color2/15" />

      <div className="absolute top-1/4 right-8 hidden lg:block opacity-40 dark:opacity-25">
        <AtomOrbit />
      </div>

      <div className="relative flex flex-col items-center justify-center mx-auto w-full px-4 lg:flex-row lg:px-24 max-w-7xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
          }}
          className="relative flex flex-col items-center w-full gap-6 text-center lg:w-1/2 lg:items-start z-10"
        >
          <motion.div variants={leftToRightVariants}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-2 text-xs font-semibold tracking-widest uppercase rounded-full bg-color2/10 text-color2 border border-color2/20">
              <Atom className="size-3.5" />
              {t("hero.badge")}
            </span>
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <Heading className="bg-gradient-to-br from-heading via-heading to-color2 bg-clip-text">
              {t("hero.title")}
            </Heading>
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <Highlight className="text-2xl text-color2 md:text-3xl font-bold">
              {t("hero.subtitle")}
            </Highlight>
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <Paragraph
              className={cn(
                "relative z-10 text-balance max-w-lg",
                isRTL ? "md:text-right" : "md:text-left"
              )}
            >
              {t("hero.description")}
            </Paragraph>
          </motion.div>

          <motion.div
            variants={leftToRightVariants}
            className="flex flex-col items-center justify-center w-full gap-4 pt-2 sm:flex-row lg:justify-start lg:items-start"
          >
            {!profile?.data && (
              <Link to="/sign-in-sign-up" className="relative z-10">
                <FlowButton text={t("hero.getStarted")} />
              </Link>
            )}
            <Link to={browseCoursesHref} className="relative z-10">
              <button className="px-8 py-3 text-sm font-semibold rounded-full border-2 border-color2/30 text-color2 hover:bg-color2/5 transition-all duration-300 hover:border-color2/60">
                {t("hero.browseCourses")}
              </button>
            </Link>
          </motion.div>

          <motion.div
            variants={leftToRightVariants}
            className="flex flex-wrap items-center gap-4 pt-4"
          >
            {stats.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-color2/10 text-sm text-paragraph"
              >
                <Icon className="size-4 text-color2" />
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={rightToLeftVideoVariants}
          transition={{ delay: videoDelay, duration: 0.8, ease: "easeOut" }}
          className="relative flex items-center justify-center w-full mt-12 lg:w-1/2 lg:max-w-3xl lg:pl-16 lg:mt-0 z-10"
        >
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-color2/20 to-color1/10 blur-2xl" />
          <div className="relative w-full rounded-2xl overflow-hidden ring-2 ring-color2/20 shadow-2xl shadow-color2/10">
            <HeroVideoDialog
              className="block w-full dark:hidden"
              animationStyle="from-center"
              videoSrc="https://www.youtube.com/embed/pSUqW9NZiqM"
              thumbnailSrc="https://img.youtube.com/vi/pSUqW9NZiqM/maxresdefault.jpg"
              thumbnailAlt="Promo Video Thumbnail"
            />
            <HeroVideoDialog
              className="hidden w-full dark:block"
              animationStyle="from-center"
              videoSrc="https://www.youtube.com/embed/pSUqW9NZiqM"
              thumbnailSrc="https://img.youtube.com/vi/pSUqW9NZiqM/maxresdefault.jpg"
              thumbnailAlt="Promo Video Thumbnail"
            />
          </div>
        </motion.div>
      </div>

      <WavePattern />
    </motion.section>
  );
};

export default HeroSection;
