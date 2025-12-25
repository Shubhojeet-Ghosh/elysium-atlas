// utils/fastapi_axios.ts
import axios from "axios";

const noAuthRoutes = ["/auth/login"];

// You can use a separate env variable for FastAPI base URL
const fastApiAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_FASTAPI_SERVER_BASE_URL || "",
  withCredentials: false, // set to true if you ever need cookies
});

// Request Interceptor
fastApiAxios.interceptors.request.use(
  (config) => {
    // Remove Authorization for public routes
    if (
      config.url &&
      noAuthRoutes.some((route) => config.url?.includes(route))
    ) {
      if (
        config.headers &&
        typeof config.headers === "object" &&
        "Authorization" in config.headers
      ) {
        (config.headers as Record<string, unknown>)["Authorization"] =
          undefined;
      }
      return config;
    }
    // If using HttpOnly cookies for session, nothing to do here
    return config;
  },
  (error) => Promise.reject(error)
);

export default fastApiAxios;
