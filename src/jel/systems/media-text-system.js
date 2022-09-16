import * as Y from "yjs";
import { htmlToDelta, getQuill, destroyQuill } from "../utils/quill-pool";
import { FONT_FACES } from "../utils/quill-utils";
import { getNetworkId } from "../utils/ownership-utils";

const MAX_COMPONENTS = 128;
const SCROLL_SENSITIVITY = 500.0;

const SYNC_STATES = {
  UNSYNCED: 0, // Not synced at all
  PENDING: 1, // Doc requested, but not synced
  SYNCED: 2 // Actively synced
};

// Notes on syncing:
//
// We can't just use the ydoc that we construct from the DOM since if people are editing
// then the DOM-constructed ydoc and the dynamically updated ydoc will be incompatible.
//
// So the ydocs in this system start out as 'candidate' ydocs, and then when the first person
// enters presence as an editor their ydoc is the defaco genesis ydoc.
//
// Basic algorithm:
//   - In presence, keep a list of network ids of media texts that you are actively part of
//     the gossip ring for it.
//
//   - If you start editing a media text, check if anyone else is in the ring in presence for it.
//     - If not, your ydoc is the one everyone will start from. Register yourself into presence
//       and proceed as normal. Others will now start sending requests for you to sync up.
//
//     - If so, request the ydoc from anyone in the ring. Once you get it, register yourself in presence,
//       replace your ydoc (clobbering any local changes made since then, sadly) and re-render.
//
// You should always be listening for messages to get the ydoc, and if a message comes in you need to
// either queue it if you haven't joined the ring yet, or apply it if you have. When you have an op to
// contribute broadcast it to the ring.
export class MediaTextSystem extends EventTarget {
  constructor(sceneEl) {
    super();
    this.sceneEl = sceneEl;
    this.components = Array(MAX_COMPONENTS).fill(null);
    this.quills = Array(MAX_COMPONENTS).fill(null);
    this.yjsTypes = Array(MAX_COMPONENTS).fill(null);
    this.dirty = Array(MAX_COMPONENTS).fill(false);
    this.textChangeHandlers = Array(MAX_COMPONENTS).fill(null);
    this.markComponentDirtyFns = Array(MAX_COMPONENTS).fill(null);
    this.quillObserverFns = Array(MAX_COMPONENTS).fill(null);
    this.typeObserverFns = Array(MAX_COMPONENTS).fill(null);

    this.networkIdToComponent = new Map();
    this.networkIdToSyncState = new Map();

    this.maxIndex = -1;

    this.sceneEl.addEventListener("presence-synced", this.onPresenceSynced.bind(this));
  }

  registerMediaTextComponent(component) {
    const networkId = getNetworkId(component.el);
    if (!networkId) return;

    this.networkIdToComponent.set(networkId, component);
    this.networkIdToSyncState.set(networkId, SYNC_STATES.UNSYNCED);

    for (let i = 0; i <= this.maxIndex; i++) {
      if (this.components[i] === null) {
        this.components[i] = component;
        this.maxIndex = Math.max(this.maxIndex, i);
        return;
      }
    }

    this.components[++this.maxIndex] = component;
  }

  initializeTextEditor(component, force = true, initialContents = null) {
    const index = this.components.indexOf(component);
    if (index === -1) return;
    const networkId = getNetworkId(component.el);

    if (force) {
      this.unbindQuill(component);
    }

    let quill = this.quills[index];
    if (quill) return;

    this.markComponentDirtyFns[index] = () => this.markDirty(component);
    quill = this.quills[index] = getQuill(networkId);

    const ydoc = new Y.Doc();
    const type = ydoc.getText("quill");
    this.yjsTypes[index] = type;

    const negatedFormats = {};

    this.typeObserverFns[index] = event => {
      if (event.transaction.origin === this) return;

      const delta = [];
      for (const d of event.delta) {
        if (d.insert !== undefined) {
          // We always explicitly set attributes, otherwise concurrent edits may
          // result in quill assuming that a text insertion shall inherit existing
          // attributes.
          delta.push(Object.assign({}, d, { attributes: Object.assign({}, this.negatedFormats, d.attributes || {}) }));
        } else {
          delta.push(d);
        }
      }

      quill.updateContents(delta, this);
    };

    this.quillObserverFns[index] = (eventType, delta, state, origin) => {
      if (delta && delta.ops) {
        for (const op of delta.ops) {
          if (op.attributes) {
            for (const key in op.attributes) {
              if (negatedFormats[key] === undefined) {
                negatedFormats[key] = false;
              }
            }
          }
        }

        if (origin !== this) {
          ydoc.transact(() => {
            type.applyDelta(delta.ops);
          }, this);
        }
      }
    };

    if (initialContents) {
      const delta = htmlToDelta(initialContents);

      if (delta.ops.length > 1) {
        // Conversion will add trailing newline, which we don't want.
        const op = delta.ops[delta.ops.length - 1];

        // This doesn't fix all trailing newlines, for example a one-line label will
        // have a newline when cloned
        if (op.insert === "\n" && !op.attributes) {
          delta.ops.pop();
        }
      }

      type.applyDelta(delta.ops);
    }

    quill.setContents(type.toDelta(), this);

    type.observe(this.typeObserverFns[index]);
    quill.on("editor-change", this.quillObserverFns[index]);
    quill.on("text-change", this.markComponentDirtyFns[index]);
    quill.container.querySelector(".ql-editor").addEventListener("scroll", this.markComponentDirtyFns[index]);

    this.applyFont(component);
  }

