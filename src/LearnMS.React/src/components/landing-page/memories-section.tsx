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
import { BlurryBackground } from "@/components/ui/blurry-background";

const memories = [
  {
    id: "1",
    src: "https://i.ibb.co/N7qfx1B/m1.jpg",
    title: "First Day Excitement",
    description:
      "Recalling the nervous anticipation and joy of the very first day.",
  },
  {
    id: "2",
    src: "https://i.ibb.co/wZq5fqs/m3.jpg",
    title: "Team Spirit",
    description:
      "Moments of collaboration and teamwork that define our journey.",
  },
  {
    id: "3",
    src: "https://i.ibb.co/dDBB8Fh/m4.jpg",
    title: "Learning Adventures",
    description: "Exploring new horizons and expanding our knowledge together.",
  },
  {
    id: "4",
    src: "https://i.ibb.co/QcGxWXF/m5.jpg",
    title: "Celebration Milestones",
    description:
      "Commemorating achievements and special events throughout the years.",
  },
  {
    id: "5",
    src: "https://i.ibb.co/KW9k91Z/old2.jpg",
    title: "Lasting Bonds",
    description:
      "Friendships forged and memories created that will last a lifetime.",
  },
];

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

function MemoriesSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const shouldReducedMotion = useReducedMotion();

  const gradientColors = {
    from: "oklch(0.8 0.1 50)",
    to: "oklch(0.4 0.15 320)",
  };

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

  if (shouldReducedMotion) {
    return (
      <section className="relative w-full py-20 bg-memoriesSection">
        <BlurryBackground
          gradientColors={gradientColors}
          className="absolute inset-0 z-0"
        />
        <div className="container relative z-10 px-4 mx-auto">
          <div className="flex flex-col gap-10 text-center">
            <Heading className="text-3xl font-bold tracking-wide text-balance md:text-4xl lg:text-5xl">
              Cherished Memories
            </Heading>
            <SubHeading className="mt-4 text-lg tracking-wide text-balance md:text-xl">
              A collection of our most unforgettable moments and events.
            </SubHeading>

            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {memories.map(({ id, src, title, description }) => (
                  <CarouselItem key={id} className="p-4 lg:basis-1/2">
                    <div className="relative flex flex-col justify-between h-full overflow-hidden shadow-sm bg-neutral-100 dark:bg-neutral-800 rounded-xl aspect-video">
                      <img
                        src={src}
                        alt={title}
                        className="absolute inset-0 object-cover w-full h-full select-none"
                      />
                      <div className="absolute inset-0 bg-black/40 dark:bg-black/50" />
                      <div className="relative z-10 flex flex-col justify-end h-full gap-2 p-6">
                        <h4 className="text-2xl font-semibold text-white">
                          {title}
                        </h4>
                        <p className="text-sm text-white/80">{description}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            <div className="flex justify-center gap-2 mt-6">
              {memories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    api?.scrollTo(index);
                    setCurrentSlide(index);
                  }}
                  className={`size-2 rounded-full transition-all duration-300 ${
                    currentSlide === index
                      ? "bg-black dark:bg-white w-4"
                      : "bg-neutral-300 dark:bg-neutral-700"
                  }`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full py-20 bg-memoriesSection">
      <BlurryBackground
        gradientColors={gradientColors}
        className="absolute inset-0 z-0"
      />
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
          className="flex flex-col gap-10 text-center"
        >
          <motion.div variants={leftToRightVariants}>
            <Heading className="text-3xl font-bold tracking-wide text-balance md:text-4xl lg:text-5xl">
              Cherished Memories
            </Heading>
          </motion.div>
          <motion.div variants={leftToRightVariants}>
            <SubHeading className="mt-4 text-lg tracking-wide text-balance md:text-xl">
              A collection of our most unforgettable moments and events.
            </SubHeading>
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {memories.map(({ id, src, title, description }) => (
                  <CarouselItem key={id} className="p-4 lg:basis-1/2">
                    <div className="relative flex flex-col justify-between h-full overflow-hidden shadow-sm bg-neutral-100 dark:bg-neutral-800 rounded-xl aspect-video">
                      <img
                        src={src}
                        alt={title}
                        className="absolute inset-0 object-cover w-full h-full select-none"
                      />
                      <div className="absolute inset-0 bg-black/40 dark:bg-black/50" />
                      <div className="relative z-10 flex flex-col justify-end h-full gap-2 p-6">
                        <h4 className="text-2xl font-semibold text-white">
                          {title}
                        </h4>
                        <p className="text-sm text-white/80">{description}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </motion.div>

          <motion.div
            variants={leftToRightVariants}
            className="flex justify-center gap-2 mt-6"
          >
            {memories.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  api?.scrollTo(index);
                  setCurrentSlide(index);
                }}
                className={`size-2 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? "bg-black dark:bg-white w-4"
                    : "bg-neutral-300 dark:bg-neutral-700"
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default MemoriesSection;
