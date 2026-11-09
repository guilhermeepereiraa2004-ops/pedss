// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../src/pages/Dashboard";
import ApplicationProvider from "../src/components/ApplicationProvider";
import { cartLine, checkout, company, fixture } from "./fixtures.ts";

const activate = "Ativar notificações do navegador";
const deactivate = "Desativar notificações do navegador";

function browserNotifications(permission = "granted") {
  const notification = {
    permission: "default",
    requestPermission: vi.fn(async () => (notification.permission = permission)),
  };
  const worker = {
    active: { state: "activated" },
    getNotifications: vi.fn(async () => []),
    showNotification: vi.fn(async () => {}),
  };
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("Notification", notification);
  vi.stubGlobal(
    "ServiceWorkerRegistration",
    class {
      showNotification() {}
    },
  );
  vi.stubGlobal(
    "navigator",
    Object.assign(Object.create(navigator, { userAgent: { value: navigator.userAgent } }), {
      serviceWorker: {
        register: vi.fn(async () => worker),
        getRegistration: vi.fn(async () => worker),
      },
    }),
  );
  return { notification, worker };
}

function openOrders(f, mode) {
  return render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo, mode }}>
      <MemoryRouter initialEntries={["/dashboard?store=demo&tab=orders"]}>
        <Dashboard />
      </MemoryRouter>
    </ApplicationProvider>,
  );
}

it("no painel conectado, cadastra e remove o dispositivo para receber avisos com a aba fechada", async () => {
  const { worker, notification } = browserNotifications();
  const device = { endpoint: "https://fcm.googleapis.com/fcm/send/browser-de-teste" };
  const subscription = { ...device, toJSON: () => device };
  worker.pushManager = {
    getSubscription: vi.fn(async () => null),
    subscribe: vi.fn(async () => {
      notification.permission = "granted";
      return subscription;
    }),
  };
  vi.stubGlobal("PushManager", class {});
  const calls = [];
  const publicKey = "AQID";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url, { body }) => {
      const request = JSON.parse(body);
      calls.push(request);
      return {
        ok: true,
        json: async () => ({ result: { publicKey, subscribed: request.command === "subscribe" } }),
      };
    }),
  );
  const f = await fixture();
  openOrders(f, "remote");
  const button = await screen.findByRole("button", { name: "Ativar notificações push" });
  await waitFor(() => expect(calls[0]?.command).toBe("status"));
  expect(document.getElementById("order-notification-help")).toHaveTextContent(/painel fechado/);
  await waitFor(() => expect(button).toBeEnabled());
  await userEvent.click(button);
  expect(await screen.findByRole("button", { name: "Desativar notificações push" })).toBeEnabled();
  expect(calls[1]).toEqual({
    kind: "order-push",
    command: "subscribe",
    args: [company.id, device, publicKey],
  });

  await act(async () => {
    await placeOrder(f);
  });
  expect(await screen.findByText("Novo pedido recebido.")).toBeInTheDocument();
  expect(worker.showNotification).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Desativar notificações push" }));
  expect(await screen.findByRole("button", { name: "Ativar notificações push" })).toBeEnabled();
  expect(calls[2]).toEqual({
    kind: "order-push",
    command: "unsubscribe",
    args: [company.id, device.endpoint],
  });
});

async function placeOrder(f) {
  await f.services.addToCart(company.id, cartLine);
  return f.services.checkout(
    company.id,
    f.repo.getSnapshot().tenants[company.id].cart.requestId,
    checkout,
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

it("avisa o proprietário sobre pedidos novos, mantém a preferência e respeita a desativação", async () => {
  const { notification, worker } = browserNotifications();
  const f = await fixture();
  const oldOrder = await placeOrder(f);
  const dashboard = openOrders(f);
  await userEvent.click(await screen.findByRole("button", { name: activate }));
  expect(await screen.findByRole("button", { name: deactivate })).toBeEnabled();
  expect(notification.requestPermission).toHaveBeenCalledTimes(1);
  expect(worker.showNotification).not.toHaveBeenCalled();

  let freshOrder;
  await act(async () => {
    freshOrder = await placeOrder(f);
  });
  expect(await screen.findByText("Novo pedido recebido.")).toBeInTheDocument();
  expect(worker.showNotification).toHaveBeenCalledTimes(1);
  expect(worker.showNotification).toHaveBeenCalledWith("Novo pedido na Peds's", {
    body: `${company.name} · Pedido ${freshOrder.number}`,
    icon: "/brand/peds-icon-180-v1.png",
    tag: `pedss-order:${company.id}:${freshOrder.id}`,
    data: { store: company.slug },
  });

  await act(async () => {
    await f.services.changeOrder(company.id, oldOrder.id, "Aceito", "", oldOrder.updatedAt);
  });
  dashboard.unmount();
  openOrders(f);
  expect(await screen.findByRole("button", { name: deactivate })).toBeEnabled();
  await userEvent.click(screen.getByRole("button", { name: deactivate }));
  await waitFor(() => expect(screen.getByRole("button", { name: activate })).toBeEnabled());
  await act(async () => {
    await placeOrder(f);
  });
  expect(await screen.findByText("Novo pedido recebido.")).toBeInTheDocument();
  expect(worker.showNotification).toHaveBeenCalledTimes(1);
});

it("orienta o proprietário quando o navegador bloqueia os avisos", async () => {
  const { worker } = browserNotifications("denied");
  const f = await fixture();
  openOrders(f);
  await userEvent.click(await screen.findByRole("button", { name: activate }));
  expect(await screen.findByText(/Notificações bloqueadas/)).toBeVisible();
  expect(screen.getByRole("button", { name: activate })).toBeDisabled();
  await act(async () => {
    await placeOrder(f);
  });
  expect(await screen.findByText("Novo pedido recebido.")).toBeInTheDocument();
  expect(worker.showNotification).not.toHaveBeenCalled();
});

it("mantém o aviso dentro do painel para atendentes sem expor o controle do proprietário", async () => {
  const { notification, worker } = browserNotifications();
  const f = await fixture("attendant");
  openOrders(f);
  expect(await screen.findByRole("button", { name: /Ativar som/ })).toBeEnabled();
  expect(screen.queryByRole("button", { name: activate })).not.toBeInTheDocument();
  await act(async () => {
    await placeOrder(f);
  });
  expect(await screen.findByText("Novo pedido recebido.")).toBeInTheDocument();
  expect(notification.requestPermission).not.toHaveBeenCalled();
  expect(worker.showNotification).not.toHaveBeenCalled();
});
