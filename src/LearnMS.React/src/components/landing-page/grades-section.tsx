import { BookOpenCheck, School, GraduationCap, ScrollText } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FeatureCard } from "@/components/ui/grid-feature-cards";
import { Heading } from "../ui/heading";
import { SubHeading } from "../ui/sub-heading";
import { PhysicsGrid, GlowOrb } from "@/components/ui/physics-graphics";

const leftToRightVariants = {
  hidden: { opacity: 0, filter: "blur(20px)", y: 40 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", bounce: 0.3, duration: 0.7 },
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

  const header = (
    <div className="max-w-3xl mx-auto text-center mb-12">
      <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full bg-color2/10 text-color2 border border-color2/20">
        {t("grades.badge")}
      </span>
      <Heading className="text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
        {t("grades.title")}
      </Heading>
      <SubHeading className="mt-4 text-lg tracking-wide text-balance md:text-xl">
        {t("grades.description")}
      </SubHeading>
    </div>
  );

  const grid = (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {grades.map((grade, i) => (
        <FeatureCard key={i} feature={grade} />
      ))}
    </div>
  );

  if (shouldReduceMotion) {
    return (
      <section className="relative py-16 md:py-28 bg-gradesSection overflow-hidden">
        <PhysicsGrid className="opacity-40" />
        <GlowOrb className="top-1/2 -right-32 size-80 from-color2/15 to-color1/10" />
        <div className="relative z-10 w-full max-w-6xl px-4 mx-auto">
          {header}
          {grid}
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-16 md:py-28 bg-gradesSection overflow-hidden">
      <PhysicsGrid className="opacity-40" />
      <GlowOrb className="top-1/2 -right-32 size-80 from-color2/15 to-color1/10" />

      <div className="relative z-10 w-full max-w-6xl px-4 mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
          }}
        >
          <motion.div variants={leftToRightVariants}>{header}</motion.div>

          <motion.div
            variants={{
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
            }}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {grades.map((grade, i) => (
              <motion.div key={i} variants={cardItemVariants}>
                <FeatureCard feature={grade} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default GradesSection;
