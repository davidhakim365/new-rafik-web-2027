import { useGetImportantLectures, useGetLatestLectures } from "@/generated/api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { BookOpen, Brain, Users } from "lucide-react";
import { LectureItem, StudentLevel } from "@/generated/model";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useState, useMemo, useEffect } from "react";
import { useCoursesQuery } from "@/api/courses-api";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BlurryBackground } from "@/components/ui/blurry-background";
import { Heading } from "../ui/heading";
import { SubHeading } from "../ui/sub-heading";
import { Link } from "react-router-dom";
import { FlowButton } from "../ui/flow-button";

const ITEMS_PER_PAGE = 6;

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

const cardItemVariants = {
  hidden: { opacity: 0, filter: "blur(20px)", scale: 0, y: 300 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 0.9,
    },
  },
};

const ImportantLecturesSection = () => {
  const { data: lectures } = useGetImportantLectures();
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const paginatedLectures = useMemo(() => {
    if (!lectures?.data) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return lectures.data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [lectures, currentPage]);

  const totalPages = Math.ceil((lectures?.data?.length || 0) / ITEMS_PER_PAGE);
  const totalItems = lectures?.data?.length || 0;

  const getPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            isActive={i === currentPage}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(i);
            }}
            className={
              i === currentPage
                ? "bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white hover:bg-emerald-600 dark:hover:bg-emerald-700"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (startPage > 1) {
      items.unshift(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis className="text-zinc-700 dark:text-zinc-300" />
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      items.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis className="text-zinc-700 dark:text-zinc-300" />
        </PaginationItem>
      );
    }

    return items;
  };

  const importantLecturesGradientColors = {
    from: "oklch(0.75 0.1 270)",
    to: "oklch(0.55 0.15 290)",
  };

  if (shouldReduceMotion) {
    return (
      <section className="relative py-24 bg-zinc-100 dark:bg-zinc-950">
        <BlurryBackground
          gradientColors={importantLecturesGradientColors}
          className="absolute inset-0 z-0"
        />
        <div className="container relative z-10 px-4 mx-auto max-w-7xl">
          <div className="relative max-w-2xl mx-auto mb-16 text-center">
            <Badge className="px-4 py-1 mb-10 text-sm font-medium text-zinc-700 bg-zinc-100 border-zinc-200 hover:bg-zinc-200 dark:text-zinc-200 dark:bg-zinc-700 dark:border-zinc-600 dark:hover:bg-zinc-600">
              {t("importantLectures.badge")}
            </Badge>
            <Heading className="text-3xl font-bold tracking-wide text-balance md:text-4xl lg:text-5xl">
              {t("importantLectures.title")}
            </Heading>
            <SubHeading className="mt-4 text-lg tracking-wide text-balance md:text-xl">
              {t("importantLectures.description")}
            </SubHeading>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {paginatedLectures.map((lecture) => (
              <FeaturedLecture key={lecture.id} lecture={lecture} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <p className="hidden text-sm font-medium text-zinc-700 md:block dark:text-zinc-300">
                {t("latestLectures.pagination.showing")} {currentPage}{" "}
                {t("latestLectures.pagination.of")} {totalPages} /{" "}
                {t("latestLectures.pagination.totalResults")}: {totalItems}
              </p>
              <PaginationContent>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
                {getPaginationItems()}
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationContent>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="relative py-24 bg-zinc-100 dark:bg-zinc-950"
    >
      <BlurryBackground
        gradientColors={importantLecturesGradientColors}
        className="absolute inset-0 z-0"
      />
      <div className="container relative z-10 px-4 mx-auto max-w-7xl">
        <motion.div
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2,
              },
            },
          }}
          className="relative max-w-2xl mx-auto mb-16 text-center"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[100%] bg-emerald-300 rounded-full blur-[80px] opacity-20 pointer-events-none" />

          <motion.div variants={leftToRightVariants} className="mb-10">
            <Badge className="px-4 py-1 text-sm font-medium text-zinc-700 bg-zinc-100 border-zinc-200 hover:bg-zinc-200 dark:text-zinc-200 dark:bg-zinc-700 dark:border-zinc-600 dark:hover:bg-zinc-600">
              {t("importantLectures.badge")}
            </Badge>
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <Heading className="text-3xl font-bold tracking-wide text-balance md:text-4xl lg:text-5xl">
              {t("importantLectures.title")}
            </Heading>
          </motion.div>
          <motion.div variants={leftToRightVariants}>
            <SubHeading className="mt-4 text-lg tracking-wide text-balance md:text-xl">
              {t("importantLectures.description")}
            </SubHeading>
          </motion.div>
        </motion.div>

        <motion.div
          key={currentPage}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.4,
              },
            },
          }}
          initial="hidden"
          whileInView="visible" // Add whileInView here for the container
          viewport={{ once: true, amount: 0.2 }} // Ensure viewport prop is here
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {paginatedLectures.map((lecture) => (
            <motion.div key={lecture.id} variants={cardItemVariants}>
              <FeaturedLecture lecture={lecture} />
            </motion.div>
          ))}
        </motion.div>

        {totalPages > 1 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={cardItemVariants}
          >
            <Pagination className="container flex items-center justify-between mt-8">
              <p className="hidden text-sm font-medium text-zinc-700 md:block dark:text-zinc-300">
                {t("latestLectures.pagination.showing")} {currentPage}{" "}
                {t("latestLectures.pagination.of")} {totalPages} /{" "}
                {t("latestLectures.pagination.totalResults")}: {totalItems}
              </p>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((prev) => Math.max(prev - 1, 1));
                    }}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                {getPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    }}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};

