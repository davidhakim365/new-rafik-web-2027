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
import {
  GlowOrb,
  PhysicsGrid,
  FloatingFormulas,
  PhysicsDivider,
  WavePattern,
} from "@/components/ui/physics-graphics";
import { useTranslation } from "react-i18next";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const memories = [
  { id: "1", src: "https://i.ibb.co/N7qfx1B/m1.jpg", key: "1" },
  { id: "2", src: "https://i.ibb.co/wZq5fqs/m3.jpg", key: "2" },
  { id: "3", src: "https://i.ibb.co/dDBB8Fh/m4.jpg", key: "3" },
  { id: "4", src: "https://i.ibb.co/QcGxWXF/m5.jpg", key: "4" },
  { id: "5", src: "https://i.ibb.co/KW9k91Z/old2.jpg", key: "5" },
];

const overlayFormulas = ["E = mc²", "∫ dx", "∇·B = 0", "F = ma", "λ = h/p"];

function MemoriesSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const reduceMotion = useReducedMotion();
  const { t } = useTranslation();

  useEffect(() => {
    if (!api) return;

    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);

    const interval = setInterval(() => {
      if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        api.scrollTo(0);
      } else {
        api.scrollNext();
      }
    }, 4500);

    return () => {
      clearInterval(interval);
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <section className="relative w-full overflow-hidden bg-memoriesSection py-20 md:py-28">
      <PhysicsGrid className="opacity-35" />
      <FloatingFormulas className="opacity-40" />
      <GlowOrb className="left-1/2 top-0 size-[28rem] -translate-x-1/2 from-color2/15 to-color1/10" />
      <GlowOrb className="-bottom-16 -left-16 size-72 from-color1/10 to-color2/10" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="grid items-end gap-6 md:grid-cols-[1.1fr_0.9fr]"
        >
          <div>
            <span className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-color2">
              <Camera className="size-3.5" />
              {t("memories.badge")}
            </span>
            <Heading className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {t("memories.title")}
            </Heading>
            <SubHeading className="mt-4 max-w-xl text-lg md:text-xl">
              {t("memories.description")}
            </SubHeading>
          </div>

          <div className="hidden justify-end gap-6 md:flex">
            <div className="rounded-2xl border border-color2/15 bg-background/50 px-4 py-3 backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                frames
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-heading">
                {memories.length}
              </p>
            </div>
            <div className="rounded-2xl border border-color2/15 bg-background/50 px-4 py-3 backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                now
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-heading">
                {String(currentSlide + 1).padStart(2, "0")}
              </p>
            </div>
          </div>
        </motion.div>

        <PhysicsDivider />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12, duration: 0.6 }}
          className="relative mt-8"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-2 -top-2 z-20 size-10 border-l-2 border-t-2 border-color2/50 sm:size-14"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-2 -right-2 z-20 size-10 border-b-2 border-r-2 border-color1/50 sm:size-14"
          />

          <Carousel setApi={setApi} className="w-full">
            <CarouselContent className="-ml-3 md:-ml-4">
              {memories.map(({ id, src, key }, index) => (
                <CarouselItem
                  key={id}
                  className="pl-3 md:basis-4/5 md:pl-4 lg:basis-3/5"
                >
                  <div
                    className={cn(
                      "group relative overflow-hidden rounded-[1.5rem] border border-color2/15 bg-background/30 shadow-lg shadow-color2/5 transition duration-500",
                      currentSlide === index
                        ? "ring-2 ring-color2/25"
                        : "opacity-90"
                    )}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={src}
                        alt={t(`memories.items.${key}.title`)}
                        className="size-full object-cover transition duration-700 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                      <span
                        aria-hidden
                        className="absolute right-4 top-4 font-mono text-xs text-white/40 md:text-sm"
                      >
                        {overlayFormulas[index % overlayFormulas.length]}
                      </span>

                      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
                          memory_{String(index + 1).padStart(2, "0")}
                        </p>
                        <h4 className="text-xl font-semibold text-white sm:text-2xl">
                          {t(`memories.items.${key}.title`)}
                        </h4>
                        <p className="mt-2 max-w-lg text-sm text-white/80">
                          {t(`memories.items.${key}.description`)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-10 rounded-xl border-color2/20"
                onClick={() => api?.scrollPrev()}
                aria-label="Previous memory"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-10 rounded-xl border-color2/20"
                onClick={() => api?.scrollNext()}
                aria-label="Next memory"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2 sm:max-w-xs">
              {memories.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => api?.scrollTo(index)}
                  aria-label={`Go to memory ${index + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    currentSlide === index
                      ? "w-8 bg-gradient-to-r from-color1 to-color2"
                      : "w-1.5 bg-color2/25 hover:bg-color2/45"
                  )}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <WavePattern className="opacity-60" />
    </section>
  );
}

export default MemoriesSection;
