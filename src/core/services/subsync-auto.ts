import { SubsyncResult } from '../../types';
import { DEFAULT_CONFIG } from '../../config';
import { isRemoteMediaPath } from '../../jimaku/utils';
import { createLogger } from '../../logger';
import {
  TriggerSubsyncFromConfigDeps,
  findAddedSubtitleTrackId,
  runSubsyncManual,
} from './subsync';

const logger = createLogger('main:subsync-auto');

/**
 * Retime a subtitle that a download just loaded into mpv.
 *
 * Downloaded subtitles are timed against the release they were ripped from, so
 * they rarely line up with the file being watched. The manual picker already
 * knows how to fix that; this runs the same pipeline unattended, against the
 * media file as reference, for the track the download just added.
 *
 * Returns the sync result, or `null` when auto-sync did not run at all.
 */
export async function autoSyncDownloadedSubtitle(
  subtitlePath: string,
  deps: TriggerSubsyncFromConfigDeps,
): Promise<SubsyncResult | null> {
  const resolved = deps.getResolvedConfig();
  if (!resolved.autoSyncDownloads) return null;

  const client = deps.getMpvClient();
  if (!client || !client.connected) {
    logger.debug('[auto-subsync] skipped: mpv is not connected');
    return null;
  }

  if (deps.isSubsyncInProgress()) {
    logger.info('[auto-subsync] skipped: another subsync run is already in progress');
    return null;
  }

  let videoPath = '';
  try {
    const videoPathRaw = await client.requestProperty('path');
    videoPath = typeof videoPathRaw === 'string' ? videoPathRaw : '';
  } catch (error) {
    logger.warn('[auto-subsync] skipped: could not read the mpv path property:', error);
    return null;
  }

  if (!videoPath) {
    logger.debug('[auto-subsync] skipped: no media is loaded');
    return null;
  }

  // Both engines need the media itself as the reference, which rules out
  // streams: ffsubsync cannot decode the audio and alass cannot read the file.
  if (isRemoteMediaPath(videoPath)) {
    deps.showMpvOsd('Auto-sync skipped: streams need a local reference');
    return null;
  }

  const targetTrackId = await findAddedSubtitleTrackId(client, subtitlePath);
  if (targetTrackId === null) {
    logger.warn(`[auto-subsync] skipped: ${subtitlePath} never appeared in the mpv track list`);
    return null;
  }

  const engine = resolved.autoSyncEngine ?? DEFAULT_CONFIG.subsync.autoSyncEngine;
  deps.setSubsyncInProgress(true);
  try {
    const result = await deps.runWithSubsyncSpinner(() =>
      runSubsyncManual(
        { engine, referenceMode: 'video', targetTrackId },
        { getMpvClient: deps.getMpvClient, getResolvedConfig: deps.getResolvedConfig },
      ),
    );
    deps.showMpvOsd(
      result.ok ? `Auto-sync: ${result.message}` : `Auto-sync failed: ${result.message}`,
    );
    return result;
  } catch (error) {
    const message = (error as Error).message;
    logger.warn(`[auto-subsync] ${engine} run threw: ${message}`);
    deps.showMpvOsd(`Auto-sync failed: ${message}`);
    return { ok: false, message };
  } finally {
    deps.setSubsyncInProgress(false);
  }
}
