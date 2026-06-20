import type { ComponentType } from "react";

type NamedModule = Record<string, ComponentType<unknown>>;
type LazyRouteResult = { Component: ComponentType<unknown> };

/** React Router `lazy` route loader — avoids `React.lazy` + vite preload on the entry graph. */
export function routeLazy<M extends NamedModule>(
  factory: () => Promise<M>,
  exportName: keyof M & string,
) {
  return async (): Promise<LazyRouteResult> => ({
    Component: (await factory())[exportName] as ComponentType<unknown>,
  });
}

export function routeLazyDefault(factory: () => Promise<{ default: ComponentType<unknown> }>) {
  return async (): Promise<LazyRouteResult> => {
    const mod = await factory();
    return { Component: mod.default };
  };
}

/** Dashboard shells — lazy so `/` never pulls DashboardHeader → vendor-motion. */
export const businessLayoutLazy = routeLazy(() => import("../layouts/BusinessLayout"), "BusinessLayout");
export const employeeLayoutLazy = routeLazy(() => import("../layouts/EmployeeLayout"), "EmployeeLayout");

/** Auth flows — lazy JS off the landing critical path (CSS loads via index.css). */
export const authPageLazy = routeLazy(() => import("../components/AuthPage"), "AuthPage");
export const joinPageLazy = routeLazy(() => import("../pages/JoinPage"), "JoinPage");
export const forgotPasswordPageLazy = routeLazy(
  () => import("../pages/ForgotPasswordPage"),
  "ForgotPasswordPage",
);
export const resetPasswordPageLazy = routeLazy(
  () => import("../pages/ResetPasswordPage"),
  "ResetPasswordPage",
);
export const activateEmployeePageLazy = routeLazy(
  () => import("../pages/ActivateEmployeePage"),
  "ActivateEmployeePage",
);
export const verifyEmailPageLazy = routeLazy(() => import("../pages/VerifyEmailPage"), "VerifyEmailPage");
export const checkEmailPageLazy = routeLazy(() => import("../pages/CheckEmailPage"), "CheckEmailPage");
export const platformAdminLoginPageLazy = routeLazy(
  () => import("../pages/platform/PlatformAdminLoginPage"),
  "PlatformAdminLoginPage",
);
export const unauthorizedPageLazy = routeLazy(
  () => import("../pages/UnauthorizedPage"),
  "UnauthorizedPage",
);
