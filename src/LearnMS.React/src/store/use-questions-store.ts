import { Question } from "@/generated/model";
import { DraftQuestion } from "@/types/assessment";
import _ from "lodash";
import { create } from "zustand";

type State = {
  questions: Question[];
  drafts: DraftQuestion[];
};

type Actions = {
  addQuestions: (questions: Question[]) => void;
  removeQuestion: (id: string) => void;
  clearQuestions: () => void;
  addDraft: (draft: DraftQuestion) => void;
  updateDraft: (localId: string, patch: Partial<DraftQuestion>) => void;
  removeDraft: (localId: string) => void;
  clearDrafts: () => void;
  resetAll: () => void;
};

export const useQuestionsStore = create<State & Actions>((set, get) => ({
  questions: [],
  drafts: [],
  addQuestions: (q) =>
    set({ questions: _.uniqBy([...get().questions, ...q], "id") }),
  clearQuestions: () => set({ questions: [] }),
  removeQuestion: (id) =>
    set({ questions: get().questions.filter((q) => q.id !== id) }),
  addDraft: (draft) => set({ drafts: [...get().drafts, draft] }),
  updateDraft: (localId, patch) =>
    set({
      drafts: get().drafts.map((d) =>
        d.localId === localId ? { ...d, ...patch } : d
      ),
    }),
  removeDraft: (localId) =>
    set({ drafts: get().drafts.filter((d) => d.localId !== localId) }),
  clearDrafts: () => set({ drafts: [] }),
  resetAll: () => set({ questions: [], drafts: [] }),
}));
