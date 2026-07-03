"use client";

import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  setKnowledgeBaseLinks as setAgentLinks,
  setKnowledgeBaseFiles as setAgentFiles,
  setKnowledgeBaseText as setAgentText,
  setKnowledgeBaseQnA as setAgentQnA,
  addKnowledgeBaseLinks as addAgentLinks,
  toggleKnowledgeBaseLink as toggleAgentLink,
  toggleAllKnowledgeBaseLinks as toggleAllAgentLinks,
  removeKnowledgeBaseLink as removeAgentLink,
  addKnowledgeBaseFiles as addAgentFiles,
  toggleKnowledgeBaseFile as toggleAgentFile,
  toggleAllKnowledgeBaseFiles as toggleAllAgentFiles,
  removeKnowledgeBaseFile as removeAgentFile,
  addKnowledgeBaseText as addAgentText,
  updateKnowledgeBaseText as updateAgentText,
  removeKnowledgeBaseText as removeAgentText,
  addKnowledgeBaseQnA as addAgentQnA,
  updateKnowledgeBaseQnA as updateAgentQnA,
  removeKnowledgeBaseQnA as removeAgentQnA,
} from "@/store/reducers/agentSlice";
import {
  setKnowledgeBaseLinks as setBuilderLinks,
  setKnowledgeBaseFiles as setBuilderFiles,
  setKnowledgeBaseText as setBuilderText,
  setKnowledgeBaseQnA as setBuilderQnA,
  addKnowledgeBaseLinks as addBuilderLinks,
  toggleKnowledgeBaseLink as toggleBuilderLink,
  toggleAllKnowledgeBaseLinks as toggleAllBuilderLinks,
  removeKnowledgeBaseLink as removeBuilderLink,
  addKnowledgeBaseFiles as addBuilderFiles,
  toggleKnowledgeBaseFile as toggleBuilderFile,
  toggleAllKnowledgeBaseFiles as toggleAllBuilderFiles,
  removeKnowledgeBaseFile as removeBuilderFile,
  addKnowledgeBaseText as addBuilderText,
  updateKnowledgeBaseText as updateBuilderText,
  removeKnowledgeBaseText as removeBuilderText,
  addKnowledgeBaseQnA as addBuilderQnA,
  updateKnowledgeBaseQnA as updateBuilderQnA,
  removeKnowledgeBaseQnA as removeBuilderQnA,
} from "@/store/reducers/agentBuilderSlice";
import { useIsKbBuildFlow } from "./KbDatasourceModeContext";

export function useKbLinksState() {
  const isBuild = useIsKbBuildFlow();
  return useSelector((state: RootState) =>
    isBuild
      ? state.agentBuilder.knowledgeBaseLinks
      : state.agent.knowledgeBaseLinks,
  );
}

export function useKbFilesState() {
  const isBuild = useIsKbBuildFlow();
  return useSelector((state: RootState) =>
    isBuild
      ? state.agentBuilder.knowledgeBaseFiles
      : state.agent.knowledgeBaseFiles,
  );
}

export function useKbTextState() {
  const isBuild = useIsKbBuildFlow();
  return useSelector((state: RootState) =>
    isBuild
      ? state.agentBuilder.knowledgeBaseText
      : state.agent.knowledgeBaseText,
  );
}

export function useKbQnAState() {
  const isBuild = useIsKbBuildFlow();
  return useSelector((state: RootState) =>
    isBuild ? state.agentBuilder.knowledgeBaseQnA : state.agent.knowledgeBaseQnA,
  );
}

export function useKbAgentId() {
  const isBuild = useIsKbBuildFlow();
  return useSelector((state: RootState) =>
    isBuild ? state.agentBuilder.agentID : state.agent.agentID,
  );
}

export function useKbDatasourceActions() {
  const isBuild = useIsKbBuildFlow();
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      isBuild,
      setKnowledgeBaseLinks: (links: Parameters<typeof setAgentLinks>[0]) =>
        dispatch(
          isBuild ? setBuilderLinks(links) : setAgentLinks(links),
        ),
      setKnowledgeBaseFiles: (files: Parameters<typeof setAgentFiles>[0]) =>
        dispatch(
          isBuild ? setBuilderFiles(files) : setAgentFiles(files),
        ),
      setKnowledgeBaseText: (texts: Parameters<typeof setAgentText>[0]) =>
        dispatch(
          isBuild ? setBuilderText(texts) : setAgentText(texts),
        ),
      setKnowledgeBaseQnA: (qnas: Parameters<typeof setAgentQnA>[0]) =>
        dispatch(isBuild ? setBuilderQnA(qnas) : setAgentQnA(qnas)),
      addKnowledgeBaseLinks: (
        payload: Parameters<typeof addAgentLinks>[0],
      ) =>
        dispatch(isBuild ? addBuilderLinks(payload) : addAgentLinks(payload)),
      toggleKnowledgeBaseLink: (index: number) =>
        dispatch(
          isBuild ? toggleBuilderLink(index) : toggleAgentLink(index),
        ),
      toggleAllKnowledgeBaseLinks: (checked: boolean) =>
        dispatch(
          isBuild
            ? toggleAllBuilderLinks(checked)
            : toggleAllAgentLinks(checked),
        ),
      removeKnowledgeBaseLink: (link: string) =>
        dispatch(
          isBuild ? removeBuilderLink(link) : removeAgentLink(link),
        ),
      addKnowledgeBaseFiles: (
        files: Parameters<typeof addAgentFiles>[0],
      ) =>
        dispatch(isBuild ? addBuilderFiles(files) : addAgentFiles(files)),
      toggleKnowledgeBaseFile: (index: number) =>
        dispatch(
          isBuild ? toggleBuilderFile(index) : toggleAgentFile(index),
        ),
      toggleAllKnowledgeBaseFiles: (checked: boolean) =>
        dispatch(
          isBuild
            ? toggleAllBuilderFiles(checked)
            : toggleAllAgentFiles(checked),
        ),
      removeKnowledgeBaseFile: (name: string) =>
        dispatch(
          isBuild ? removeBuilderFile(name) : removeAgentFile(name),
        ),
      addKnowledgeBaseText: (text: Parameters<typeof addAgentText>[0]) =>
        dispatch(isBuild ? addBuilderText(text) : addAgentText(text)),
      updateKnowledgeBaseText: (
        payload: Parameters<typeof updateAgentText>[0],
      ) =>
        dispatch(
          isBuild ? updateBuilderText(payload) : updateAgentText(payload),
        ),
      removeKnowledgeBaseText: (index: number) =>
        dispatch(
          isBuild ? removeBuilderText(index) : removeAgentText(index),
        ),
      addKnowledgeBaseQnA: (qna: Parameters<typeof addAgentQnA>[0]) =>
        dispatch(isBuild ? addBuilderQnA(qna) : addAgentQnA(qna)),
      updateKnowledgeBaseQnA: (
        payload: Parameters<typeof updateAgentQnA>[0],
      ) =>
        dispatch(isBuild ? updateBuilderQnA(payload) : updateAgentQnA(payload)),
      removeKnowledgeBaseQnA: (index: number) =>
        dispatch(isBuild ? removeBuilderQnA(index) : removeAgentQnA(index)),
    }),
    [dispatch, isBuild],
  );
}
