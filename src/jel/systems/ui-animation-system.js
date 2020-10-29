import BezierEasing from "bezier-easing";
import qsTruthy from "../../hubs/utils/qs_truthy";

// Used for managing the animation of the major UI panels

export const PANEL_EXPANSION_STATES = {
  EXPANDING: 0,
  EXPANDED: 1,
  COLLAPSING: 2,
  COLLAPSED: 3
};

const DEFAULT_NAV_PANEL_WIDTH = 400;
const DEFAULT_PRESENCE_PANEL_WIDTH = 220;
export const PANEL_EXPAND_DURATION_MS = 250;

const panelExpandStep = BezierEasing(0.12, 0.98, 0.18, 0.98);

export class UIAnimationSystem {
  constructor(sceneEl) {
    this.sceneEl = sceneEl;
    this.lastTickT = 0;
    this.panelExpansionState = PANEL_EXPANSION_STATES.EXPANDING;

    this.sceneLeft = -1;
    this.sceneRight = -1;
    this.panelExpandStartT = 0;
    this.setTargetSceneSizes();

    // Hacky, need to apply continuously until react renders DOM.
    const initialUIApplyInterval = setInterval(() => {
      if (!this.applyUI(this.targetSceneLeft, this.targetSceneRight)) return;
      clearInterval(initialUIApplyInterval);
    }, 250);

    // Initialize nav and presence width CSS vars to stored state.
    document.documentElement.style.setProperty("--nav-width", `${this.targetSceneLeft}px`);
    document.documentElement.style.setProperty("--presence-width", `${this.targetSceneRight}px`);
    window.addEventListener("resize", () => this.applySceneSize(null, null, true));
  }

  expandSidePanels() {
    this.performPanelExpansion(PANEL_EXPANSION_STATES.EXPANDING);
    this.sceneEl.emit("animated_resize_started");
  }

  collapseSidePanels() {
    this.performPanelExpansion(PANEL_EXPANSION_STATES.COLLAPSING);
    this.sceneEl.emit("animated_resize_started");
  }

  performPanelExpansion(newState) {
    if (
      this.panelExpansionState === PANEL_EXPANSION_STATES.EXPANDING ||
      this.panelExpansionState === PANEL_EXPANSION_STATES.COLLAPSING
    )
      return;

    this.panelExpansionState = newState;
    this.setTargetSceneSizes();
    this.panelExpandStartT = this.lastTickT;

    // Pre-emptively re-layout UI since doing it every frame causes FPS drop
    if (newState === PANEL_EXPANSION_STATES.EXPANDING) {
      this.applyUI(this.targetSceneLeft, this.targetSceneRight);
    } else {
      this.applyUI(0, 0);
    }
  }

  setTargetSceneSizes() {
    const store = window.APP.store;
    this.targetSceneLeft = store.state.uiState.navPanelWidth || DEFAULT_NAV_PANEL_WIDTH;
    this.targetSceneRight = store.state.uiState.presencePanelWidth || DEFAULT_PRESENCE_PANEL_WIDTH;
  }

  tick(t) {
    this.performPanelAnimationStep(t);
    this.lastTickT = t;
  }

  performPanelAnimationStep(t) {
    if (
      this.panelExpansionState === PANEL_EXPANSION_STATES.EXPANDED ||
      this.panelExpansionState === PANEL_EXPANSION_STATES.COLLAPSED
    )
      return;

    let animT = Math.min(1.0, Math.max(0.0, (t - this.panelExpandStartT) / PANEL_EXPAND_DURATION_MS));
    animT = panelExpandStep(animT);
    animT = this.panelExpansionState === PANEL_EXPANSION_STATES.EXPANDING ? animT : 1 - animT;

    const sceneLeft = Math.floor(animT * this.targetSceneLeft);
    const sceneRight = Math.floor(animT * this.targetSceneRight);

    if (sceneLeft !== this.sceneLeft || sceneRight !== this.sceneRight) {
      this.applySceneSize(sceneLeft, sceneRight);

      const width = document.body.clientWidth - sceneLeft - sceneRight;
      this.sceneEl.camera.aspect = width / this.sceneEl.canvas.height;
      this.sceneEl.camera.updateProjectionMatrix();
    } else {
      let finished = false;

      if (this.panelExpansionState === PANEL_EXPANSION_STATES.EXPANDING) {
        this.panelExpansionState = PANEL_EXPANSION_STATES.EXPANDED;
        finished = true;
      } else if (this.panelExpansionState === PANEL_EXPANSION_STATES.COLLAPSING) {
        this.panelExpansionState = PANEL_EXPANSION_STATES.COLLAPSED;
        finished = true;
      }

      if (finished) {
        this.sceneEl.resize();
        this.sceneEl.emit("animated_resize_complete");
      }
    }
  }

  applySceneSize(sceneLeft, sceneRight, includeUI = false) {
    if (sceneLeft !== null) {
      this.sceneLeft = sceneLeft;
    }

    if (sceneRight !== null) {
      this.sceneRight = sceneRight;
    }

    const width = document.body.clientWidth - this.sceneLeft - this.sceneRight;
    this.sceneEl.style.cssText = `left: ${this.sceneLeft}px; width: ${width}px;`;

    if (includeUI) {
      this.applyUI(this.sceneLeft, this.sceneRight);
    }
  }

  // Returns true if was applied successfully
  applyUI(left, right) {
    const width = document.body.clientWidth - left - right;
    const wrap = document.getElementById("jel-ui-wrap");
    if (wrap) {
      wrap.style.cssText = `left: ${left}px; width: ${width}px;`;

      if (left === 0) {
        wrap.classList.add("panels-expanded");
      } else {
        wrap.classList.remove("panels-expanded");
      }

      return true;
    } else {
      return false;
    }
  }
}
