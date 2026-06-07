import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import { useDispatch, TypedUseSelectorHook, useSelector } from "react-redux";

// Import Reducers
import { settingsReducer } from "./reducers/settingsSlice";
import { userProfileReducer } from "./reducers/userProfileSlice";
import { agentBuilderReducer } from "./reducers/agentBuilderSlice";
import { userAgentsReducer } from "./reducers/userAgentsSlice";
import { agentReducer } from "./reducers/agentSlice";
import { agentChatReducer } from "./reducers/agentChatSlice";
import { userPlanReducer } from "./reducers/userPlanSlice";
import { emailUserReducer } from "./reducers/emailUserSlice";
import { emailDepartmentsReducer } from "./reducers/emailDepartmentsSlice";
import { emailKnowledgeReducer } from "./reducers/emailKnowledgeSlice";
import { emailToolsReducer } from "./reducers/emailToolsSlice";
import { emailRulesReducer } from "./reducers/emailRulesSlice";

// Noop storage logic to handle SSR issues
const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: number) {
      return Promise.resolve(value);
    },
    removeItem() {
      return Promise.resolve();
    },
  };
};

// Use localStorage only in the browser; noop storage for SSR
const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : createNoopStorage();

// Persist configuration for settings
const settingsPersistConfig = {
  key: "settings",
  storage: storage,
};
const userProfilePersistConfig = {
  key: "userProfile",
  storage: storage,
};
const agentBuilderPersistConfig = {
  key: "agentBuilder",
  storage: storage,
};

const userAgentsPersistConfig = {
  key: "userAgents",
  storage: storage,
};

const agentPersistConfig = {
  key: "agent",
  storage: storage,
};

const agentChatPersistConfig = {
  key: "agentChat",
  storage: storage,
};

const userPlanPersistConfig = {
  key: "userPlan",
  storage: storage,
};

const emailUserPersistConfig = {
  key: "emailUser",
  storage: storage,
};

const emailDepartmentsPersistConfig = {
  key: "emailDepartments",
  storage: storage,
};

const emailKnowledgePersistConfig = {
  key: "emailKnowledge",
  storage: storage,
};

const emailToolsPersistConfig = {
  key: "emailTools",
  storage: storage,
};

const emailRulesPersistConfig = {
  key: "emailRules",
  storage: storage,
};

// Apply persistReducer to settings and userAgents
const persistedSettingsReducer = persistReducer(
  settingsPersistConfig,
  settingsReducer,
);
const persistedUserProfileReducer = persistReducer(
  userProfilePersistConfig,
  userProfileReducer,
);
const persistedAgentBuilderReducer = persistReducer(
  agentBuilderPersistConfig,
  agentBuilderReducer,
);
const persistedUserAgentsReducer = persistReducer(
  userAgentsPersistConfig,
  userAgentsReducer,
);

const persistedAgentReducer = persistReducer(agentPersistConfig, agentReducer);
const persistedAgentChatReducer = persistReducer(
  agentChatPersistConfig,
  agentChatReducer,
);
const persistedUserPlanReducer = persistReducer(
  userPlanPersistConfig,
  userPlanReducer,
);
const persistedEmailUserReducer = persistReducer(
  emailUserPersistConfig,
  emailUserReducer,
);
const persistedEmailDepartmentsReducer = persistReducer(
  emailDepartmentsPersistConfig,
  emailDepartmentsReducer,
);
const persistedEmailKnowledgeReducer = persistReducer(
  emailKnowledgePersistConfig,
  emailKnowledgeReducer,
);
const persistedEmailToolsReducer = persistReducer(
  emailToolsPersistConfig,
  emailToolsReducer,
);
const persistedEmailRulesReducer = persistReducer(
  emailRulesPersistConfig,
  emailRulesReducer,
);

// Configure Redux Store
export const store = configureStore({
  reducer: {
    settings: persistedSettingsReducer, // Persisted settings state
    userProfile: persistedUserProfileReducer,
    agentBuilder: persistedAgentBuilderReducer,
    userAgents: persistedUserAgentsReducer,
    agent: persistedAgentReducer,
    agentChat: persistedAgentChatReducer,
    userPlan: persistedUserPlanReducer,
    emailUser: persistedEmailUserReducer,
    emailDepartments: persistedEmailDepartmentsReducer,
    emailKnowledge: persistedEmailKnowledgeReducer,
    emailTools: persistedEmailToolsReducer,
    rules: persistedEmailRulesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Required for Redux Persist
    }),
});

// Create persistor for Redux Persist
export const persistor = persistStore(store);

// Infer types for better TypeScript support
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed Hooks for Redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
