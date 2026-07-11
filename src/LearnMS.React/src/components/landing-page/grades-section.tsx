import { BookOpenCheck, School, GraduationCap, ScrollText } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FeatureCard } from "@/components/ui/grid-feature-cards";
import { Heading } from "../ui/heading";
import { SubHeading } from "../ui/sub-heading";
import { BlurryBackground } from "@/components/ui/blurry-background";

const leftToRightVariants = {
  hidden: { opacity: 0, filter: "blur(20px)", x: -300 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    x: 0,
    transition: {
      duration: 1.0,
      ease: "easeInOut",
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, filter: "blur(20px)", scale: 0, y: 300 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 0.9,
    },
  },
};

function GradesSection() {
  const { t } = useTranslation();

  const grades = [
    {
      title: t("grades.items.thirdMiddle.title"),
      icon: School,
      description: t("grades.items.thirdMiddle.description"),
      level: 0,
    },
    {
      title: t("grades.items.firstSecondary.title"),
      icon: BookOpenCheck,
      description: t("grades.items.firstSecondary.description"),
      level: 1,
    },
    {
      title: t("grades.items.secondSecondary.title"),
      icon: ScrollText,
      description: t("grades.items.secondSecondary.description"),
      level: 2,
    },
    {
      title: t("grades.items.thirdSecondary.title"),
      icon: GraduationCap,
      description: t("grades.items.thirdSecondary.description"),
      level: 3,
    },
  ];

  const shouldReduceMotion = useReducedMotion();

  const gradientColors = {
    from: "oklch(0.7 0.1 200)",
    to: "oklch(0.5 0.15 300)",
  };

  if (shouldReduceMotion) {
    return (
      <section className="relative py-16 md:py-28 bg-gradesSection">
        {" "}
        <BlurryBackground
          gradientColors={gradientColors}
          className="absolute inset-0 z-0"
        />
        <div className="relative z-10 w-full max-w-6xl px-4 mx-auto space-y-8">
          {" "}
          <div className="max-w-3xl mx-auto text-center">
            <Heading className="text-3xl font-bold tracking-wide text-balance md:text-4xl lg:text-5xl">
              {t("grades.title")}
            </Heading>
            <SubHeading className="mt-4 text-lg tracking-wide text-balance md:text-xl">
              {t("grades.description")}
            </SubHeading>
          </div>
          <div className="grid grid-cols-1 border border-dashed divide-x divide-y md:grid-cols-2 divide-dashed">
            {grades.map((grade, i) => (
              <FeatureCard key={i} feature={grade} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-16 md:py-28 bg-gradesSection">
      {" "}
      <BlurryBackground
        gradientColors={gradientColors}
        className="absolute inset-0 z-0"
      />
      <div className="relative z-10 w-full max-w-6xl px-4 mx-auto space-y-8">
        {" "}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2,
              },
            },
          }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div variants={leftToRightVariants}>
            <Heading className="text-3xl font-bold tracking-wide text-balance md:text-4xl lg:text-5xl">
              {t("grades.title")}
            </Heading>
          </motion.div>
          <motion.div variants={leftToRightVariants}>
            <SubHeading className="mt-4 text-lg tracking-wide text-balance md:text-xl">
              {t("grades.description")}
            </SubHeading>
          </motion.div>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.4,
              },
            },
          }}
          className="grid grid-cols-1 border border-dashed divide-x divide-y border-muted-foreground/20 md:grid-cols-2 divide-dashed"
        >
          {grades.map((grade, i) => (
            <motion.div key={i} variants={cardItemVariants}>
              <FeatureCard feature={grade} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default GradesSection;
