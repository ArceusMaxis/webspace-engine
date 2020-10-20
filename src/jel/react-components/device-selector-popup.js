import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { FormattedMessage } from "react-intl";
import PropTypes from "prop-types";
import sharedStyles from "../assets/stylesheets/shared.scss";
import checkIcon from "../assets/images/icons/check.svgi";
import PopupPanelMenu, {
  PopupPanelMenuItem,
  PopupPanelMenuSectionHeader,
  PopupPanelMenuMessage
} from "./popup-panel-menu";
import { waitForDOMContentLoaded } from "../../hubs/utils/async-utils";

let popupRoot = null;
waitForDOMContentLoaded().then(() => (popupRoot = document.getElementById("jel-popup-root")));

const DeviceSelectorPopup = ({ scene, setPopperElement, styles, attributes, children, micDevices }) => {
  const [activeMicDeviceId, setSelectedMicDeviceId] = useState(null);

  useEffect(
    () => {
      const handleMicDeviceActivated = e => {
        const deviceId = e.detail;
        setSelectedMicDeviceId(deviceId);
      };

      scene.addEventListener("mic_stream_created", handleMicDeviceActivated);
      () => scene.removeEventListener("mic_stream_created", handleMicDeviceActivated);
    },
    [scene]
  );

  const micItems = (micDevices || []).map(({ deviceId, label }) => (
    <PopupPanelMenuItem
      iconSrc={activeMicDeviceId === deviceId ? checkIcon : null}
      onClick={() => {
        scene.emit("preferred_mic_changed", deviceId);
        document.activeElement.blur();
      }}
      key={deviceId}
    >
      {label}
    </PopupPanelMenuItem>
  ));

  const popupInput = (
    <div
      tabIndex={-1} // Ensures can be focused
      className={sharedStyles.showWhenPopped}
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
    >
      <PopupPanelMenu className={sharedStyles.slideUpWhenPopped}>
        <PopupPanelMenuSectionHeader key="mic-header">
          <FormattedMessage id="device-selector.mic-devices" />
        </PopupPanelMenuSectionHeader>
        {micItems.length === 0 && (
          <PopupPanelMenuMessage>
            <FormattedMessage id="device-selector.no-mics" />
          </PopupPanelMenuMessage>
        )}
        {micItems.length > 0 &&
          !activeMicDeviceId && (
            <PopupPanelMenuMessage key="no-mic-message'">
              <FormattedMessage id="device-selector.mic-inactive" />
            </PopupPanelMenuMessage>
          )}
        {micItems.length > 0 && activeMicDeviceId && micItems}
      </PopupPanelMenu>
      {children}
    </div>
  );

  return ReactDOM.createPortal(popupInput, popupRoot);
};

DeviceSelectorPopup.propTypes = {
  scene: PropTypes.object,
  micDevices: PropTypes.array
};

export { DeviceSelectorPopup as default };
