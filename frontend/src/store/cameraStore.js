import { create } from "zustand";

export const useCameraStore = create((set) => ({
  cameras: [],
  activeCameraId: null,
  gridLayout: "2x2",

  setCameras: (cameras) => set({ cameras }),
  setActiveCamera: (id) => set({ activeCameraId: id }),
  setGridLayout: (layout) => set({ gridLayout: layout }),
}));
