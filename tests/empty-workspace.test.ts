import { expect, it } from "vitest";
import { seedWorkspace } from "../server/seed.mjs";
import { workspaceSchema } from "../src/core/model.ts";

it("initializes a production workspace without demo stores, users or business records", () => {
  const state = workspaceSchema.parse(seedWorkspace({ demo: false }));
  expect(state.companies).toEqual([]);
  expect(state.tenants).toEqual({});
  expect(state.users).toEqual([]);
  expect(state.sessions).toEqual([]);
  expect(state.invitations).toEqual([]);
  expect(state.resets).toEqual([]);
  expect(state.checkoutRequests).toEqual({});
  expect(state.revision).toBe(0);
  expect(seedWorkspace().companies.length).toBeGreaterThan(0);
});
