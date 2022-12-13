import { sets } from "./sets";
import { isUI } from "../interactions";
import { CAMERA_MODE_INSPECT } from "../camera-system";
import { isInEditableField } from "../../utils/dom-utils";
import qsTruthy from "../../utils/qs_truthy";

const debugUserInput = qsTruthy("dui");

let leftTeleporter, rightTeleporter, transformSystem, scalingSystem;

export function resolveActionSets() {
  leftTeleporter =
    leftTeleporter ||
    (DOM_ROOT.getElementById("player-left-controller") &&
      DOM_ROOT.getElementById("player-left-controller").components.teleporter);
  rightTeleporter =
    rightTeleporter ||
    (DOM_ROOT.getElementById("player-right-controller") &&
      DOM_ROOT.getElementById("player-right-controller").components.teleporter);
  if (!leftTeleporter || !rightTeleporter) return;
  const userinput = AFRAME.scenes[0].systems.userinput;
  const { leftHand, rightHand, rightRemote, leftRemote } = AFRAME.scenes[0].systems.interaction.state;

  transformSystem = transformSystem || AFRAME.scenes[0].systems["transform-selected-object"];
  scalingSystem = scalingSystem || AFRAME.scenes[0].systems["scale-object"];

  const transforming = (transformSystem && transformSystem.transforming) || (scalingSystem && scalingSystem.isScaling);

  userinput.toggleSet(sets.leftHandHoldingInteractable, leftHand.held);
  userinput.toggleSet(sets.rightHandHoldingInteractable, rightHand.held);
  userinput.toggleSet(sets.leftCursorHoldingInteractable, leftRemote.held);
  userinput.toggleSet(sets.rightCursorHoldingInteractable, rightRemote.held);

  userinput.toggleSet(
    sets.leftHandHoveringOnNothing,
    !leftRemote.held && !leftRemote.hovered && !leftHand.held && !leftHand.hovered && !transforming
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnNothing,
    !rightRemote.held && !rightRemote.hovered && !rightHand.held && !rightHand.hovered && !transforming
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnNothing,
    !leftHand.held && !leftHand.hovered && !leftRemote.held && !leftRemote.hovered && !transforming
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnNothing,
    !rightHand.held && !rightHand.hovered && !rightRemote.held && !rightRemote.hovered && !transforming
  );

  userinput.toggleSet(
    sets.leftHandHoveringOnPen,
    !leftHand.held &&
      leftHand.hovered &&
      leftHand.hovered.components.tags &&
      leftHand.hovered.components.tags.data.isPen
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnPen,
    !rightHand.held &&
      rightHand.hovered &&
      rightHand.hovered.components.tags &&
      rightHand.hovered.components.tags.data.isPen
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnPen,
    !leftHand.held &&
      !leftHand.hovered &&
      !leftRemote.held &&
      leftRemote.hovered &&
      leftRemote.hovered.components.tags &&
      leftRemote.hovered.components.tags.data.isPen
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnPen,
    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      rightRemote.hovered.components.tags &&
      rightRemote.hovered.components.tags.data.isPen
  );

  userinput.toggleSet(
    sets.leftHandHoveringOnCamera,
    !leftHand.held && leftHand.hovered && leftHand.hovered.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnCamera,
    !rightHand.held && rightHand.hovered && rightHand.hovered.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnCamera,
    !leftHand.held &&
      !leftHand.hovered &&
      !leftRemote.held &&
      leftRemote.hovered &&
      leftRemote.hovered.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnCamera,
    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      rightRemote.hovered.components["camera-tool"]
  );

  userinput.toggleSet(
    sets.leftHandHoveringOnInteractable,
    !leftHand.held &&
      leftHand.hovered &&
      ((leftHand.hovered.components.tags && leftHand.hovered.components.tags.data.offersHandConstraint) ||
        leftHand.hovered.components["super-spawner"]) &&
      !transforming
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnInteractable,
    !rightHand.held &&
      rightHand.hovered &&
      ((rightHand.hovered.components.tags && rightHand.hovered.components.tags.data.offersHandConstraint) ||
        rightHand.hovered.components["super-spawner"]) &&
      !transforming
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnInteractable,
    !leftHand.held &&
      !leftHand.hovered &&
      !leftRemote.held &&
      leftRemote.hovered &&
      ((leftRemote.hovered.components.tags && leftRemote.hovered.components.tags.data.offersRemoteConstraint) ||
        (leftRemote.hovered.components.tags && leftRemote.hovered.components.tags.data.togglesHoveredActionSet) ||
        leftRemote.hovered.components["super-spawner"]) &&
      !transforming
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnInteractable,
    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      ((rightRemote.hovered.components.tags && rightRemote.hovered.components.tags.data.offersRemoteConstraint) ||
        (rightRemote.hovered.components.tags && rightRemote.hovered.components.tags.data.togglesHoveredActionSet) ||
        rightRemote.hovered.components["super-spawner"]) &&
      !transforming
  );

  userinput.toggleSet(
    sets.leftHandHoveringOnVideo,
    !leftHand.held && leftHand.hovered && leftHand.hovered.components["media-video"] && !transforming
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnVideo,
    !rightHand.held && rightHand.hovered && rightHand.hovered.components["media-video"] && !transforming
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnVideo,
    !leftHand.held &&
      !leftHand.hovered &&
      !leftRemote.held &&
      leftRemote.hovered &&
      leftRemote.hovered.components["media-video"] &&
      !transforming
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnVideo,
    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      rightRemote.hovered.components["media-video"] &&
      !transforming
  );

  userinput.toggleSet(
    sets.leftHandHoldingPen,
    leftHand.held && leftHand.held.components.tags && leftHand.held.components.tags.data.isPen
  );
  userinput.toggleSet(
    sets.rightHandHoldingPen,
    rightHand.held && rightHand.held.components.tags && rightHand.held.components.tags.data.isPen
  );
  userinput.toggleSet(
    sets.rightCursorHoldingPen,
    !rightHand.held &&
      !rightHand.hovered &&
      rightRemote.held &&
      rightRemote.held.components.tags &&
      rightRemote.held.components.tags.data.isPen
  );
  userinput.toggleSet(
    sets.leftCursorHoldingPen,
    !leftHand.held &&
      !leftHand.hovered &&
      leftRemote.held &&
      leftRemote.held.components.tags &&
      leftRemote.held.components.tags.data.isPen
  );
  userinput.toggleSet(sets.leftHandHoldingCamera, leftHand.held && leftHand.held.components["camera-tool"]);
  userinput.toggleSet(sets.rightHandHoldingCamera, rightHand.held && rightHand.held.components["camera-tool"]);
  userinput.toggleSet(
    sets.leftCursorHoldingCamera,
    !leftHand.held && !leftHand.hovered && leftRemote.held && leftRemote.held.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.rightCursorHoldingCamera,
    !rightHand.held && !rightHand.hovered && rightRemote.held && rightRemote.held.components["camera-tool"]
  );

  userinput.toggleSet(
    sets.leftCursorHoveringOnUI,
    !leftHand.held && !leftHand.hovered && !leftRemote.held && isUI(leftRemote.hovered)
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnUI,
    !rightHand.held && !rightHand.hovered && !rightRemote.held && isUI(rightRemote.hovered)
  );

  userinput.toggleSet(sets.leftCursorHoldingNothing, !leftHand.held && !leftRemote.held && !transforming);
  userinput.toggleSet(sets.rightCursorHoldingNothing, !rightHand.held && !rightRemote.held && !transforming);

  userinput.toggleSet(
    sets.leftCursorHoldingUI,
    !leftHand.held &&
      !leftHand.hovered &&
      leftRemote.held &&
      leftRemote.held.components.tags &&
      leftRemote.held.components.tags.data.holdableButton
  );
  userinput.toggleSet(
    sets.rightCursorHoldingUI,
    !rightHand.held &&
      !rightHand.hovered &&
      rightRemote.held &&
      rightRemote.held.components.tags &&
      rightRemote.held.components.tags.data.holdableButton
  );

  userinput.toggleSet(sets.leftHandTeleporting, leftTeleporter.isTeleporting);
  userinput.toggleSet(sets.rightHandTeleporting, rightTeleporter.isTeleporting);
  userinput.toggleSet(sets.inputFocused, isInEditableField());
  userinput.toggleSet(sets.debugUserInput, debugUserInput);
  userinput.toggleSet(sets.transforming, transforming);

  if (AFRAME.scenes[0] && AFRAME.scenes[0].systems["hubs-systems"]) {
    userinput.toggleSet(
      sets.inspecting,
      AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.mode === CAMERA_MODE_INSPECT
    );
  }
}
