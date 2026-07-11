import { DataTable } from "@/components/data-table";
import Loading from "@/components/loading/loading";
import { Input } from "@/components/ui/input";
import { useGetExamStudents } from "@/generated/api";
import { examStudentsColumns } from "@/pages/dashboard/exams/columns";
import { PaginationState } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const ExamStudentsPage = () => {
  const { examId, courseId } = useParams();

  const [searchParams, setSearchParams] = useSearchParams();
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: Number(searchParams.get("page") ?? 1) - 1,
    pageSize: Number(searchParams.get("pageSize") ?? 10),
  });

  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearchParams({
      page: `${pageIndex + 1}`,
      pageSize: `${pageSize}`,
      ...(search ? { search } : {}),
    });
  }, [pageIndex, search, pageSize]);

  const { data, isLoading } = useGetExamStudents(courseId!, examId!, {
    page: pageIndex + 1,
    pageSize: pageSize,
    search,
  });
  return (
    <div className='w-full h-full'>
      <h1 className='text-3xl font-bold text-center text-primary/50'>
        Students
      </h1>
      {isLoading ? (
        <Loading />
      ) : (
        <div className='relative p-4'>
          <Input
            className='absolute top-6 left-4 w-fit'
            placeholder='Search students'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <DataTable
            columns={examStudentsColumns}
            setPagination={setPagination}
            pagination={{
              pageCount: data?.data?.pageSize!,
              pageIndex,
              pageSize,
              hasNextPage: data?.data?.hasNextPage!,
              hasPreviousPage: data?.data?.hasPreviousPage!,
            }}
            data={data?.data!.items!}
          />
        </div>
      )}
    </div>
  );
};

export default ExamStudentsPage;