const LatestLecturesSection = () => {
  const [level, setLevel] = useState<StudentLevel | undefined>();
  const [courseId, setCourseId] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const { data: coursesData } = useCoursesQuery();

  const courses =
    coursesData?.data.items.filter((item) => item.level === level) ?? [];

  const { data: lectures } = useGetLatestLectures({
    courseId,
    studentLevel: level,
  });

  const paginatedLectures = useMemo(() => {
    if (!lectures?.data) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return lectures.data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [lectures, currentPage]);

  const totalPages = Math.ceil((lectures?.data?.length || 0) / ITEMS_PER_PAGE);
  const totalItems = lectures?.data?.length || 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [level, courseId, lectures]);

  const getPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            isActive={i === currentPage}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(i);
            }}
            className={
              i === currentPage
                ? "bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white hover:bg-emerald-600 dark:hover:bg-emerald-700"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (startPage > 1) {
      items.unshift(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis className="text-zinc-700 dark:text-zinc-300" />
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      items.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis className="text-zinc-700 dark:text-zinc-300" />
        </PaginationItem>
      );
    }

    return items;
  };

  const latestLecturesGradientColors = {
    from: "oklch(0.75 0.1 120)",
    to: "oklch(0.55 0.15 90)",
  };

  if (shouldReduceMotion) {
    return (
      <section className="relative py-24 bg-zinc-100 dark:bg-zinc-950">
        <BlurryBackground
          gradientColors={latestLecturesGradientColors}
          className="absolute inset-0 z-0"
        />
        <div className="container relative z-10 px-4 mx-auto max-w-7xl">
          <div className="relative max-w-2xl mx-auto mb-16 text-center">
            <Badge className="px-4 py-1 mb-10 text-sm font-medium text-zinc-700 bg-emerald-100 border-emerald-200 hover:bg-emerald-200 dark:text-zinc-200 dark:bg-emerald-700 dark:border-emerald-600 dark:hover:bg-emerald-600">
              {t("latestLectures.badge")}
            </Badge>
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-5xl">
              {t("latestLectures.title")}
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              {t("latestLectures.description")}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 mb-16 md:flex-row">
            <Select
              value={level ?? "ALL"}
              onValueChange={(value) => {
                setLevel(value === "ALL" ? undefined : (value as StudentLevel));
                setCourseId(undefined);
              }}
            >
              <SelectTrigger className="w-[180px] bg-zinc-200 dark:bg-zinc-800 dark:border-zinc-900">
                <SelectValue placeholder={t("latestLectures.selectLevel")} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-200 dark:bg-zinc-700 dark:border-zinc-800">
                <SelectGroup>
                  <SelectLabel>Levels</SelectLabel>
                  <SelectItem value="ALL">
                    {t("latestLectures.levels.all")}
                  </SelectItem>
                  <SelectItem value="Level0">
                    {t("latestLectures.levels.level0")}
                  </SelectItem>
                  <SelectItem value="Level1">
                    {t("latestLectures.levels.level1")}
                  </SelectItem>
                  <SelectItem value="Level2">
                    {t("latestLectures.levels.level2")}
                  </SelectItem>
                  <SelectItem value="Level3">
                    {t("latestLectures.levels.level3")}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {level && (
              <Select
                value={courseId}
                onValueChange={(value) => {
                  setCourseId(value);
                }}
              >
                <SelectTrigger className="w-[300px] bg-zinc-100 dark:bg-zinc-700 dark:border-zinc-600">
                  <SelectValue placeholder={t("latestLectures.selectCourse")} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-100 dark:bg-zinc-700 dark:border-zinc-600">
                  <SelectGroup>
                    <SelectLabel>Courses</SelectLabel>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {paginatedLectures.map((lecture) => (
              <FeaturedLecture key={lecture.id} lecture={lecture} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <p className="hidden text-sm font-medium text-zinc-700 md:block dark:text-zinc-300">
                {t("latestLectures.pagination.showing")} {currentPage}{" "}
                {t("latestLectures.pagination.of")} {totalPages} /{" "}
                {t("latestLectures.pagination.totalResults")}: {totalItems}
              </p>
              <PaginationContent>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
                {getPaginationItems()}
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationContent>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="relative py-24 bg-zinc-100 dark:bg-zinc-950"
    >
      <BlurryBackground
        gradientColors={latestLecturesGradientColors}
        className="absolute inset-0 z-0"
      />
      <div className="container relative z-10 px-4 mx-auto max-w-7xl">
        <motion.div
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2,
              },
            },
          }}
          className="relative max-w-2xl mx-auto mb-16 text-center"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[100%] bg-emerald-300 rounded-full blur-[80px] opacity-20 pointer-events-none" />
          <motion.div variants={leftToRightVariants} className="mb-10">
            <Badge className="px-4 py-1 text-sm font-medium text-zinc-700 bg-emerald-100 border-emerald-200 hover:bg-emerald-200 dark:text-zinc-200 dark:bg-emerald-700 dark:border-emerald-600 dark:hover:bg-emerald-600">
              {t("latestLectures.badge")}
            </Badge>
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <Heading className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-5xl">
              {t("latestLectures.title")}
            </Heading>
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <SubHeading className="text-lg text-zinc-600 dark:text-zinc-400">
              {t("latestLectures.description")}
            </SubHeading>
          </motion.div>
        </motion.div>

        <motion.div
          variants={leftToRightVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-col items-center justify-center gap-4 mb-16 md:flex-row"
        >
          <Select
            value={level ?? "ALL"}
            onValueChange={(value) => {
              setLevel(value === "ALL" ? undefined : (value as StudentLevel));
              setCourseId(undefined);
            }}
          >
            <SelectTrigger className="w-[180px] bg-zinc-200 dark:bg-zinc-800 dark:border-zinc-900">
              <SelectValue placeholder={t("latestLectures.selectLevel")} />
            </SelectTrigger>
            <SelectContent className="bg-zinc-200 dark:bg-zinc-700 dark:border-zinc-800">
              <SelectGroup>
                <SelectLabel>Levels</SelectLabel>
                <SelectItem value="ALL">
                  {t("latestLectures.levels.all")}
                </SelectItem>
                <SelectItem value="Level0">
                  {t("latestLectures.levels.level0")}
                </SelectItem>
                <SelectItem value="Level1">
                  {t("latestLectures.levels.level1")}
                </SelectItem>
                <SelectItem value="Level2">
                  {t("latestLectures.levels.level2")}
                </SelectItem>
                <SelectItem value="Level3">
                  {t("latestLectures.levels.level3")}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {level && (
            <Select
              value={courseId}
              onValueChange={(value) => {
                setCourseId(value);
              }}
            >
              <SelectTrigger className="w-[300px] bg-zinc-100 dark:bg-zinc-700 dark:border-zinc-600">
                <SelectValue placeholder={t("latestLectures.selectCourse")} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-100 dark:bg-zinc-700 dark:border-zinc-600">
                <SelectGroup>
                  <SelectLabel>Courses</SelectLabel>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </motion.div>

        <motion.div
          key={currentPage}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.4,
              },
            },
          }}
          initial="hidden"
          whileInView="visible" // Add whileInView here for the container
          viewport={{ once: true, amount: 0.2 }} // Ensure viewport prop is here
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {paginatedLectures.map((lecture) => (
            <motion.div key={lecture.id} variants={cardItemVariants}>
              <FeaturedLecture lecture={lecture} />
            </motion.div>
          ))}
        </motion.div>

        {totalPages > 1 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardItemVariants}
          >
            <Pagination className="container flex items-center justify-between mt-8">
              <p className="hidden text-sm font-medium text-zinc-700 md:block dark:text-zinc-300">
                {t("latestLectures.pagination.showing")} {currentPage}{" "}
                {t("latestLectures.pagination.of")} {totalPages} /{" "}
                {t("latestLectures.pagination.totalResults")}: {totalItems}
              </p>
              <PaginationContent>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
                {getPaginationItems()}
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationContent>
            </Pagination>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};

function FeaturedLecture(props: { lecture: LectureItem }) {
  const { t } = useTranslation();

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card className="relative overflow-hidden transition-all duration-300 bg-white border-none shadow-lg dark:bg-zinc-900 rounded-2xl hover:shadow-2xl hover:-translate-y-2 group">
        <div className="relative overflow-hidden h-52">
          <img
            src={
              props.lecture.imageUrl ||
              "https://placehold.co/600x400/000000/FFFFFF?text=Lecture+Image"
            }
            alt={props.lecture.title}
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/600x400/000000/FFFFFF?text=Image+Error";
            }}
          />
          <div className="absolute inset-0 transition-opacity duration-300 bg-gradient-to-t from-black/50 to-transparent opacity-20 group-hover:opacity-40" />
          <div className="absolute transition-opacity duration-300 opacity-0 top-3 right-3 group-hover:opacity-100">
            <Badge className="px-2 py-1 text-xs font-medium text-white bg-emerald-600">
              {t("importantLectures.featured")}
            </Badge>
          </div>
        </div>

        <CardHeader className="px-6 pt-5 pb-3">
          <h3 className="text-xl font-semibold transition-colors duration-300 text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-2">
            {props.lecture.title}
          </h3>
          <span className="inline-block px-3 py-1 mt-2 text-sm font-medium rounded-full text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300">
            {props.lecture.courseTitle}
          </span>
        </CardHeader>

        <CardContent className="px-6 py-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 transition-colors duration-300 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700/50">
              <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Students
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {props.lecture.enrollmentsCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 transition-colors duration-300 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700/50">
              <BookOpen className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Lessons
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {props.lecture.lessonsCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 transition-colors duration-300 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700/50">
              <Brain className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Quizzes
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {props.lecture.quizzesCount}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-center">
          <Link to={`/courses/${props.lecture.courseId}`}>
            <FlowButton text={t("importantLectures.goToCourse")} />
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export { ImportantLecturesSection, LatestLecturesSection };
