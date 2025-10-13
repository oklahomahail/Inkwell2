// src/types.d.ts
export {};
declare global {
  interface Window {
    __inkwell?: {
      tour?: {
        running: boolean;
        id?: string;
      };
    };
  }
}
