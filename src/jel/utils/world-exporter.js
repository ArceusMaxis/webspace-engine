import { downloadText, vecRgbToCssRgb } from "./dom-utils";
import cleaner from "clean-html";
import { FONT_FACES } from "./quill-utils";
import { normalizeCoord } from "../systems/wrapped-entity-system";

const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();
const tmpVec4 = new THREE.Vector4();

export default class WorldExporter {
  downloadCurrentWorldHtml() {
    this.currentWorldToHtml().then(html => {
      const pathParts = document.location.pathname.split("/");
      const slugParts = pathParts[1].split("-");
      slugParts.pop();
      const filename = `${slugParts.join("-") || "world"}.html`;
      downloadText(filename, "text/html", html);
    });
  }

  async currentWorldToHtml() {
    const { hubMetadata, hubChannel } = window.APP;
    const metadata = hubMetadata.getMetadata(hubChannel.hubId);
    const doc = document.implementation.createHTMLDocument(metadata.displayName);
    const jelSchema = doc.createElement("meta");
    jelSchema.setAttribute("name", "jel-schema");
    jelSchema.setAttribute("content", "world-1.0");
    doc.head.appendChild(jelSchema);

    const mediaEls = [...document.querySelectorAll("[shared]")].filter(el => el.components["media-loader"]);

    mediaEls.sort((x, y) => (x.id > y.id ? -1 : x.id < y.id ? 1 : 0));

    for (const el of mediaEls) {
      const exportEl = this.elToExportEl(doc, el);
      if (!exportEl) continue;

      doc.body.appendChild(exportEl);
    }

    return new Promise(res => {
      cleaner.clean(
        new XMLSerializer().serializeToString(doc).replaceAll("<", "\n<"),
        {
          "add-break-around-tags": [
            "embed",
            "img",
            "video",
            "audio",
            "h1",
            "h2",
            "strong",
            "span",
            "div",
            "p",
            "ul",
            "ol",
            "li"
          ]
        },
        res
      );
    });
  }

  elToExportEl(doc, el) {
    const { terrainSystem } = AFRAME.scenes[0].systems["hubs-systems"];
    let { src, contentSubtype } = el.components["media-loader"].data;

    let exportEl;
    let style = "";
    let srcTargetAttribute = "src";

    if (el.components["media-image"]) {
      const imageSrc = el.components["media-image"].data.src;

      // If image and content are different URLs, this is a link.
      if (imageSrc !== src) {
        exportEl = doc.createElement("a");
        srcTargetAttribute = "href";
      } else {
        exportEl = doc.createElement("img");
        exportEl.setAttribute("crossorigin", "anonymous");
      }
    }

    if (el.components["media-pdf"]) {
      const { index } = el.components["media-pdf"].data;

      exportEl = doc.createElement("embed");
      exportEl.setAttribute("type", "application/pdf");
      exportEl.setAttribute("data-index", index);
    }

    if (el.components["media-vox"]) {
      exportEl = doc.createElement("embed");
      exportEl.setAttribute("type", "model/vox-binary");
    }

    if (el.components["gltf-model-plus"]) {
      exportEl = doc.createElement("embed");
      exportEl.setAttribute("type", "model/gltf-binary");
    }

    if (el.components["media-text"]) {
      const mediaText = el.components["media-text"];
      const { fitContent, foregroundColor, backgroundColor, transparent, font } = mediaText.data;

      exportEl = doc.createElement("div");

      let fontFamily;

      style += `color: ${vecRgbToCssRgb(foregroundColor)}; `;

      if (fitContent) {
        style += `width: fit-content; height: fit-content; `;
      } else {
        style += `width: ${(mediaText.mesh.scale.x * 100.0).toFixed(4)}cm; height: ${(
          mediaText.mesh.scale.y * 100.0
        ).toFixed(4)}cm; overflow-y: scroll; `;
      }

      if (transparent) {
        style += `background-color: transparent; text-stoke: 4px ${vecRgbToCssRgb(backgroundColor)}; `;
      } else {
        style += `background-color: ${vecRgbToCssRgb(backgroundColor)}; `;
      }

      switch (font) {
        case FONT_FACES.SANS_SERIF:
          fontFamily = "sans-serif";
          break;
        case FONT_FACES.SERIF:
          fontFamily = "serif";
          break;
        case FONT_FACES.MONO:
          fontFamily = "monospaced";
          break;
        case FONT_FACES.COMIC:
          fontFamily = "comic";
          break;
        case FONT_FACES.COMIC2:
          fontFamily = "comic-2";
          break;
        case FONT_FACES.WRITING:
          fontFamily = "cursive";
          break;
        case FONT_FACES.WRITING2:
          fontFamily = "cursive-2";
          break;
      }

      style += `font-family: ${fontFamily}; `;

      if (mediaText.quill) {
        const html = mediaText.quill.container.querySelector(".ql-editor").innerHTML;
        exportEl.innerHTML = html;

        // Clean contents cache used for outlining
        exportEl.querySelectorAll("[data-contents]").forEach(el => el.removeAttribute("data-contents"));
      }

      src = null;
      contentSubtype = null;
    }

    if (el.components["media-emoji"]) {
      const { emoji } = el.components["media-emoji"].data;

      exportEl = doc.createElement("div");
      style += `font-family: emoji; `;
      exportEl.innerHTML = emoji;
    }

    if (el.components["media-video"]) {
      exportEl = doc.createElement("video");
      const { audioSrc, volume, loop, time, videoPaused } = el.components["media-video"].data;

      exportEl.setAttribute("crossorigin", "anonymous");
      exportEl.setAttribute("controls", "");

      if (videoPaused) {
        exportEl.setAttribute("currenttime", time);
      } else {
        exportEl.setAttribute("autoplay", "");
      }

      if (loop) {
        exportEl.setAttribute("loop", "");
      }

      if (volume <= 0) {
        exportEl.setAttribute("muted", "");
      }

      if (audioSrc && audioSrc !== src) {
        exportEl.setAttribute("data-audio-src", audioSrc);
      }
    }

    if (exportEl) {
      const { object3D, id } = el;

      if (src) {
        exportEl.setAttribute(srcTargetAttribute, src);
      }

      exportEl.id = id.replaceAll("naf-", "");

      if (contentSubtype) {
        exportEl.setAttribute("data-content-subtype", contentSubtype);
      }

      object3D.updateMatrices();
      object3D.matrix.decompose(tmpPos, tmpQuat, tmpScale);

      // Normalize Y to be terrain-agnostic
      const height = terrainSystem.getTerrainHeightAtWorldCoord(tmpPos.x, tmpPos.z);
      const x = normalizeCoord(tmpPos.x);
      const y = normalizeCoord(tmpPos.y - height);
      const z = normalizeCoord(tmpPos.z);

      // Axis angle
      tmpVec4.setAxisAngleFromQuaternion(tmpQuat);

      style += `transform: translate3d(${(x * 100).toFixed(4)}cm, ${(y * 100).toFixed(4)}cm, ${(z * 100).toFixed(
        4
      )}cm) rotate3d(${tmpVec4.x.toFixed(4)}, ${tmpVec4.y.toFixed(4)}, ${tmpVec4.z.toFixed(4)}, ${tmpVec4.w.toFixed(
        4
      )}rad) scale3D(${tmpScale.x.toFixed(4)}, ${tmpScale.y.toFixed(4)}, ${tmpScale.z.toFixed(4)});`;

      exportEl.setAttribute("style", style);
    }

    return exportEl;
  }
}
