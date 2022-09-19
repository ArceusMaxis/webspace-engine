import { addMedia, addMediaInFrontOfPlayer } from "../../hubs/utils/media-utils";
import { parse as transformParse } from "transform-parser";
import { ObjectContentOrigins } from "../../hubs/object-types";
import { ensureOwnership } from "./ownership-utils";
import { FONT_FACES } from "./quill-utils";
import { webspaceHtmlToQuillHtml } from "./dom-utils";

const transformUnitToMeters = s => {
  if (!s) return 0.0;

  if (s.endsWith("cm")) {
    return parseFloat(s.replaceAll("cm", "")) / 100.0;
  }

  if (s.endsWith("mm")) {
    return parseFloat(s.replaceAll("mm", "")) / 10000.0;
  }

  return 0.0;
};

const transformUnitToRadians = s => {
  if (!s) return 0.0;

  if (s.endsWith("rad")) {
    return parseFloat(s.replaceAll("rad", ""));
  }

  if (s.endsWith("deg")) {
    return parseFloat(s.replaceAll("deg", "")) * ((2.0 * Math.PI) / 360.0);
  }

  return 0.0;
};

export const parseTransformIntoThree = transform => {
  const pos = new THREE.Vector3(0, 0, 0);
  const rot = new THREE.Quaternion(0, 0, 0, 1);
  const scale = new THREE.Vector3(1, 1, 1);

  const { translate3d, rotate3d, scale3d } = transformParse(transform);

  if (translate3d) {
    const x = transformUnitToMeters(translate3d[0]);
    const z = transformUnitToMeters(translate3d[2]);
    const y = transformUnitToMeters(translate3d[1]);
    pos.set(x, y, z);
  }

  if (rotate3d) {
    const rx = parseFloat(rotate3d[0]);
    const ry = parseFloat(rotate3d[1]);
    const rz = parseFloat(rotate3d[2]);
    const rr = transformUnitToRadians(rotate3d[3]);
    rot.setFromAxisAngle(new THREE.Vector3(rx, ry, rz), rr);
  }

  if (scale3d) {
    const x = scale3d[0];
    const y = scale3d[1];
    const z = scale3d[2];
    scale.set(x, y, z);
  }

  return [pos, rot, scale];
};

