// utils/node_express_apis.ts
import axios from "axios";

const noAuthRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-google-login",
];

const nodeExpressAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_EXPRESS_SERVER_BASE_URL || "",
  withCredentials: false,
});

nodeExpressAxios.interceptors.request.use(
  (config: any) => {
    if (
      config.url &&
      noAuthRoutes.some((route) => config.url?.includes(route))
    ) {
      if (
        config.headers &&
        typeof config.headers === "object" &&
        "Authorization" in config.headers
      ) {
        // Use type assertion for TS safety
        (config.headers as Record<string, unknown>)["Authorization"] =
          undefined;
      }
      return config;
    }
    // For HttpOnly token: nothing to do, browser sends it
    return config;
  },
  (error) => Promise.reject(error)
);

export default nodeExpressAxios;
