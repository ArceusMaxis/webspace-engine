import PropTypes from "prop-types";
import React, { forwardRef } from "react";
import ReactDOM from "react-dom";
import ChatInputPanel from "./chat-input-panel";
import { waitForDOMContentLoaded } from "../../hubs/utils/async-utils";
import sharedStyles from "../../assets/jel/stylesheets/shared.scss";

let popupRoot = null;
waitForDOMContentLoaded().then(() => (popupRoot = document.getElementById("jel-popup-root")));

const ChatInputPopup = forwardRef(
  ({ styles, attributes, setPopperElement, onMessageEntered, onEntryComplete }, ref) => {
    const popupInput = (
      <div
        tabIndex={-1} // Ensures can be focused
        className={sharedStyles.showWhenPopped}
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
      >
        <ChatInputPanel
          className={sharedStyles.slideDownWhenPopped}
          onMessageEntered={onMessageEntered}
          onEntryComplete={onEntryComplete}
          ref={ref}
        />
      </div>
    );

    return ReactDOM.createPortal(popupInput, popupRoot);
  }
);

ChatInputPopup.displayName = "ChatInputPopup";
ChatInputPopup.propTypes = {
  styles: PropTypes.object,
  attributes: PropTypes.object,
  setPopperElement: PropTypes.func,
  onMessageEntered: PropTypes.func,
  onEntryComplete: PropTypes.func
};

export default ChatInputPopup;