import { useAllQuestionsQuery } from "@/api/questions-api";
import { DataTable } from "@/components/data-table";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { questionsColumns } from "@/pages/dashboard/questions/columns";
import { useQuestionsStore } from "@/store/use-questions-store";
import { PaginationState, RowSelectionState } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useState } from "react";

const QuestionsList = () => {
  const { addQuestions } = useQuestionsStore();
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [search, setSearch] = useState("");

  const { data: questions, isLoading } = useAllQuestionsQuery({
    page: pageIndex + 1,
    pageSize,
    search,
  });

  const onQuestionSelected = () => {
    var ids = Object.entries(selection)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);

    var selected =
      questions!.data.items?.filter((q) => ids.includes(q.id)) ?? [];
    addQuestions(selected);
    setSelection({});
  };

  return (
      <div className='relative flex flex-col items-start p-4 w-full  h-[70vh]'>
      <Input
        className=' top-6 w-[20%]'
        placeholder='Search'
        onChange={(e) => setSearch(e.target.value)}
        value={search}
      />

      {selection && Object.keys(selection).length > 0 && (
        <Button
          onClick={onQuestionSelected}
          className='absolute h-8 top-8 right-28'>
          <Plus /> Add Questions
        </Button>
      )}

      {isLoading ? (
        <Loading />
      ) : (
        <DataTable
          data={questions!.data.items as any}
          columns={questionsColumns}
          setRowSelection={setSelection}
          rowSelection={selection}
          getRowId={(row) => row.id}
          pagination={{
            pageIndex,
            pageSize,
            pageCount: questions!.data.totalCount,
            hasNextPage: questions!.data.hasNextPage,
            hasPreviousPage: questions!.data.hasPreviousPage,
          }}
          rowCount={questions!.data.totalCount!}
          setPagination={setPagination}
        />
      )}
    </div>
  );
};

export default QuestionsList;
