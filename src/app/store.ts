import { create } from "zustand";

type ImgDialogStore = {
  isOpen: boolean;
  link: string;
  setIsOpen: (value: boolean) => void;
  setLink: (url: string) => void;
};
export const createDialogStore = create<ImgDialogStore>((set) => ({
  isOpen: false,
  link: "",
  setIsOpen: (value: boolean) => set(() => ({ isOpen: value })),
  setLink: (url: string) => set(() => ({ link: url })),
}));
