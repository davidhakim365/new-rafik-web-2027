import { useState, useEffect } from "react";
import { ArrowLeft, GraduationCap } from "lucide-react";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import { useGetProfile } from "@/generated/api";
import LoadingPage from "@/pages/shared/loading-page";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import PlatformInstructionsModal from "@/components/modals/platform-instructions-modal";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import Lottie from "lottie-react";
import authAnimation from "@/assets/auth-anim.json";
import { motion, AnimatePresence } from "framer-motion";
import GradientBackground from "@/components/ui/gradient-background";
import { BlurryBackground } from "@/components/ui/blurry-background";

const SignInSignUpPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [hasAcceptedInstructions, setHasAcceptedInstructions] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { data: profile, isFetching: profileFetching } = useGetProfile();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const pageVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.3,
      },
    },
    exit: { opacity: 0 },
  };

  const sectionVariants = {
    initial: {
      opacity: 0,
      x: isRTL ? "50%" : "-50%",
      filter: "blur(10px)",
    },
    animate: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      x: isRTL ? "-50%" : "50%",
      filter: "blur(10px)",
    },
  };

  const rightSectionVariants = {
    initial: {
      opacity: 0,
      x: isRTL ? "-50%" : "50%",
      filter: "blur(10px)",
    },
    animate: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      x: isRTL ? "50%" : "-50%",
      filter: "blur(10px)",
    },
  };

  const containerVariants = {
    initial: { opacity: 1 },
    animate: {
      opacity: 1,
      transition: {
        delayChildren: 1.0,
        staggerChildren: 0.4,
      },
    },
  };

  const switchingContainerVariants = {
    initial: { opacity: 1 },
    animate: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.15,
      },
    },
    exit: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const childVariants = {
    initial: {
      opacity: 0,
      x: isRTL ? -200 : 200,
      filter: "blur(15px)",
    },
    animate: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      x: isRTL ? 200 : -200,
      filter: "blur(15px)",
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const formSwitchVariants = {
    initial: {
      opacity: 0,
      x: isRTL ? -150 : 150,
      filter: "blur(10px)",
    },
    animate: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      x: isRTL ? 150 : -150,
      filter: "blur(10px)",
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  useEffect(() => {
    const instructionsAccepted = localStorage.getItem(
      "platformInstructionsAccepted"
    );
    if (!instructionsAccepted) {
      setShowInstructionsModal(true);
    } else {
      setHasAcceptedInstructions(true);
    }

    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleViewSwitch = (newView: boolean) => {
    setIsLoginView(newView);
  };

  const handleAcceptInstructions = () => {
    localStorage.setItem("platformInstructionsAccepted", "true");
    setHasAcceptedInstructions(true);
  };

  if (profileFetching) {
    return <LoadingPage />;
  }

  if (profile?.data) {
    return (
      <Navigate
        to={
          profile.data.$type !== "GetStudentProfileResult" ? "/dashboard" : "/"
        }
      />
    );
  }

  if (!hasAcceptedInstructions) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-neutral-600 via-neutral-700 to-neutral-800">
          <div className="max-w-md mx-auto text-center text-white">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 md:w-16 md:h-16" />
            <h1 className="mb-2 text-xl font-bold md:text-2xl">
              {t("auth.brand")}
            </h1>
            <p className="mb-4 text-sm opacity-75 md:text-base">
              {t("platformInstructions.subtitle")}
            </p>
            <Button
              className="w-full mt-4 md:w-auto"
              onClick={() => setShowInstructionsModal(true)}
            >
              Please read the platform instructions
            </Button>
          </div>
        </div>
        <PlatformInstructionsModal
          isOpen={showInstructionsModal}
          onClose={() => setShowInstructionsModal(false)}
          onAccept={handleAcceptInstructions}
        />
      </>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
      className="flex flex-col min-h-screen overflow-hidden md:flex-row bg-neutral-100"
    >
      <motion.div
        variants={sectionVariants}
        className="relative flex flex-col justify-center w-full min-h-[50vh] md:min-h-screen p-4 overflow-hidden text-white md:w-5/12 lg:w-5/12 bg-gradient-to-br from-neutral-600 via-neutral-700 to-neutral-800 md:p-12"
      >
        <GradientBackground />

        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-neutral-500 mix-blend-multiply filter blur-xl opacity-70 z-[1]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 z-[1]" />
        <div className="absolute bottom-0 w-64 h-64 bg-purple-500 rounded-full left-20 mix-blend-multiply filter blur-xl opacity-70 z-[1]" />

        <Button
          variant="link"
          className={cn(
            "absolute z-50 text-white group hover:text-neutral-200 top-3 md:top-4 p-2 md:p-3 min-h-[44px] min-w-[44px] flex items-center justify-center md:justify-start text-sm md:text-base rounded-lg hover:bg-white/10 transition-colors touch-manipulation",
            i18n.language === "ar" ? "right-3 md:right-4" : "left-3 md:left-4"
          )}
          onClick={() => navigate("/")}
          style={{ pointerEvents: "auto" }}
        >
          <ArrowLeft
            className={cn(
              "transition-transform size-4 md:size-5 group-hover:-translate-x-1 pointer-events-none",
              i18n.language === "ar"
                ? "ml-0 md:ml-1.5 rotate-180"
                : "mr-0 md:mr-1.5"
            )}
          />
          <span className="hidden pointer-events-none md:inline">
            {t("auth.back")}
          </span>
        </Button>

        <LanguageSwitcher
          className={cn(
            "absolute z-50 top-3 md:top-4 bg-white/10 border-white/20 text-white touch-manipulation",
            i18n.language === "ar" ? "left-3 md:left-4" : "right-3 md:right-4"
          )}
        />

        <motion.div
          className="relative z-20 px-2 text-center md:px-0"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={childVariants}>
            <Lottie
              animationData={authAnimation}
              className="w-64 h-64 mx-auto mb-2"
            />
          </motion.div>

          <motion.div
            variants={childVariants}
            className="flex items-center justify-center mb-4 md:mb-6"
          >
            <GraduationCap
              className={cn(
                "w-8 h-8 md:w-10 md:h-10",
                i18n.language === "ar" ? "ml-2 md:ml-3" : "mr-2 md:mr-3"
              )}
            />
            <h1 className="text-xl font-bold md:text-2xl">{t("auth.brand")}</h1>
          </motion.div>

          <motion.h2
            variants={childVariants}
            className="mb-4 text-2xl font-bold leading-tight md:mb-6 md:text-4xl lg:text-5xl"
          >
            {isLoginView ? t("auth.welcomeBack") : t("auth.joinCommunity")}
          </motion.h2>
        </motion.div>
      </motion.div>

      <motion.div
        variants={rightSectionVariants}
        className="relative flex items-center justify-center w-full p-4 overflow-hidden bg-white md:p-6 lg:p-10 dark:bg-neutral-900 md:w-7/12 lg:w-7/12"
      >
        <BlurryBackground />

        <AnimatePresence mode="wait">
          <motion.div
            key={isLoginView ? "login-container" : "register-container"}
            className="w-full max-w-md"
            variants={
              isInitialLoad ? containerVariants : switchingContainerVariants
            }
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <motion.h3
              variants={isInitialLoad ? childVariants : formSwitchVariants}
              className="mb-2 text-xl font-bold text-center md:text-2xl text-neutral-800 dark:text-white"
            >
              {isLoginView
                ? t("auth.signInTitle")
                : t("auth.createAccountTitle")}
            </motion.h3>

            <motion.p
              variants={isInitialLoad ? childVariants : formSwitchVariants}
              className="mb-6 text-sm text-center md:text-base md:mb-8 text-neutral-600 dark:text-neutral-400"
            >
              {isLoginView
                ? t("auth.signInSubtitle")
                : t("auth.createAccountSubtitle")}
            </motion.p>

            <motion.div
              variants={isInitialLoad ? childVariants : formSwitchVariants}
            >
              {isLoginView ? (
                <LoginForm key="login" />
              ) : (
                <RegisterForm
                  key="register"
                  setIsLoginView={handleViewSwitch}
                />
              )}
            </motion.div>

            <motion.div
              variants={isInitialLoad ? childVariants : formSwitchVariants}
              className="mt-6 text-sm font-medium text-center md:mt-8 text-neutral-600 dark:text-neutral-400"
            >
              {isLoginView ? (
                <span>
                  {t("auth.noAccount")}&nbsp;
                  <Button
                    variant="link"
                    type="button"
                    onClick={() => handleViewSwitch(false)}
                    className="pl-1 text-sm md:text-base"
                  >
                    {t("auth.createAccount")}
                  </Button>
                </span>
              ) : (
                <span>
                  {t("auth.haveAccount")}&nbsp;
                  <Button
                    variant="link"
                    type="button"
                    onClick={() => handleViewSwitch(true)}
                    className="pl-1 text-sm md:text-base"
                  >
                    {t("auth.signIn")}
                  </Button>
                </span>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SignInSignUpPage;
