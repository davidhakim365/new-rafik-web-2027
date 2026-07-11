import {
  Atom,
  Calculator,
  MonitorPlay,
  ClipboardCheck,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Heading } from "../ui/heading";
import { SubHeading } from "../ui/sub-heading";
import { PhysicsGrid, GlowOrb, PhysicsDivider } from "@/components/ui/physics-graphics";
import { cn } from "@/lib/utils";

const leftToRightVariants = {
  hidden: { opacity: 0, filter: "blur(20px)", y: 40 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", bounce: 0.3, duration: 0.7 },
  },
};

const featureIcons = [Atom, Calculator, MonitorPlay, ClipboardCheck, TrendingUp, BookOpen];

function FeaturesSection() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const features = [1, 2, 3, 4, 5, 6].map((i, idx) => ({
    icon: featureIcons[idx],
    title: t(`features.items.${i}.title`),
    description: t(`features.items.${i}.description`),
  }));

  const content = (
    <section className="relative py-20 md:py-28 bg-featuresSection overflow-hidden">
      <PhysicsGrid className="opacity-60" />
      <GlowOrb className="top-0 -left-32 size-96 from-color2/20 to-color1/10" />
      <GlowOrb className="bottom-0 -right-32 size-80 from-color1/15 to-color2/10" />

      <div className="relative z-10 w-full max-w-6xl px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full bg-color2/10 text-color2 border border-color2/20">
            {t("features.badge")}
          </span>
          <Heading className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            {t("features.title")}
          </Heading>
          <SubHeading className="mt-4 text-lg md:text-xl">
            {t("features.description")}
          </SubHeading>
        </div>

        <PhysicsDivider />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {features.map(({ icon: Icon, title, description }, i) => (
            <div
              key={i}
              className={cn(
                "group relative p-6 rounded-2xl border border-color2/10 bg-background/60 backdrop-blur-sm",
                "hover:border-color2/30 hover:shadow-lg hover:shadow-color2/5 transition-all duration-300",
                "hover:-translate-y-1"
              )}
            >
              <div className="flex items-center justify-center size-12 mb-4 rounded-xl bg-gradient-to-br from-color1 to-color2 text-white shadow-md shadow-color2/20 group-hover:scale-110 transition-transform duration-300">
                <Icon className="size-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-heading mb-2">{title}</h3>
              <p className="text-sm leading-relaxed text-paragraph">{description}</p>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-color2/0 to-color1/0 group-hover:from-color2/5 group-hover:to-color1/5 transition-all duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  if (shouldReduceMotion) return content;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
      }}
      className="relative py-20 md:py-28 bg-featuresSection overflow-hidden"
    >
      <PhysicsGrid className="opacity-60" />
      <GlowOrb className="top-0 -left-32 size-96 from-color2/20 to-color1/10" />
      <GlowOrb className="bottom-0 -right-32 size-80 from-color1/15 to-color2/10" />

      <div className="relative z-10 w-full max-w-6xl px-4 mx-auto">
        <motion.div
          variants={leftToRightVariants}
          className="max-w-3xl mx-auto text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full bg-color2/10 text-color2 border border-color2/20">
            {t("features.badge")}
          </span>
          <Heading className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            {t("features.title")}
          </Heading>
          <SubHeading className="mt-4 text-lg md:text-xl">
            {t("features.description")}
          </SubHeading>
        </motion.div>

        <PhysicsDivider />

        <motion.div
          variants={{
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10"
        >
          {features.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              className={cn(
                "group relative p-6 rounded-2xl border border-color2/10 bg-background/60 backdrop-blur-sm",
                "hover:border-color2/30 hover:shadow-lg hover:shadow-color2/5 transition-all duration-300",
                "hover:-translate-y-1"
              )}
            >
              <div className="flex items-center justify-center size-12 mb-4 rounded-xl bg-gradient-to-br from-color1 to-color2 text-white shadow-md shadow-color2/20 group-hover:scale-110 transition-transform duration-300">
                <Icon className="size-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-heading mb-2">{title}</h3>
              <p className="text-sm leading-relaxed text-paragraph">{description}</p>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-color2/0 to-color1/0 group-hover:from-color2/5 group-hover:to-color1/5 transition-all duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

export default FeaturesSection;
