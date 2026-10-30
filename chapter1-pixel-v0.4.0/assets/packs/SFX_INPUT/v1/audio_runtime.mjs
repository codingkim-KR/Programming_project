/** Optional Web Audio adapter. Never autoplays, resumes a context, or fetches a missing cue. */
export function validRelativeAssetPath(path) {
  return typeof path === 'string' && /^assets\/[A-Za-z0-9_./-]+$/.test(path)
    && !path.split('/').some(part => part === '..' || part === '.')
    && !path.includes('//');
}

export function resolveCue(plan, id, {allowDrafts = false} = {}) {
  const cue = plan?.cues?.find(item => item.id === id);
  if (!cue) return null;
  if (!cue.disabled && cue.fileValidated === true && validRelativeAssetPath(cue.path)) {
    return {id:cue.id, kind:cue.kind, path:cue.path, draft:false, ...cue.target};
  }
  if (allowDrafts && cue.draft?.fileValidated === true && validRelativeAssetPath(cue.draft.path)) {
    return {id:cue.id, kind:cue.kind, path:cue.draft.path, draft:true, ...cue.target,
      channels:cue.draft.channels, sampleRate:cue.draft.sampleRate, loop:false};
  }
  return null;
}

export async function loadCue(context, plan, id, {
  allowDrafts = false, baseUrl, fetchImpl = globalThis.fetch, onError = () => {}
} = {}) {
  const cue = resolveCue(plan,id,{allowDrafts});
  if (!cue || !context?.decodeAudioData || !baseUrl || !fetchImpl) return null;
  try {
    const response = await fetchImpl(new URL(cue.path,baseUrl).href);
    if (!response.ok) throw new Error(`Audio load failed: ${cue.id} (${response.status})`);
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    return {...cue, buffer};
  } catch(error) { onError(error); return null; }
}

/** The host must unlock its AudioContext after a user gesture. No resume() is called here. */
export function createAudioPlayer(context, {destination = context?.destination} = {}) {
  let music = null;
  const active = new Set();
  function stop(handle) {
    if (!handle) return;
    try { handle.source.stop(); } catch {}
    handle.source.disconnect(); handle.gain.disconnect(); active.delete(handle);
    if (music === handle) music = null;
  }
  function stopMusic() {
    for (const handle of [...active]) {
      if (handle.kind === 'music' || handle.kind === 'music_layer') stop(handle);
    }
  }
  function play(loaded, {replaceMusic = false, gainMultiplier = 1} = {}) {
    // Even a silent next scene must stop the previous scene's music.
    if (replaceMusic || loaded?.kind === 'music') stopMusic();
    if (!loaded?.buffer || !context || context.state !== 'running' || !destination) return null;
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = loaded.buffer;
    source.loop = loaded.loop === true;
    if (source.loop && Number.isFinite(loaded.loopStartSeconds) && Number.isFinite(loaded.loopEndSeconds)) {
      if (loaded.loopStartSeconds >= 0 && loaded.loopEndSeconds > loaded.loopStartSeconds
          && loaded.loopEndSeconds <= loaded.buffer.duration) {
        source.loopStart = loaded.loopStartSeconds; source.loopEnd = loaded.loopEndSeconds;
      } else { source.disconnect(); gain.disconnect(); return null; }
    } else if (source.loop) {
      // Loop cuts must be reviewed before enabling a final recording.
      source.disconnect(); gain.disconnect(); return null;
    }
    gain.gain.value = Math.min(1,Math.max(0,(loaded.gain ?? 0.5)*gainMultiplier));
    source.connect(gain); gain.connect(destination);
    const handle={source,gain,id:loaded.id,kind:loaded.kind}; active.add(handle);
    if (loaded.kind === 'music') music=handle;
    source.onended=()=>{source.disconnect();gain.disconnect();active.delete(handle);if(music===handle)music=null;};
    source.start();return handle;
  }
  return {play,stop,stopMusic,stopAll(){for(const handle of [...active])stop(handle);}};
}
