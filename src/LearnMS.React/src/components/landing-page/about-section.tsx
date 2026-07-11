import { Badge } from "../ui/badge";
import { Briefcase, School, Laptop } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Heading } from "../ui/heading";
import { SubHeading } from "../ui/sub-heading";
import { WobbleCard } from "../ui/wobble-card";
import { CardContent, CardHeader } from "@/components/ui/card";
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

const cardStyles = [
  "bg-gradient-to-br from-color1 to-color2",
  "bg-gradient-to-br from-[#1a3a8a] to-[#2563eb]",
  "bg-gradient-to-br from-[#0f2d6e] to-color2",
];

function AboutSection() {
  const { t } = useTranslation();

  const cards = [
    { icon: Briefcase, key: "1" },
    { icon: School, key: "2" },
    { icon: Laptop, key: "3" },
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
      }}
      className="relative py-16 bg-aboutSection md:py-32 overflow-hidden"
    >
      <PhysicsGrid className="opacity-30" />
      <GlowOrb className="bottom-0 -left-40 size-96 from-color1/15 to-color2/10" />

      <div className="relative z-10 px-6 mx-auto max-w-7xl">
        <motion.div
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="text-center"
        >
          <motion.div variants={leftToRightVariants}>
            <Badge className="px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full bg-color2/10 text-color2 border border-color2/20 hover:bg-color2/15">
              {t("about.badge")}
            </Badge>
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <Heading className="text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
              {t("about.title")}
            </Heading>
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <SubHeading className="mt-4 text-lg tracking-wide text-balance md:text-xl max-w-2xl mx-auto">
              {t("about.description")}
            </SubHeading>
          </motion.div>
        </motion.div>

        <motion.div
          variants={{
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } },
          }}
          className="md:max-w-full md:grid-cols-3 mx-auto mt-10 grid max-w-sm gap-6 md:mt-16"
        >
          {cards.map(({ icon: Icon, key }, i) => (
            <motion.div key={key} variants={cardItemVariants}>
              <WobbleCard containerClassName={`h-full group ${cardStyles[i]}`}>
                <CardHeader className="pb-3 text-center">
                  <CardDecorator>
                    <Icon className="text-white size-6" aria-hidden />
                  </CardDecorator>
                  <Heading className="text-white text-xl md:text-2xl">
                    {t(`about.items.${key}.title`)}
                  </Heading>
                </CardHeader>
                <CardContent className="text-center">
                  <SubHeading className="mt-2 tracking-wide text-sm text-balance md:text-base text-white/80">
                    {t(`about.items.${key}.description`)}
                  </SubHeading>
                </CardContent>
              </WobbleCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

const CardDecorator = ({ children }: { children: React.ReactNode }) => (
  <div
    aria-hidden
    className="relative mx-auto size-24 mb-4 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
  >
    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
    <div className="absolute inset-0 flex items-center justify-center m-auto border border-white/20 rounded-xl size-14 bg-white/10 backdrop-blur-sm">
      {children}
    </div>
  </div>
);

export default AboutSection;
