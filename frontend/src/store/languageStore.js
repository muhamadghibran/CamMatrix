import { create } from "zustand";
import { persist } from "zustand/middleware";
import id from "../locales/id";
import en from "../locales/en";
import zh from "../locales/zh";

const translations = { id, en, zh };

export const useLanguageStore = create(
  persist(
    (set, get) => ({
      language: "id",
      t: (keys) => {
        const { language } = get();
        const keysArray = keys.split(".");
        let result = translations[language];
        
        for (const key of keysArray) {
          if (result && result[key]) {
            result = result[key];
          } else {
            return keys;
          }
        }
        return result;
      },
      setLanguage: (lang) => set({ language: lang }),
    }),
    { name: "vms-language" }
  )
);
