import { useMemo, useState } from "react";
import { Gallery4 } from "@/components/ui/gallery4";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Heading } from "../ui/heading";
import { SubHeading } from "../ui/sub-heading";
import { PhysicsGrid, GlowOrb } from "@/components/ui/physics-graphics";

const seniors = [
  {
    year: "Old Seniors",
    images: [
      {
        id: "old-1",
        src: "https://i.ibb.co/swp6Z4P/old.jpg",
        description:
          "Capturing the legacy of our earliest senior class, filled with pioneering spirit.",
      },
      {
        id: "old-2",
        src: "https://i.ibb.co/xSVJJLC/old3.jpg",
        description:
          "Moments of camaraderie from our Old Seniors, building lifelong bonds.",
      },
      {
        id: "old-3",
        src: "https://i.ibb.co/KW9k91Z/old2.jpg",
        description:
          "Celebrating achievements with the Old Seniors, a class of trailblazers.",
      },
      {
        id: "old-4",
        src: "https://i.ibb.co/Rzkxd1r/old4.jpg",
        description: "Memorable events that defined the Old Seniors' journey.",
      },
      {
        id: "old-5",
        src: "https://i.ibb.co/KW9k91Z/old2.jpg",
        description:
          "Joyful gatherings of the Old Seniors, creating lasting memories.",
      },
      {
        id: "old-6",
        src: "https://i.ibb.co/JQ7CWMs/old6.jpg",
        description:
          "The Old Seniors' dedication to excellence in every moment.",
      },
      {
        id: "old-7",
        src: "https://i.ibb.co/swp6Z4P/old.jpg",
        description: "Reliving the triumphs of the Old Seniors' time with us.",
      },
      {
        id: "old-8",
        src: "https://i.ibb.co/xSVJJLC/old3.jpg",
        description: "The Old Seniors' journey, marked by unity and growth.",
      },
    ],
  },
  {
    year: "Seniors'22",
    images: [
      {
        id: "s22-1",
        src: "https://i.ibb.co/wzZMpvY/221.jpg",
        description:
          "Seniors'22 kicking off their year with enthusiasm and teamwork.",
      },
      {
        id: "s22-2",
        src: "https://i.ibb.co/VwfY0J9/222.jpg",
        description:
          "Seniors'22 collaborating on projects that shaped their future.",
      },
      {
        id: "s22-3",
        src: "https://i.ibb.co/djsGqP2/223.jpg",
        description:
          "Moments of joy from Seniors'22, celebrating their achievements.",
      },
      {
        id: "s22-4",
        src: "https://i.ibb.co/vchwxRq/224.jpg",
        description: "Seniors'22 embracing challenges and growing together.",
      },
      {
        id: "s22-5",
        src: "https://i.ibb.co/v3HxWtY/225.jpg",
        description: "Seniors'22 creating memories during their final year.",
      },
      {
        id: "s22-6",
        src: "https://i.ibb.co/R4CMtSf/226.jpg",
        description: "Seniors'22 showcasing their creativity and passion.",
      },
      {
        id: "s22-7",
        src: "https://i.ibb.co/YtGhTWS/227.jpg",
        description: "Seniors'22 leaving a legacy of inspiration and success.",
      },
      {
        id: "s22-8",
        src: "https://i.ibb.co/VwfY0J9/222.jpg",
        description: "Seniors'22 reflecting on their journey with pride.",
      },
    ],
  },
  {
    year: "Seniors'23",
    images: [
      {
        id: "s23-1",
        src: "https://i.ibb.co/kJCF7YH/231.jpg",
        description: "Seniors'23 starting their year with ambition and unity.",
      },
      {
        id: "s23-2",
        src: "https://i.ibb.co/FKXzZps/232.jpg",
        description: "Seniors'23 pushing boundaries with innovative ideas.",
      },
      {
        id: "s23-3",
        src: "https://i.ibb.co/pWdYTLK/233.jpg",
        description: "Seniors'23 celebrating milestones with enthusiasm.",
      },
      {
        id: "s23-4",
        src: "https://i.ibb.co/vJV0LC2/234.jpg",
        description: "Seniors'23 building connections that last a lifetime.",
      },
      {
        id: "s23-5",
        src: "https://i.ibb.co/R798fxL/235.jpg",
        description: "Seniors'23 thriving in collaborative environments.",
      },
      {
        id: "s23-6",
        src: "https://i.ibb.co/RYZc9mg/236.jpg",
        description:
          "Seniors'23 marking their journey with unforgettable moments.",
      },
      {
        id: "s23-7",
        src: "https://i.ibb.co/RQR7KRf/237.jpg",
        description:
          "Seniors'23 leaving their mark with determination and spirit.",
      },
      {
        id: "s23-8",
        src: "https://i.ibb.co/vJV0LC2/234.jpg",
        description: "Seniors'23 reflecting on a year of growth and success.",
      },
    ],
  },
];

