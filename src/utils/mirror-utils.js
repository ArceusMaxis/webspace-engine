import { cloneMedia, closeExistingMediaMirror } from "./media-utils";

let mirrorTarget;
export function getCurrentMirroredMedia() {
  // TODO JEL
  return null;
  /*mirrorTarget = mirrorTarget || DOM_ROOT.querySelector("#media-mirror-target");
  const mirrorEl = mirrorTarget.firstChild;
  const linkedEl = mirrorEl && mirrorEl.components["media-loader"] && mirrorEl.components["media-loader"].data.linkedEl;
  return linkedEl;*/
}
export async function refreshMediaMirror() {
  const linkedEl = getCurrentMirroredMedia();
  if (!linkedEl) {
    return;
  }
  await closeExistingMediaMirror();
  const { entity } = cloneMedia(linkedEl, {
    link: true,
    parentEl: mirrorTarget,
    template: "#linked-media",
    src: linkedEl.components["media-loader"].data.src,
    mirrorTarget
  });

  entity.object3D.scale.set(0.75, 0.75, 0.75);
  entity.object3D.matrixNeedsUpdate = true;

  const refreshButton = entity.querySelector("[refresh-media-button]");
  if (refreshButton) {
    refreshButton.parentNode.removeChild(refreshButton);
  }

  const localRefreshButton = entity.querySelector("[local-refresh-media-button]");
  if (localRefreshButton) {
    localRefreshButton.parentNode.removeChild(localRefreshButton);
  }

  mirrorTarget.parentEl.components["follow-in-fov"].reset();
  mirrorTarget.parentEl.object3D.visible = true;
}
