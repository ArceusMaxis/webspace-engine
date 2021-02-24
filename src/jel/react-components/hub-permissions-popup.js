import React, { useState, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import sharedStyles from "../../assets/jel/stylesheets/shared.scss";
import { waitForDOMContentLoaded } from "../../hubs/utils/async-utils";
import PopupPanelMenu from "./popup-panel-menu";
import PanelSectionHeader from "./panel-section-header";
import { FormattedMessage } from "react-intl";
import { PanelWrap, checkboxControlFor } from "./form-components";

let popupRoot = null;
waitForDOMContentLoaded().then(() => (popupRoot = document.getElementById("jel-popup-root")));

const HubPermissionsPopup = ({ setPopperElement, styles, attributes, hubMetadata, hub, children }) => {
  const [allowEditing, setAllowEditing] = useState(false);

  useEffect(
    () => {
      if (!hubMetadata || !hub) return () => {};

      const updatePermissions = () => {
        const spaceRole = hubMetadata.getMetadata(hub.hub_id).roles.space;
        setAllowEditing(spaceRole === "editor");
      };

      updatePermissions();

      hubMetadata.subscribeToMetadata(hub.hub_id, updatePermissions);
      return () => hubMetadata.unsubscribeFromMetadata(updatePermissions);
    },
    [setAllowEditing, hub, hubMetadata]
  );

  const allowEditingOnChange = useCallback(
    value => {
      const allowEditing = value;
      const newSpaceRole = allowEditing ? "editor" : "viewer";
      window.APP.hubChannel.updateSpaceMemberRole(newSpaceRole);
      setAllowEditing(allowEditing);
    },
    [setAllowEditing]
  );

  const popupInput = (
    <div
      tabIndex={-1} // Ensures can be focused
      className={sharedStyles.showWhenPopped}
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
    >
      <PopupPanelMenu style={{ padding: "32px 0px", borderRadius: "12px" }} className={sharedStyles.slideUpWhenPopped}>
        <PanelWrap>
          <PanelSectionHeader style={{ marginLeft: 0 }}>
            <FormattedMessage id="hub-permissions-popup.permissions" />
          </PanelSectionHeader>
          {checkboxControlFor(
            "notify_joins",
            "hub-permissions-popup.allow_editing",
            allowEditing,
            setAllowEditing,
            allowEditingOnChange
          )}
        </PanelWrap>
      </PopupPanelMenu>
      {children}
    </div>
  );

  if (popupRoot) {
    return ReactDOM.createPortal(popupInput, popupRoot);
  } else {
    return popupInput;
  }
};

HubPermissionsPopup.propTypes = {
  hub: PropTypes.object,
  hubMetadata: PropTypes.object
};

export { HubPermissionsPopup as default };