interface Gallery4Props {
  title: string;
  description: string;
  items: {
    id: string;
    title: string;
    description: string;
    href: string;
    image: string;
  }[];
}

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

function SeniorsSection() {
  const [activeYear, setActiveYear] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const galleryData: Gallery4Props = useMemo(
    () => ({
      title: t("seniors.title"),
      description: t("seniors.description"),
      items: seniors[activeYear].images.map(({ id, src }) => ({
        id,
        title: t(`seniors.classes.${activeYear + 1}.title`),
        description: t(`seniors.classes.${activeYear + 1}.description`),
        href: `#${id}`,
        image: src,
      })),
    }),
    [activeYear, t]
  );


  if (shouldReduceMotion) {
    return (
      <section className="relative w-full pt-16 pb-20 bg-seniorsSection overflow-hidden">
        <PhysicsGrid className="opacity-30" />
        <GlowOrb className="top-1/2 -left-32 size-80 from-color2/15 to-color1/10" />
        <div className="container relative z-10 px-4 mx-auto">
          <div className="flex flex-col gap-6 text-center">
            <span className="inline-block px-4 py-1.5 mb-2 text-xs font-semibold tracking-widest uppercase rounded-full bg-color2/10 text-color2 border border-color2/20">
              {t("seniors.badge")}
            </span>
            <Heading className="text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
              {t("seniors.title")}
            </Heading>
            <SubHeading className="mt-4 text-lg tracking-wide text-balance md:text-xl">
              {t("seniors.description")}
            </SubHeading>

            <div className="flex flex-wrap justify-center gap-3">
              {seniors.map((batch, index) => (
                <button
                  key={batch.year}
                  onClick={() => {
                    setActiveYear(index);
                    setSelectedTab(index);
                  }}
                  className="relative px-6 py-2.5 text-sm font-medium transition-all rounded-full bg-background/80 border border-color2/10 text-paragraph hover:border-color2/30"
                >
                  {selectedTab === index && (
                    <span className="absolute inset-0 z-10 rounded-full bg-gradient-to-r from-color1 to-color2"></span>
                  )}
                  <span className={`relative z-20 ${selectedTab === index ? "text-white" : ""}`}>
                    {t(`seniors.classes.${index + 1}.title`)}
                  </span>
                </button>
              ))}
            </div>
            <Gallery4 {...galleryData} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full pt-16 pb-20 bg-seniorsSection overflow-hidden">
      <PhysicsGrid className="opacity-30" />
      <GlowOrb className="top-1/2 -left-32 size-80 from-color2/15 to-color1/10" />
      <div className="container relative z-10 px-4 mx-auto">
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
          className="flex flex-col gap-6 text-center"
        >
          <motion.div variants={leftToRightVariants}>
            <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full bg-color2/10 text-color2 border border-color2/20">
              {t("seniors.badge")}
            </span>
            <Heading className="text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
              {t("seniors.title")}
            </Heading>
          </motion.div>
          <motion.div variants={leftToRightVariants}>
            <SubHeading className="mt-4 text-lg tracking-wide text-balance md:text-xl">
              {t("seniors.description")}
            </SubHeading>
          </motion.div>

          <motion.div
            variants={leftToRightVariants}
            className="flex flex-wrap justify-center gap-3"
          >
            {seniors.map((batch, index) => (
              <button
                key={batch.year}
                onClick={() => {
                  setActiveYear(index);
                  setSelectedTab(index);
                }}
                className="relative px-6 py-2.5 text-sm font-medium transition-all rounded-full bg-background/80 border border-color2/10 text-paragraph hover:border-color2/30"
              >
                {selectedTab === index && (
                  <motion.span
                    layoutId="active-year"
                    className="absolute inset-0 z-10 rounded-full bg-gradient-to-r from-color1 to-color2"
                    transition={{ duration: 0.2 }}
                  ></motion.span>
                )}

                <span className={`relative z-20 ${selectedTab === index ? "text-white" : ""}`}>
                  {t(`seniors.classes.${index + 1}.title`)}
                </span>
              </button>
            ))}
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <Gallery4 {...galleryData} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default SeniorsSection;
