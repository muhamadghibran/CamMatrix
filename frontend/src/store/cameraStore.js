import { create } from "zustand";
import { useAuthStore } from "./authStore";

import { API_BASE_URL as API_URL } from "../constants/api";

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const useCameraStore = create((set, get) => ({
  cameras: [],
  activeCameraId: null,
  gridLayout: "2x2",
  isLoading: false,
  _offlineStrikes: {}, // Debounce: hitung berapa kali kamera gagal cek berturut-turut

  fetchCameras: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/cameras/`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        set({ cameras: data });
        // Setelah list muncul, update status masing-masing kamera di background
        useCameraStore.getState().fetchStatuses();
      }
    } catch (e) { console.error(e); }
    set({ isLoading: false });
  },

  // Update semua status dalam 1 request batch — dengan debounce untuk mencegah flicker
  fetchStatuses: async () => {
    try {
      const res = await fetch(`${API_URL}/cameras/statuses`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json(); // [{id, status}, ...]
        const strikes = { ...get()._offlineStrikes };

        set((state) => ({
          cameras: state.cameras.map(c => {
            const found = data.find(d => d.id === c.id);
            if (!found) return c;

            if (found.status === "live") {
              // Reset strike jika live
              strikes[c.id] = 0;
              return { ...c, status: "live" };
            } else {
              // Hanya tandai offline setelah GAGAL 2 kali berturut-turut
              strikes[c.id] = (strikes[c.id] || 0) + 1;
              if (strikes[c.id] >= 2) {
                return { ...c, status: "offline" };
              }
              return c; // Tetap status lama jika baru 1 kali gagal
            }
          }),
          _offlineStrikes: strikes,
        }));
      }
    } catch (_) {}
  },

  addCamera: async (cam) => {
    try {
      const res = await fetch(`${API_URL}/cameras/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(cam)
      });
      if (res.ok) {
        const data = await res.json();
        set((state) => ({ cameras: [...state.cameras, data] }));
      }
    } catch (e) { console.error(e); }
  },

  updateCamera: async (id, dict) => {
     try {
       const res = await fetch(`${API_URL}/cameras/${id}`, {
         method: "PUT",
         headers: getHeaders(),
         body: JSON.stringify(dict)
       });
       if (res.ok) {
         const data = await res.json();
         set((state) => ({ cameras: state.cameras.map(c => c.id === id ? data : c) }));
       }
     } catch(e) { console.error(e);}
  },

  deleteCamera: async (id) => {
     try {
       const res = await fetch(`${API_URL}/cameras/${id}`, {
         method: "DELETE",
         headers: getHeaders()
       });
       if(res.ok) {
         set((state) => ({ cameras: state.cameras.filter(c => c.id !== id) }));
       }
     } catch(e) { console.error(e); }
  },

  setActiveCamera: (id) => set({ activeCameraId: id }),
  setGridLayout: (layout) => set({ gridLayout: layout }),
}));
