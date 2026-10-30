import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: {
    include: ["tests/**/*.test.{ts,jsx}"],
    environment: "node",
    testTimeout: 15000,
    // Keep jsdom and spreadsheet workers within the memory budget of development machines.
    maxWorkers: 4,
    restoreMocks: true,
  },
});
