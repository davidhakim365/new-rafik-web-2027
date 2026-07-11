import { Badge } from "../ui/badge";
import { Briefcase, School, Laptop } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Heading } from "../ui/heading";
import { SubHeading } from "../ui/sub-heading";
import { WobbleCard } from "../ui/wobble-card";
import { CardContent, CardHeader } from "@/components/ui/card";
import { PhysicsGrid, GlowOrb } from "@/components/ui/physics-graphics";
import { cn } from "@/lib/utils";
import mrRafikImage from "@/assets/images/mr-rafik.png";

const leftToRightVariants = {
  hidden: { opacity: 0, filter: "blur(20px)", y: 40 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.9, filter: "blur(20px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: "easeOut" },
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

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
      dir={isRTL ? "rtl" : "ltr"}
      className="relative py-16 bg-aboutSection md:py-32 overflow-hidden"
    >
      <PhysicsGrid className="opacity-30" />
      <GlowOrb className="bottom-0 -left-40 size-96 from-color1/15 to-color2/10" />
      <GlowOrb className="top-20 -right-32 size-72 from-color2/10 to-color1/5" />

      <div className="relative z-10 px-6 mx-auto max-w-7xl">
        <div
          className={cn(
            "grid items-center gap-12 lg:gap-16 lg:grid-cols-2",
            isRTL && "lg:[direction:rtl]"
          )}
        >
          <motion.div
            variants={imageVariants}
            className={cn(
              "relative flex justify-center lg:justify-start",
              isRTL ? "lg:justify-end" : "lg:justify-start"
            )}
          >
            <div className="relative w-full max-w-md lg:max-w-lg">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-color2/25 via-color1/15 to-transparent blur-3xl" />

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="absolute -top-4 -left-4 size-16 rounded-full bg-color2/20 blur-sm" />
                <div className="absolute -bottom-6 -right-6 size-24 rounded-full border-2 border-color2/20" />
                <div className="absolute top-1/2 -right-8 size-3 rounded-full bg-color2/60" />
                <div className="absolute bottom-12 -left-6 size-2 rounded-full bg-color1/50" />

                <div className="relative overflow-hidden rounded-3xl ring-2 ring-color2/20 shadow-2xl shadow-color2/15">
                  <img
                    src={mrRafikImage}
                    alt={t("about.imageAlt")}
                    className="w-full h-auto object-cover select-none"
                    draggable={false}
                  />
                </div>
              </motion.div>

              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-background/90 backdrop-blur-md border border-color2/15 shadow-lg">
                <p className="text-sm font-semibold text-color2 whitespace-nowrap">
                  {t("hero.title")}
                </p>
              </div>
            </div>
          </motion.div>

          <div className={cn("flex flex-col gap-8", isRTL && "lg:[direction:rtl]")}>
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
              className={cn("text-center lg:text-start")}
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
                <SubHeading
                  className={cn(
                    "mt-4 text-lg tracking-wide text-balance md:text-xl",
                    "lg:max-w-none mx-auto lg:mx-0"
                  )}
                >
                  {t("about.description")}
                </SubHeading>
              </motion.div>
            </motion.div>

            <motion.div
              variants={{
                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
              }}
              className="grid gap-4"
            >
              {cards.map(({ icon: Icon, key }, i) => (
                <motion.div key={key} variants={cardItemVariants}>
                  <WobbleCard containerClassName={`h-full group ${cardStyles[i]}`}>
                    <CardHeader className="flex-row items-center gap-4 pb-2 text-start">
                      <CardDecorator>
                        <Icon className="text-white size-5" aria-hidden />
                      </CardDecorator>
                      <Heading className="text-white text-lg md:text-xl">
                        {t(`about.items.${key}.title`)}
                      </Heading>
                    </CardHeader>
                    <CardContent className="text-start ps-16">
                      <SubHeading className="tracking-wide text-sm text-balance md:text-base text-white/80">
                        {t(`about.items.${key}.description`)}
                      </SubHeading>
                    </CardContent>
                  </WobbleCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

const CardDecorator = ({ children }: { children: React.ReactNode }) => (
  <div
    aria-hidden
    className="relative shrink-0 size-12 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
  >
    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:12px_12px]" />
    <div className="absolute inset-0 flex items-center justify-center m-auto border border-white/20 rounded-lg size-10 bg-white/10 backdrop-blur-sm">
      {children}
    </div>
  </div>
);

export default AboutSection;
