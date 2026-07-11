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
import { PhysicsGrid, GlowOrb } from "@/components/ui/physics-graphics";
import { Heading } from "../ui/heading";
import { SubHeading } from "../ui/sub-heading";
import { Link } from "react-router-dom";
import { FlowButton } from "../ui/flow-button";

const ITEMS_PER_PAGE = 6;

const leftToRightVariants = {
  hidden: { opacity: 0, filter: "blur(20px)", y: 40 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
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
                ? "bg-color2 text-white hover:bg-color2/90"
                : "text-paragraph hover:bg-color2/10"
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
          <PaginationEllipsis className="text-paragraph" />
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      items.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis className="text-paragraph" />
        </PaginationItem>
      );
    }

    return items;
  };

  if (shouldReduceMotion) {
    return (
      <section className="relative py-24 bg-lecturesSection overflow-hidden">
        <PhysicsGrid className="opacity-40" />
        <GlowOrb className="top-0 -left-32 size-96 from-color2/15 to-color1/10" />
        <div className="container relative z-10 px-4 mx-auto max-w-7xl">
          <div className="relative max-w-2xl mx-auto mb-16 text-center">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full bg-color2/10 text-color2 border border-color2/20">
              {t("importantLectures.badge")}
            </span>
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
              <p className="hidden text-sm font-medium text-paragraph md:block">
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
      className="relative py-24 bg-lecturesSection overflow-hidden"
    >
      <PhysicsGrid className="opacity-40" />
      <GlowOrb className="top-0 -left-32 size-96 from-color2/15 to-color1/10" />
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
          <motion.div variants={leftToRightVariants} className="mb-4">
            <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase rounded-full bg-color2/10 text-color2 border border-color2/20">
              {t("importantLectures.badge")}
            </span>
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
              <p className="hidden text-sm font-medium text-paragraph md:block">
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
                ? "bg-color2 text-white hover:bg-color2/90"
                : "text-paragraph hover:bg-color2/10"
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
          <PaginationEllipsis className="text-paragraph" />
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      items.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis className="text-paragraph" />
        </PaginationItem>
      );
    }

    return items;
  };

  if (shouldReduceMotion) {
    return (
      <section className="relative py-24 bg-lecturesSection overflow-hidden">
        <PhysicsGrid className="opacity-40" />
        <GlowOrb className="bottom-0 -right-32 size-80 from-color1/15 to-color2/10" />
        <div className="container relative z-10 px-4 mx-auto max-w-7xl">
          <div className="relative max-w-2xl mx-auto mb-16 text-center">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full bg-color2/10 text-color2 border border-color2/20">
              {t("latestLectures.badge")}
            </span>
            <Heading className="text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
              {t("latestLectures.title")}
            </Heading>
            <SubHeading className="mt-4 text-lg tracking-wide text-balance md:text-xl">
              {t("latestLectures.description")}
            </SubHeading>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 mb-16 md:flex-row">
            <Select
              value={level ?? "ALL"}
              onValueChange={(value) => {
                setLevel(value === "ALL" ? undefined : (value as StudentLevel));
                setCourseId(undefined);
              }}
            >
              <SelectTrigger className="w-[180px] bg-background/80 border border-color2/10">
                <SelectValue placeholder={t("latestLectures.selectLevel")} />
              </SelectTrigger>
              <SelectContent className="bg-background border border-color2/10">
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
                <SelectTrigger className="w-[300px] bg-background/80 border border-color2/10">
                  <SelectValue placeholder={t("latestLectures.selectCourse")} />
                </SelectTrigger>
                <SelectContent className="bg-background border border-color2/10">
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
              <p className="hidden text-sm font-medium text-paragraph md:block">
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
      className="relative py-24 bg-lecturesSection overflow-hidden"
    >
      <PhysicsGrid className="opacity-40" />
      <GlowOrb className="bottom-0 -right-32 size-80 from-color1/15 to-color2/10" />
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
          <motion.div variants={leftToRightVariants} className="mb-4">
            <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase rounded-full bg-color2/10 text-color2 border border-color2/20">
              {t("latestLectures.badge")}
            </span>
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <Heading className="text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
              {t("latestLectures.title")}
            </Heading>
          </motion.div>

          <motion.div variants={leftToRightVariants}>
            <SubHeading className="mt-4 text-lg tracking-wide text-balance md:text-xl">
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
            <SelectTrigger className="w-[180px] bg-background/80 border border-color2/10">
              <SelectValue placeholder={t("latestLectures.selectLevel")} />
            </SelectTrigger>
            <SelectContent className="bg-background border border-color2/10">
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
              <SelectTrigger className="w-[300px] bg-background/80 border border-color2/10">
                <SelectValue placeholder={t("latestLectures.selectCourse")} />
              </SelectTrigger>
              <SelectContent className="bg-background border border-color2/10">
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
              <p className="hidden text-sm font-medium text-paragraph md:block">
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
      <Card className="relative overflow-hidden transition-all duration-300 bg-background/80 backdrop-blur-sm border border-color2/10 rounded-2xl hover:border-color2/30 hover:shadow-xl hover:shadow-color2/5 hover:-translate-y-2 group">
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
            <Badge className="px-2 py-1 text-xs font-medium text-white bg-color2">
              {t("importantLectures.featured")}
            </Badge>
          </div>
        </div>

        <CardHeader className="px-6 pt-5 pb-3">
          <h3 className="text-xl font-semibold transition-colors duration-300 text-heading group-hover:text-color2 line-clamp-2">
            {props.lecture.title}
          </h3>
          <span className="inline-block px-3 py-1 mt-2 text-sm font-medium rounded-full text-paragraph bg-color2/10">
            {props.lecture.courseTitle}
          </span>
        </CardHeader>

        <CardContent className="px-6 py-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 transition-colors duration-300 rounded-lg bg-color2/5 group-hover:bg-color2/10">
              <Users className="w-5 h-5 text-color1" />
              <div>
                <p className="text-xs font-medium text-paragraph">
                  Students
                </p>
                <p className="text-sm font-semibold text-heading">
                  {props.lecture.enrollmentsCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 transition-colors duration-300 rounded-lg bg-color2/5 group-hover:bg-color2/10">
              <BookOpen className="w-5 h-5 text-color2" />
              <div>
                <p className="text-xs font-medium text-paragraph">
                  Lessons
                </p>
                <p className="text-sm font-semibold text-heading">
                  {props.lecture.lessonsCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 transition-colors duration-300 rounded-lg bg-color2/5 group-hover:bg-color2/10">
              <Brain className="w-5 h-5 text-color1" />
              <div>
                <p className="text-xs font-medium text-paragraph">
                  Quizzes
                </p>
                <p className="text-sm font-semibold text-heading">
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
