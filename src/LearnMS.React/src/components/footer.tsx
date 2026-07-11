import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FaFacebook, FaTiktok, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetProfile } from "@/generated/api";
import type { GetStudentProfileResult } from "@/generated/model";
import { Heading } from "./ui/heading";
import { Atom } from "lucide-react";

const Footer = () => {
  const { t } = useTranslation();
  const { data: profile } = useGetProfile();

  const socialLinks = [
    {
      icon: FaFacebook,
      href: "https://www.facebook.com/people/Newtons-Academy-Mr-Rafik-Isaac/100064151013051",
      hoverColor: "hover:bg-blue-600 hover:text-white",
      label: t("footer.social.facebook"),
    },
    {
      icon: FaYoutube,
      href: "https://www.youtube.com/@newtonacademy9097",
      hoverColor: "hover:bg-red-600 hover:text-white",
      label: t("footer.social.youtube"),
    },
    {
      icon: FaWhatsapp,
      href: "https://wa.me/1222343492",
      hoverColor: "hover:bg-green-600 hover:text-white",
      label: t("footer.social.whatsapp"),
    },
    {
      icon: FaTiktok,
      href: "https://www.tiktok.com/@mr.rafik.isaac",
      hoverColor: "hover:bg-neutral-800 hover:text-white dark:hover:bg-white dark:hover:text-black",
      label: t("footer.social.tiktok"),
    },
  ];

  const coursesHref = (() => {
    const isStudent = profile?.data && profile.data.$type === "GetStudentProfileResult";
    if (!isStudent) return "/sign-in-sign-up";
    const level = (profile!.data as GetStudentProfileResult).level;
    if (level) {
      const match = /Level(\d+)/.exec(level);
      if (match && match[1] !== undefined) {
        return `/courses/levels/${match[1]}`;
      }
    }
    return "/courses";
  })();

  const navLinks = [
    { title: t("footer.links.home"), href: "/" },
    { title: t("footer.links.courses"), href: coursesHref },
    { title: t("footer.links.payments"), href: "/payments" },
  ];

  return (
    <div className="bg-footer">
      <footer className="relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center border-t border-white/10 px-6 py-16 lg:py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-96 rounded-full bg-color2/10 blur-3xl" />
        </div>

        <div className="relative z-10 grid w-full gap-10 xl:grid-cols-3 xl:gap-8">
          <AnimatedContainer className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-color1 to-color2">
                <Atom className="size-5 text-white" />
              </div>
              <Heading className="text-2xl font-bold md:text-3xl text-white">
                {t("footer.brand")}
              </Heading>
            </div>
            <p className="text-sm text-center text-footer-foreground max-w-xs">
              {t("footer.tagline")}
            </p>
          </AnimatedContainer>

          <AnimatedContainer delay={0.1} className="flex flex-col items-center">
            <ul className="flex flex-wrap justify-center gap-6 my-4 text-sm">
              {navLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-footer-foreground hover:text-white transition-colors duration-200"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </AnimatedContainer>

          <AnimatedContainer delay={0.2} className="flex flex-col items-center">
            <ul className="flex flex-wrap justify-center gap-3 my-4">
              {socialLinks.map((social, index) => (
                <li key={index}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`inline-flex items-center justify-center size-10 rounded-full bg-white/10 text-footer-foreground transition-all duration-200 ${social.hoverColor}`}
                  >
                    <social.icon className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          </AnimatedContainer>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-2 mt-10 pt-8 border-t border-white/10 w-full">
          <span className="block text-sm text-center text-footer-foreground">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </span>
        </div>
      </footer>
    </div>
  );
};

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>["className"];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default Footer;
