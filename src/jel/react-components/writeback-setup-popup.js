import React, { useCallback } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { waitForShadowDOMContentLoaded } from "../../hubs/utils/async-utils";
import PopupPanelMenu from "./popup-panel-menu";
import FolderAccessRequestPanel from "./folder-access-request-panel";

let popupRoot = null;
waitForShadowDOMContentLoaded().then(() => (popupRoot = DOM_ROOT.getElementById("jel-popup-root")));

const WritebackSetupPopup = ({ setPopperElement, styles, attributes, hub, children }) => {
  console.log(hub);

  const onChooseFolderClicked = useCallback(e => {
    e.preventDefault();
  }, []);

  const contents = <FolderAccessRequestPanel onAccessClicked={onChooseFolderClicked} />;

  const popupInput = (
    <div
      tabIndex={-1} // Ensures can be focused
      className="show-when-popped"
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
    >
      <PopupPanelMenu style={{ padding: "32px 0px", borderRadius: "12px" }} className="slide-up-when-popped">
        {contents}
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

WritebackSetupPopup.propTypes = {
  hub: PropTypes.object
};

export { WritebackSetupPopup as default };