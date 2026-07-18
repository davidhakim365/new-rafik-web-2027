import { useState, useEffect } from "react";
import { Menu as MenuIcon, X as XIcon, User, LogOut } from "lucide-react";
import { useScroll, motion, AnimatePresence } from "framer-motion";
import { cn, getFirstCharacters } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLogoutMutation } from "@/api/auth-api";
import { useGetProfile } from "@/generated/api";
import { useModalStore } from "@/store/use-modal-store";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { FlowButton } from "./ui/flow-button";
import { Heading } from "./ui/heading";
import { useLocation } from "react-router-dom";
import type { GetStudentProfileResult } from "@/generated/model";

interface NavBarProps {
  brand?: { name: string };
  links?: { href: string; label: string }[];
}

const NavBar: React.FC<NavBarProps> = ({
  brand = { name: "Newton's Academy" },
  links: propLinks,
}) => {
  const [menuState, setMenuState] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const logoutMutation = useLogoutMutation();
  const { data: profile } = useGetProfile();
  const { openModal } = useModalStore();
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<number | null>(null);
  const { pathname } = useLocation();

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


  const links = propLinks || [
    { href: "/", label: t("navbar.links.home") },
    { href: coursesHref, label: t("navbar.links.courses") },
    { href: "/payments", label: t("navbar.links.payments") },
    { href: "/parent", label: t("navbar.links.parent") },
  ];

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setScrolled(latest > 0.05);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const nav = document.querySelector('[data-state="active"]');
      if (nav && !nav.contains(event.target as Node)) {
        setMenuState(false);
      }
    };

    if (menuState) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [menuState]);

  return (
    <header>
      <nav
        data-state={menuState ? "active" : undefined}
        className="fixed z-50 w-full pt-2 text-navbar-foreground"
      >
        <div
          className={cn(
            "mx-auto max-w-7xl rounded-3xl px-3 sm:px-6 transition-all duration-300 lg:px-12",
            scrolled
              ? "bg-background/70 backdrop-blur-2xl border border-color2/10 shadow-lg shadow-color2/5"
              : "bg-transparent"
          )}
        >
          <motion.div
            className={cn(
              "relative flex items-center justify-between py-2 sm:py-3 duration-200 lg:py-6",
              scrolled && "lg:py-4"
            )}
          >
            <Link
              to="/"
              aria-label="home"
              className="relative z-30 flex items-center space-x-2"
            >
              <img
                src="/logo.png"
                alt="logo"
                className="h-8 w-8 flex-shrink-0 rounded-lg bg-background sm:h-10 sm:w-10"
              />
              <Heading className="text-lg font-bold truncate sm:text-xl md:text-2xl lg:text-3xl">
                {brand.name}
              </Heading>
            </Link>

            <div
              className="items-center hidden lg:flex"
              onMouseLeave={() => setSelectedTab(null)}
            >
              <ul className="flex items-center gap-6 text-sm xl:gap-8">
                {links.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      to={item.href}
                      className={cn(
                        "relative block px-3 py-2 duration-150 text-accent-foreground whitespace-nowrap",
                        (item.href === pathname ||
                          (item.href === "/parent" &&
                            pathname.startsWith("/parent"))) &&
                          "font-semibold"
                      )}
                      onMouseEnter={() => setSelectedTab(idx)}
                    >
                      <AnimatePresence>
                        {selectedTab === idx && (
                          <motion.span
                            exit={{
                              opacity: 0,
                              transition: { duration: 0.2 },
                            }}
                            layoutId="tab"
                            className={cn(
                              "absolute inset-0 rounded-lg bg-color2/10 dark:bg-color2/20",
                              scrolled && "bg-color2/15 dark:bg-color2/25"
                            )}
                            transition={{ duration: 0.2 }}
                          ></motion.span>
                        )}
                      </AnimatePresence>
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="items-center hidden gap-3 lg:flex xl:gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
              {profile?.data &&
              profile.data.$type === "GetStudentProfileResult" ? (
                <>
                  <div className="px-3 py-1.5 xl:px-4 xl:py-2 font-semibold rounded-full text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-900 text-sm whitespace-nowrap">
                    {profile.data.credits} {t("navbar.currency")} • {t(" ID :")} {profile.data.studentCode}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Avatar className="transition-all duration-200 cursor-pointer size-9 xl:size-10 ring-2 ring-neutral-500 text-navbar-foreground ring-offset-2 hover:ring-offset-4 dark:ring-offset-neutral-800">
                        <AvatarImage src={profile.data.profilePicture || ""} />
                        <AvatarFallback>
                          {getFirstCharacters(profile.data.fullName)}
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-2 mt-2 bg-white border shadow-lg rounded-xl dark:bg-neutral-800 dark:border-neutral-700">
                      <DropdownMenuLabel className="px-2 py-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                        {profile.data.email}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={() => openModal("profile-modal")}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700"
                        >
                          <User className="w-4 h-4 text-neutral-500" />{" "}
                          {t("navbar.profile")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => logoutMutation.mutate()}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 text-red-500"
                        >
                          <LogOut className="w-4 h-4" /> {t("navbar.logout")}
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Link to="/sign-in-sign-up">
                  <FlowButton
                    className="px-4 py-1.5 xl:px-6 xl:py-2 text-sm"
                    text={t("navbar.signIn")}
                  />
                </Link>
              )}
            </div>

            <button
              onClick={() => setMenuState(!menuState)}
              aria-label={menuState ? "Close Menu" : "Open Menu"}
              className="relative z-30 p-2 lg:hidden group"
            >
              <div className="relative w-6 h-6">
                <MenuIcon
                  className={cn(
                    "absolute inset-0 w-6 h-6 transition-all duration-300",
                    menuState
                      ? "rotate-180 scale-0 opacity-0"
                      : "rotate-0 scale-100 opacity-100"
                  )}
                />
                <XIcon
                  className={cn(
                    "absolute inset-0 w-6 h-6 transition-all duration-300",
                    menuState
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-180 scale-0 opacity-0"
                  )}
                />
              </div>
            </button>
          </motion.div>
        </div>

        <AnimatePresence>
          {menuState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden"
              style={{ top: 0 }}
              onClick={() => setMenuState(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {menuState && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed left-0 right-0 z-40 mx-3 top-16 sm:top-20 sm:mx-6 lg:hidden"
            >
              <div className="bg-background/95 backdrop-blur-xl rounded-2xl border shadow-2xl p-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="mb-6">
                  <ul className="space-y-4">
                    {links.map((item, idx) => (
                      <li key={idx}>
                        <Link
                          to={item.href}
                          className="block px-4 py-3 text-base font-medium transition-all duration-200 rounded-lg text-muted-foreground hover:text-accent-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          onClick={() => setMenuState(false)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <LanguageSwitcher />
                      <ThemeToggle />
                    </div>

                    {profile?.data &&
                    profile.data.$type === "GetStudentProfileResult" ? (
                      <>
                        <div className="flex justify-center">
                          <div className="px-4 py-2 text-sm font-semibold rounded-full text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-900">
                             {profile.data.credits} {t("navbar.currency")} • {t(" ID :")} {profile.data.studentCode}
                          </div>
                        </div>

                        <div className="flex flex-col items-center space-y-3">
                          <Avatar className="size-12 ring-2 ring-neutral-500 ring-offset-2 dark:ring-offset-neutral-800">
                            <AvatarImage
                              src={profile.data.profilePicture || ""}
                            />
                            <AvatarFallback>
                              {getFirstCharacters(profile.data.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm text-center text-neutral-500 dark:text-neutral-400">
                            {profile.data.email}
                          </p>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => {
                              openModal("profile-modal");
                              setMenuState(false);
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-3 transition-colors duration-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <User className="w-4 h-4 text-neutral-500" />
                            <span>{t("navbar.profile")}</span>
                          </button>
                          <button
                            onClick={() => {
                              logoutMutation.mutate();
                              setMenuState(false);
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-3 text-red-500 transition-colors duration-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>{t("navbar.logout")}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-center">
                        <Link
                          to="/sign-in-sign-up"
                          onClick={() => setMenuState(false)}
                        >
                          <FlowButton
                            className="px-8 py-2.5 text-base"
                            text={t("navbar.signIn")}
                          />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default NavBar;
