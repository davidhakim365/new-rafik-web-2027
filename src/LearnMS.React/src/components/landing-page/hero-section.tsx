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
import { Spotlight } from "../ui/spotlight";
import { BlurryBackground } from "@/components/ui/blurry-background";

const getLeftToRightVariants = (isRTL: boolean) => ({
  hidden: { opacity: 0, filter: "blur(20px)", x: isRTL ? 300 : -300 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    x: 0,
    transition: {
      duration: 1.0,
      ease: "easeInOut",
    },
  },
});

const getRightToLeftVideoVariants = (isRTL: boolean) => ({
  hidden: {
    opacity: 0,
    scale: 0.95,
    filter: "blur(20px)",
    x: isRTL ? -300 : 300,
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
});

const HeroSection = () => {
  const { data: profile } = useGetProfile();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const videoDelay = (5 - 1) * 0.15 + 1.0 + 0.2;

  const leftToRightVariants = getLeftToRightVariants(isRTL);
  const rightToLeftVideoVariants = getRightToLeftVideoVariants(isRTL);

  const gradientColors = {
    from: "oklch(0.646 0.222 41.116)",
    to: "oklch(0.488 0.243 264.376)",
  };

  return (
    <motion.section
      dir={isRTL ? "rtl" : "ltr"}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex items-center justify-center min-h-screen py-16 overflow-hidden bg-hero lg:py-0"
    >
      <BlurryBackground
        gradientColors={gradientColors}
        className="absolute inset-0 z-10 pointer-events-none"
      />

      <div className="relative flex flex-col items-center justify-center mx-auto w-fullpx-4 lg:flex-row lg:px-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2,
              },
            },
          }}
          className="relative flex flex-col items-center w-full gap-6 text-center lg:w-1/2 lg:items-start"
        >
          <Spotlight
            className="absolute left-0 -top-40 md:-top-20 md:left-60"
            fill="white"
          />
          <div
            className={cn(
              "absolute inset-0",
              "[background-size:45px_45px]",
              "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
              "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
            )}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_10%,black)]" />

          <motion.div variants={leftToRightVariants} className="relative z-10">
            <Heading>{t("hero.title")}</Heading>
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <Highlight className="text-2xl text-black dark:text-white md:text-3xl">
              {t("hero.subtitle")}
            </Highlight>
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <Paragraph
              className={cn(
                "relative z-10 text-balance",
                isRTL ? "md:text-right" : "md:text-left"
              )}
            >
              {t("hero.description")}
            </Paragraph>
          </motion.div>

          <motion.div
            variants={leftToRightVariants}
            className="flex flex-col items-center justify-center w-full gap-4 pt-4 sm:flex-row lg:justify-start lg:items-start"
          >
            {!profile?.data && (
              <Link to="/sign-in-sign-up" className="relative z-10 ">
                <FlowButton text={t("hero.getStarted")} />
              </Link>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={rightToLeftVideoVariants}
          transition={{
            delay: videoDelay,
            duration: 0.8,
            ease: "easeOut",
          }}
          className="flex items-center justify-center w-full mt-12 lg:w-1/2 lg:max-w-3xl lg:pl-16 lg:mt-0"
        >
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
        </motion.div>
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none bg-black/5 dark:bg-black/10" />
    </motion.section>
  );
};

export default HeroSection;
