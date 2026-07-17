import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  BarChart3,
  Users,
} from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { SubHeading } from "@/components/ui/sub-heading";
import { FlowButton } from "@/components/ui/flow-button";
import { PhysicsGrid, GlowOrb, PhysicsDivider } from "@/components/ui/physics-graphics";
import { cn } from "@/lib/utils";

const features = [
  { icon: CalendarCheck, key: "attendance" },
  { icon: ClipboardList, key: "quizzes" },
  { icon: GraduationCap, key: "exams" },
  { icon: BarChart3, key: "stats" },
] as const;

function ParentFollowUpSection() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const content = (
    <section className="relative overflow-hidden bg-gradesSection py-20 md:py-28">
      <PhysicsGrid className="opacity-50" />
      <GlowOrb className="top-10 -right-24 size-80 from-color2/20 to-color1/10" />
      <GlowOrb className="bottom-0 -left-24 size-72 from-color1/15 to-color2/10" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-color2/20 bg-color2/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-color2">
            <Users className="size-3.5" />
            {t("parent.section.badge")}
          </span>
          <Heading className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("parent.section.title")}
          </Heading>
          <SubHeading className="mt-4 text-lg md:text-xl">
            {t("parent.section.description")}
          </SubHeading>
        </div>

        <PhysicsDivider />

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, key }, i) => (
            <div
              key={key}
              className={cn(
                "group rounded-2xl border border-color2/10 bg-background/60 p-5 backdrop-blur-sm",
                "transition-all duration-300 hover:-translate-y-1 hover:border-color2/30 hover:shadow-lg hover:shadow-color2/5"
              )}
              style={
                shouldReduceMotion
                  ? undefined
                  : { transitionDelay: `${i * 40}ms` }
              }
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-color1 to-color2 text-white shadow-md shadow-color2/20 transition-transform duration-300 group-hover:scale-110">
                <Icon className="size-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold">
                {t(`parent.section.items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`parent.section.items.${key}.description`)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link to="/parent">
            <FlowButton
              className="px-8 py-3 text-base"
              text={t("parent.section.cta")}
            />
          </Link>
        </div>
      </div>
    </section>
  );

  if (shouldReduceMotion) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {content}
    </motion.div>
  );
}

export default ParentFollowUpSection;