export default class WorldImporter {
  importHtmlToCurrentWorld(html, replaceExisting = true, removeEntitiesNotInTemplate = false) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return this.importJelDocument(doc, replaceExisting, removeEntitiesNotInTemplate);
  }

  removeEntitiesFromHtmlFromCurrentWorld(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return this.removeEntitiesFromJelDocument(doc);
  }

  async removeEntitiesFromJelDocument(doc) {
    const promises = [];

    for (const el of doc.body.childNodes) {
      const id = el.id;
      if (!id || id.length !== 7) continue; // Sanity check

      const existingEl = DOM_ROOT.getElementById(`naf-${id}`);

      if (existingEl) {
        // Proceed once the shared component is removed so the id has been freed.
        promises.push(
          new Promise(res => {
            if (!ensureOwnership(existingEl)) res();

            existingEl.components.networked.whenInstantiated(() => {
              let c = 0;

              const handler = () => {
                c++;

                if (c === Object.keys(existingEl.components).length) {
                  existingEl.removeEventListener("componentremoved", handler);
                  res();
                }
              };

              existingEl.addEventListener("componentremoved", handler);

              existingEl.parentNode.removeChild(existingEl);
            });
          })
        );
      }
    }

    await Promise.all(promises);
  }

  async importJelDocument(doc, replaceExisting = true, removeEntitiesNotInTemplate = false) {
    const { terrainSystem, autoQualitySystem } = AFRAME.scenes[0].systems["hubs-systems"];
    autoQualitySystem.stopTracking();

    if (replaceExisting) {
      await this.removeEntitiesFromJelDocument(doc);
    }

    const docEntityIds = new Set();

    for (const el of doc.body.childNodes) {
      const id = el.id;
      if (!id || id.length !== 7) continue; // Sanity check
      docEntityIds.add(`naf-${id}`);
    }

    if (removeEntitiesNotInTemplate) {
      const toRemove = [...(DOM_ROOT.querySelectorAll("[shared]") || [])].filter(
        el => !docEntityIds.has(el.getAttribute("id"))
      );

      for (const el of toRemove) {
        el.components.networked.whenInstantiated(() => {
          if (el.components["media-loader"]) {
            el.parentNode.removeChild(el);
          }
        });
      }
    }

    const getStyle = el => {
      const style = `:root { ${el.getAttribute("style") || ""}`;
      const styleEl = doc.createElement("style");
      styleEl.textContent = style;
      doc.body.appendChild(styleEl);

      if (styleEl.sheet.cssRules.length === 0) return null;
      const rule = styleEl.sheet.cssRules[0];
      const ret = rule.style;
      styleEl.remove();
      return ret;
    };

    // Terrain system needs to pre-cache all the heightmaps, since this routine
    // will need to globally reference the terrain heights to place the new media properly in Y.

    const heightMaps = [];

    for (const el of doc.body.childNodes) {
      const id = el.id;
      if (!id || id.length !== 7) continue; // Sanity check
      if (DOM_ROOT.getElementById(`naf-${id}`)) continue;

      const style = getStyle(el);
      if (!style || !style.transform) continue;
      const { translate3d } = transformParse(style.transform);
      const x = transformUnitToMeters(translate3d[0]);
      const z = transformUnitToMeters(translate3d[2]);
      heightMaps.push(terrainSystem.loadHeightMapAtWorldCoord(x, z));
    }

    await Promise.all(heightMaps);

    let pendingCount = 0;

    for (const el of doc.body.childNodes) {
      const id = el.id;
      if (!id || id.length !== 7) continue; // Sanity check
      if (DOM_ROOT.getElementById(`naf-${id}`)) continue;

      const style = getStyle(el) || {};
      const { fontFamily, transform, color, width, height, backgroundColor, textStroke } = style;

      let contentSubtype = null;
      const tagName = el.tagName;
      const mediaOptions = {};

      let src = null;
      let contents = null;
      let resolve = false;
      const type = el.getAttribute("type");

      if (tagName === "DIV" && fontFamily === "emoji") {
        // Voxmoji
        contents = el.innerHTML.trim();
      } else if (tagName === "IMG") {
        // Image
        src = el.getAttribute("src");
      } else if (tagName === "A") {
        // Link
        src = el.getAttribute("href");
        resolve = true;
      } else if (tagName === "EMBED" && el.getAttribute("data-index") !== null) {
        // PDF
        src = el.getAttribute("src");
        mediaOptions.index = el.getAttribute("data-index");
      } else if (tagName === "MODEL") {
        // VOX or glTF
        src = el.getAttribute("src");
        resolve = true;
      } else if (tagName === "VIDEO") {
        // Video
        src = el.getAttribute("src");
        resolve = true;

        if (el.getAttribute("currenttime") !== null) {
          mediaOptions.time = el.getAttribute("currenttime");
        }

        const autoplayAttr = el.getAttribute("autoplay");

        if (autoplayAttr) {
          el.pause(); // Just in case, pause this video tag
        }

        // autoplay="hover" will enable play-on-hover
        mediaOptions.videoPaused = autoplayAttr === null || autoplayAttr === "hover";
        mediaOptions.playOnHover = autoplayAttr === "hover";
        mediaOptions.loop = el.getAttribute("loop") !== null;

        if (el.getAttribute("muted") !== null) {
          mediaOptions.volume = 0;
        }

        if (el.getAttribute("data-audio-src") !== null) {
          mediaOptions.audioSrc = el.getAttribute("data-audio-src");
        }
      } else if (tagName === "DIV" || tagName === "LABEL" || tagName === "MARQUEE") {
        // Text
        contents = await webspaceHtmlToQuillHtml(el.innerHTML);
        let font = FONT_FACES.SANS_SERIF;
        let fitContent = false;
        let mediaForegroundColor = null;
        let mediaBackgroundColor = null;

        contentSubtype = "page";

        if ((width === "min-content" && height === "min-content") || tagName === "MARQUEE" || tagName === "LABEL") {
          contentSubtype = backgroundColor === "transparent" || tagName === "MARQUEE" ? "banner" : "label";
          fitContent = true;
        }

        if (contentSubtype == "banner") {
          if (textStroke) {
            const textStrokeParsed = transformParse(textStroke);

            if (textStrokeParsed.rgb) {
              mediaBackgroundColor = {
                x: textStrokeParsed.rgb[0] / 255.0,
                y: textStrokeParsed.rgb[1] / 255.0,
                z: textStrokeParsed.rgb[2] / 255.0
              };
            }
          }
        } else {
          if (backgroundColor) {
            const backgroundParsed = transformParse(backgroundColor);

            if (backgroundParsed.rgb) {
              mediaBackgroundColor = {
                x: backgroundParsed.rgb[0] / 255.0,
                y: backgroundParsed.rgb[1] / 255.0,
                z: backgroundParsed.rgb[2] / 255.0
              };
            }
          }
        }

        if (color) {
          const colorParsed = transformParse(color);

          if (colorParsed.rgb) {
            mediaForegroundColor = {
              x: colorParsed.rgb[0] / 255.0,
              y: colorParsed.rgb[1] / 255.0,
              z: colorParsed.rgb[2] / 255.0
            };
          }
        }

        switch (fontFamily) {
          case "serif":
            font = FONT_FACES.SERIF;
            break;
          case "monospaced":
            font = FONT_FACES.MONO;
            break;
          case "fantasy":
            font = FONT_FACES.COMIC;
            break;
          case "ui-rounded":
            font = FONT_FACES.COMIC2;
            break;
          case "cursive":
            font = FONT_FACES.WRITING;
            break;
        }

        mediaOptions.font = font;
        mediaOptions.fitContent = fitContent;
        mediaOptions.foregroundColor = mediaForegroundColor;
        mediaOptions.backgroundColor = mediaBackgroundColor;
      }

      const isLocked = el.getAttribute("draggable") === null;
      const addMediaOptions = {
        src,
        contents,
        contentOrigin: ObjectContentOrigins.URL,
        contentSubtype,
        resolve,
        animate: false,
        fitToBox: false,
        mediaOptions,
        networkId: id,
        // Set the owner to 'world', which allows in-flight modifications from other clients that join to win
        networkedOwner: "world",
        skipLoader: true,
        contentType: type,
        locked: isLocked
      };

      const { entity } = (transform ? addMedia : addMediaInFrontOfPlayer)(addMediaOptions);

      const object3D = entity.object3D;

      if (transform) {
        const [pos, rot, scale] = parseTransformIntoThree(transform);
        const height = terrainSystem.getTerrainHeightAtWorldCoord(pos.x, pos.z);
        pos.y += height;

        const matrix = new THREE.Matrix4();
        matrix.compose(
          pos,
          rot,
          scale
        );

        pendingCount++;

        entity.addEventListener(
          "media-view-added",
          () => {
            object3D.applyMatrix4(matrix);
            pendingCount--;
          },
          { once: true }
        );

        entity.addEventListener(
          "media-loader-failed",
          () => {
            pendingCount--;
          },
          { once: true }
        );
      }
    }

    await new Promise(res => {
      // Wait until all new media is loaded before we begin tracking
      // framerate again.
      const interval = setInterval(() => {
        if (pendingCount === 0) {
          clearInterval(interval);

          // Hacky, other place where tracking is stopped is in jel.js
          // when doucment is blurred.
          if (!document.body.classList.contains("paused")) {
            autoQualitySystem.startTracking();
          }

          res();
        }
      }, 250);
    });
  }
}
