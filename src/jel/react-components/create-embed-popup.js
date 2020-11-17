import PropTypes from "prop-types";
import React, { forwardRef } from "react";
import ReactDOM from "react-dom";
import CreateEmbedInputPanel from "./create-embed-input-panel";
import { waitForDOMContentLoaded } from "../../hubs/utils/async-utils";
import sharedStyles from "../assets/stylesheets/shared.scss";

let popupRoot = null;
waitForDOMContentLoaded().then(() => (popupRoot = document.getElementById("jel-popup-root")));

const CreateEmbedPopup = forwardRef(({ styles, attributes, setPopperElement, onURLEntered, embedType }, ref) => {
  const popupInput = (
    <div
      tabIndex={-1} // Ensures can be focused
      className={sharedStyles.showWhenPopped}
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
    >
      <CreateEmbedInputPanel
        className={sharedStyles.slideDownWhenPopped}
        embedType={embedType}
        onURLEntered={onURLEntered}
        ref={ref}
      />
    </div>
  );

  return ReactDOM.createPortal(popupInput, popupRoot);
});

CreateEmbedPopup.displayName = "CreateEmbedPopup";
CreateEmbedPopup.propTypes = {
  styles: PropTypes.object,
  attributes: PropTypes.object,
  setPopperElement: PropTypes.func,
  embedType: PropTypes.string,
  onURLEntered: PropTypes.func
};

export default CreateEmbedPopup;