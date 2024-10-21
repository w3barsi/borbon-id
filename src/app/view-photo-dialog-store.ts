import { create } from "zustand";

interface ViewPhotoDialog {
  isViewPhotoDialogOpen: boolean;
  url: string;
  setIsViewPhotoDialogOpen: (isOpen: boolean) => void;
  setUrl: (url: string) => void;
}

const useViewPhotoDialogStore = create<ViewPhotoDialog>((set) => ({
  isViewPhotoDialogOpen: false, // Default state for isOpen
  url: "", // Default state for url
  setIsViewPhotoDialogOpen: (isOpen) => set({ isViewPhotoDialogOpen: isOpen }),
  setUrl: (url) => set({ url }),
}));

export default useViewPhotoDialogStore;
