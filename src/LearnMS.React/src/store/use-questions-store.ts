import { Question } from "@/generated/model";
import _ from "lodash";
import { create } from "zustand";
type State = {
  questions: Question[];
};

type Actions = {
  addQuestions: (questions: Question[]) => void;
  removeQuestion: (id: string) => void;
  clearQuestions: () => void;
};

export const useQuestionsStore = create<State & Actions>((set, get) => ({
  questions: [],
  addQuestions: (q) =>
    set({ questions: _.uniqBy([...get().questions, ...q], "id") }),
  clearQuestions: () => set({ questions: [] }),
  removeQuestion: (id) =>
    set({ questions: [...get().questions.filter((q) => q.id !== id)] }),
}));
