import { Asset } from "@/types/assets";
import _ from "lodash";
import { create } from "zustand";

type State = {
  assets: Asset[];
};

type Actions = {
  addAssets: (assets: Asset[]) => void;
  clearAssets: () => void;
  removeAsset: (id: string) => void;
};

const createAssetsStore = () =>
  create<State & Actions>((set, get) => ({
    assets: [],
    addAssets: (assets) =>
      set({ assets: _.uniqBy([...get().assets, ...assets], "id") }),
    clearAssets: () => set({ assets: [] }),
    removeAsset: (id) =>
      set((state) => ({
        assets: state.assets.filter((asset) => asset.id !== id),
      })),
  }));

export const useAssetsStore = createAssetsStore();
export const useQuizAnswerAssetsStore = createAssetsStore();