  applyFont(component) {
    const index = this.components.indexOf(component);
    if (index === -1) return;
    const quill = this.quills[index];
    if (!quill) return;

    const { font } = component.data;
    const classList = quill.container.querySelector(".ql-editor").classList;

    classList.remove("font-sans-serif");
    classList.remove("font-serif");
    classList.remove("font-mono");
    classList.remove("font-comic");
    classList.remove("font-comic2");
    classList.remove("font-writing");

    if (font === FONT_FACES.SANS_SERIF) {
      classList.add("font-sans-serif");
    } else if (font === FONT_FACES.SERIF) {
      classList.add("font-serif");
    } else if (font === FONT_FACES.MONO) {
      classList.add("font-mono");
    } else if (font === FONT_FACES.COMIC) {
      classList.add("font-comic");
    } else if (font === FONT_FACES.COMIC2) {
      classList.add("font-comic2");
    } else if (font === FONT_FACES.WRITING) {
      classList.add("font-writing");
    }

    this.markDirty(component);

    // Hack, quill needs to be re-rendered after a slight delay to deal with
    // cases where CSS relayout may not immediately occur (likely when concurrent
    // work is occuring.)
    //
    // Otherwise text will be clipped when changing fonts since the clientWidth/Height
    // of the inner elements is stale.
    setTimeout(() => this.markDirty(component), 500);
  }

  scrollBy(component, amount) {
    const index = this.components.indexOf(component);
    if (index === -1) return;
    const quill = this.quills[index];
    if (!amount || !quill) return;

    const scrollDistance = Math.floor(-amount * SCROLL_SENSITIVITY);
    quill.container.querySelector(".ql-editor").scrollBy(0, scrollDistance);

    this.markDirty(component);
  }

  unbindQuill(component) {
    const index = this.components.indexOf(component);
    if (index === -1) return;
    const quill = this.quills[index];
    if (!quill) return;
    const type = this.yjsTypes[index];
    const networkId = getNetworkId(component.el);

    quill.off("text-change", this.markComponentDirtyFns[index]);
    quill.off("editor-change", this.quillObserverFns[index]);
    quill.container.querySelector(".ql-editor").removeEventListener("scroll", this.markComponentDirtyFns[index]);
    type.unobserve(this.typeObserverFns[index]);
    this.textChangeHandlers[index] = null;
    this.markComponentDirtyFns[index] = null;
    this.quillObserverFns[index] = null;
    this.quills[index] = null;
    this.yjsTypes[index] = null;

    destroyQuill(networkId);
  }

  unregisterMediaTextComponent(component) {
    const index = this.components.indexOf(component);
    if (index === -1) return;

    const networkId = getNetworkId(component.el);
    this.networkIdToComponentIndex.delete(networkId);
    this.networkIdToSyncState.delete(networkId);

    this.unbindQuill(component);

    this.components[index] = null;

    for (let i = 0; i < this.components.length; i++) {
      if (this.components[i] === null) continue;
      this.maxIndex = Math.max(this.maxIndex, i);
    }
  }

  markDirty(component) {
    const index = this.components.indexOf(component);
    if (index === -1) return;

    this.dirty[index] = true;
  }

  tick() {
    for (let i = 0; i <= this.maxIndex; i++) {
      const component = this.components[i];
      if (component === null) continue;

      if (this.dirty[i]) {
        component.render();
        this.dirty[i] = false;
      }
    }
  }

  getQuill(component) {
    const index = this.components.indexOf(component);
    if (index === -1) return null;
    return this.quills[index];
  }

  onPresenceSynced() {
    let networkIdsToRequestSync = null;

    // Search for any new components that need to be synced
    for (const state of NAF.connection.presence.states.values()) {
      const clientId = state.client_id;
      if (!clientId || NAF.clientId === clientId) continue;
      if (!state.syncedObjects) continue;

      for (const { type, networkId } of state.syncedObjects) {
        if (type !== "text") continue;
        if (!this.networkIdToComponentIndex.has(networkId)) continue;

        const syncState = this.networkIdToSyncState.get(networkId) || SYNC_STATES.UNSYNCED;

        if (syncState !== SYNC_STATES.UNSYNCED) continue;
        if (networkIdsToRequestSync === null) networkIdsToRequestSync = new Set();
        networkIdsToRequestSync.add(networkId);
      }
    }

    if (networkIdsToRequestSync === null) return;

    for (const networkId of networkIdsToRequestSync) {
      this.requestSync(networkId);
      this.networkIdToSyncState.set(networkId, SYNC_STATES.PENDING);
    }
  }
}
