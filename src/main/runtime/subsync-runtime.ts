import type { MpvIpcClient } from '../../core/services/mpv';
import {
  autoSyncDownloadedSubtitleRuntime,
  runSubsyncManualFromIpcRuntime,
  triggerSubsyncFromConfigRuntime,
} from '../../core/services/subsync-runner';
import type {
  SubsyncResult,
  SubsyncManualPayload,
  SubsyncManualRunRequest,
  ResolvedConfig,
} from '../../types';
import { getSubsyncConfig } from '../../subsync/utils';
import { createSubsyncRuntimeServiceInputFromState } from '../subsync-runtime';

export type MainSubsyncRuntimeDeps = {
  getMpvClient: () => MpvIpcClient | null;
  getResolvedConfig: () => ResolvedConfig;
  getSubsyncInProgress: () => boolean;
  setSubsyncInProgress: (inProgress: boolean) => void;
  showMpvOsd: (text: string) => void;
  openManualPicker: (payload: SubsyncManualPayload) => void;
};

export function createMainSubsyncRuntime(deps: MainSubsyncRuntimeDeps): {
  triggerFromConfig: () => Promise<void>;
  runManualFromIpc: (request: SubsyncManualRunRequest) => Promise<SubsyncResult>;
  autoSyncDownload: (subtitlePath: string) => Promise<SubsyncResult | null>;
} {
  const getRuntimeServiceParams = () =>
    createSubsyncRuntimeServiceInputFromState({
      getMpvClient: () => deps.getMpvClient(),
      getResolvedSubsyncConfig: () => getSubsyncConfig(deps.getResolvedConfig().subsync),
      getSubsyncInProgress: () => deps.getSubsyncInProgress(),
      setSubsyncInProgress: (inProgress: boolean) => deps.setSubsyncInProgress(inProgress),
      showMpvOsd: (text: string) => deps.showMpvOsd(text),
      openManualPicker: (payload: SubsyncManualPayload) => deps.openManualPicker(payload),
    });

  return {
    triggerFromConfig: async (): Promise<void> => {
      await triggerSubsyncFromConfigRuntime(getRuntimeServiceParams());
    },
    runManualFromIpc: async (request: SubsyncManualRunRequest): Promise<SubsyncResult> =>
      runSubsyncManualFromIpcRuntime(request, getRuntimeServiceParams()),
    autoSyncDownload: async (subtitlePath: string): Promise<SubsyncResult | null> =>
      autoSyncDownloadedSubtitleRuntime(subtitlePath, getRuntimeServiceParams()),
  };
}
