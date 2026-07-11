import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { motion, useReducedMotion } from "framer-motion";
import { Heading } from "@/components/ui/heading";
import { SubHeading } from "@/components/ui/sub-heading";
import { GlowOrb, PhysicsGrid } from "@/components/ui/physics-graphics";
import { useTranslation } from "react-i18next";

const memories = [
  { id: "1", src: "https://i.ibb.co/N7qfx1B/m1.jpg", key: "1" },
  { id: "2", src: "https://i.ibb.co/wZq5fqs/m3.jpg", key: "2" },
  { id: "3", src: "https://i.ibb.co/dDBB8Fh/m4.jpg", key: "3" },
  { id: "4", src: "https://i.ibb.co/QcGxWXF/m5.jpg", key: "4" },
  { id: "5", src: "https://i.ibb.co/KW9k91Z/old2.jpg", key: "5" },
];

const leftToRightVariants = {
  hidden: { opacity: 0, filter: "blur(20px)", y: 40 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

function MemoriesSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const shouldReducedMotion = useReducedMotion();
  const { t } = useTranslation();

  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        setCurrentSlide(0);
        api.scrollTo(0);
      } else {
        api.scrollNext();
        setCurrentSlide((prev) => prev + 1);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [api]);

  const header = (
    <div className="text-center">
      <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full bg-color2/10 text-color2 border border-color2/20">
        {t("memories.badge")}
      </span>
      <Heading className="text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
        {t("memories.title")}
      </Heading>
      <SubHeading className="mt-4 text-lg tracking-wide text-balance md:text-xl">
        {t("memories.description")}
      </SubHeading>
    </div>
  );

  const carousel = (
    <Carousel setApi={setApi} className="w-full">
      <CarouselContent>
        {memories.map(({ id, src, key }) => (
          <CarouselItem key={id} className="p-3 lg:basis-1/2">
            <div className="group relative flex flex-col justify-between h-full overflow-hidden rounded-2xl aspect-video ring-2 ring-color2/10 hover:ring-color2/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-color2/10">
              <img
                src={src}
                alt={t(`memories.items.${key}.title`)}
                className="absolute inset-0 object-cover w-full h-full select-none group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="relative z-10 flex flex-col justify-end h-full gap-2 p-6">
                <h4 className="text-xl font-semibold text-white md:text-2xl">
                  {t(`memories.items.${key}.title`)}
                </h4>
                <p className="text-sm text-white/80">
                  {t(`memories.items.${key}.description`)}
                </p>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );

  const dots = (
    <div className="flex justify-center gap-2 mt-6">
      {memories.map((_, index) => (
        <button
          key={index}
          onClick={() => {
            api?.scrollTo(index);
            setCurrentSlide(index);
          }}
          className={`h-2 rounded-full transition-all duration-300 ${
            currentSlide === index
              ? "bg-color2 w-6"
              : "bg-color2/20 w-2 hover:bg-color2/40"
          }`}
          aria-label={`Slide ${index + 1}`}
        />
      ))}
    </div>
  );

  if (shouldReducedMotion) {
    return (
      <section className="relative w-full py-20 bg-memoriesSection overflow-hidden">
        <PhysicsGrid className="opacity-30" />
        <GlowOrb className="top-0 left-1/2 -translate-x-1/2 size-96 from-color2/10 to-color1/5" />
        <div className="container relative z-10 px-4 mx-auto">
          <div className="flex flex-col gap-10">
            {header}
            {carousel}
            {dots}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full py-20 bg-memoriesSection overflow-hidden">
      <PhysicsGrid className="opacity-30" />
      <GlowOrb className="top-0 left-1/2 -translate-x-1/2 size-96 from-color2/10 to-color1/5" />

      <div className="container relative z-10 px-4 mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
          }}
          className="flex flex-col gap-10"
        >
          <motion.div variants={leftToRightVariants}>{header}</motion.div>
          <motion.div variants={leftToRightVariants}>{carousel}</motion.div>
          <motion.div variants={leftToRightVariants}>{dots}</motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default MemoriesSection;
