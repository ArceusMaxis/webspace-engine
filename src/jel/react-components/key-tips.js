import styled from "styled-components";
import { FormattedMessage } from "react-intl";
import React, { forwardRef, useState, useEffect } from "react";

const KeyTipsElement = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  height: fit-content;
  border-radius: 6px;
  padding: 12px 24px;
  margin: 6px 0;
  user-select: none;
`;

const KeyTipItem = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  margin: 0;
  border-radius: 8px;
  padding: 6px 10px;

  &.highlight {
    margin: 8px 0;
    box-shadow: 0px 0px 6px var(--canvas-overlay-highlight-color);
  }
`;

const KeyTipButton = styled.button`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  margin: 6px 0;
  appearance: none;
  -moz-appearance: none;
  -webkit-appearance: none;
  outline-style: none;
  background: transparent;
  border: 0;
  text-align: left;
`;

const LetterKey = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 28px;
  height: 28px;
  border-radius: 5px;
  background-color: rgba(32, 32, 32, 0.2);
  box-shadow: inset 0px 1px 4px rgba(32, 32, 32, 0.6);
  backdrop-filter: blur(8px);

  body.low-detail & {
    backdrop-filter: none;
  }

  color: var(--canvas-overlay-text-color);
  text-transform: uppercase;
  font: var(--key-label-font);
`;

const BigLetterKey = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 28px;
  height: 28px;
  border-radius: 5px;
  background-color: rgba(32, 32, 32, 0.2);
  box-shadow: inset 0px 1px 4px rgba(32, 32, 32, 0.6);
  backdrop-filter: blur(8px);

  body.low-detail & {
    backdrop-filter: none;
  }

  color: var(--canvas-overlay-text-color);
  text-transform: uppercase;
  font: var(--big-key-label-font);
`;

const NamedKey = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  height: 28px;
  border-radius: 5px;
  padding: 0 14px;
  color: var(--canvas-overlay-text-color);
  font-size: var(--canvas-overlay-tertiary-text-size);
  background-color: rgba(32, 32, 32, 0.2);
  box-shadow: inset 0px 1px 3px rgba(32, 32, 32, 0.6);
  backdrop-filter: blur(2px);

  body.low-detail & {
    backdrop-filter: none;
  }

  font: var(--key-label-font);
  white-space: nowrap;

  .caps {
    text-transform: uppercase;
  }
`;

const WideNamedKey = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  height: 18px;
  height: 28px;
  border-radius: 5px;
  padding: 0 24px;
  color: var(--canvas-overlay-text-color);
  background-color: rgba(32, 32, 32, 0.2);
  box-shadow: inset 0px 1px 3px rgba(32, 32, 32, 0.6);
  backdrop-filter: blur(2px);

  body.low-detail & {
    backdrop-filter: none;
  }

  font: var(--key-label-font);
  white-space: nowrap;
`;

const TipLabel = styled.div`
  width: 60px;
  font-weight: var(--canvas-overlay-item-secodary-text-weight);
  color: var(--canvas-overlay-text-color);
  font-size: var(--canvas-overlay-text-size);
  text-shadow: 0px 0px 4px var(--menu-shadow-color);
  margin-left: 16px;
`;

const KeyWideSeparator = styled.div`
  margin: 0px 12px;
  font-weight: var(--canvas-overlay-item-text-weight);
  color: var(--canvas-overlay-text-color);
  font-size: var(--canvas-overlay-tertiary-text-size);
  text-shadow: 0px 0px 4px var(--menu-shadow-color);
`;

const KeySeparator = styled.div`
  margin: 0px 6px;
  font-weight: var(--canvas-overlay-item-text-weight);
  color: var(--canvas-overlay-text-color);
  font-size: var(--canvas-overlay-tertiary-text-size);
  text-shadow: 0px 0px 4px var(--menu-shadow-color);
`;

const KeySmallSeparator = styled.div`
  margin: 0px 4px;
  font-weight: var(--canvas-overlay-item-text-weight);
  color: var(--canvas-overlay-text-color);
  font-size: var(--canvas-overlay-tertiary-text-size);
  text-shadow: 0px 0px 4px var(--menu-shadow-color);
`;

const objectCommonTips = [
  ["move", "T;I"],
  ["open", "o"],
  ["rotate", "_r"],
  ["scale", "_v"],
  ["focus", "_f"],
  ["clone", "c"],
  ["bake", "b"],
  ["ground", "g"],
  ["remove", "x x"]
];

const TIP_DATA = {
  closed: [["help", "?"]],
  idle_panels: [
    ["move", "w a s d"],
    ["look", "H;G", "narrowMouseLook"],
    ["run", "H"],
    ["create", "/", "createMenu"],
    ["paste", "L+v"],
    ["chat", "E", "chat"],
    ["widen", "H+S", "widen"],
    ["hide", "?"]
  ],
  idle_full_muted: [
    ["move", "w a s d"],
    ["run", "H"],
    ["unmute", "L+m", "toggleMuteKey"],
    ["paste", "L+v"],
    ["create", "/", "createMenu"],
    ["chat", "E", "chat"],
    ["narrow", "Z|H+S"],
    ["hide", "?"]
  ],
  idle_full_unmuted: [
    ["move", "w a s d"],
    ["run", "H"],
    ["mute", "L+m", "toggleMuteKey"],
    ["paste", "L+v"],
    ["create", "/", "createMenu"],
    ["chat", "E", "chat"],
    ["narrow", "Z|H+S"],
    ["hide", "?"]
  ],
  pointer_exited_muted: [["unmute", "L+m", "toggleMuteKey"], ["hide", "?"]],
  pointer_exited_unmuted: [["mute", "L+m", "toggleMuteKey"], ["hide", "?"]],
  holding_interactable: [["pull", "R"], ["scale", "H+R"], ["guides", "q\\e"]],
  hover_interactable: objectCommonTips.filter(x => x[0] !== "bake" && x[0] !== "ground"),
  hover_bakable_interactable: objectCommonTips.filter(x => x[0] !== "ground"),
  hover_groundable_interactable: objectCommonTips.filter(x => x[0] !== "bake"),
  hover_bakable_groundable_interactable: objectCommonTips,
  video_playing: [["pause", "L+S"], ["seek", "q\\e"], ["volume", "R;t\\g"], ...objectCommonTips],
  video_paused: [["play", "L+S"], ["seek", "q\\e"], ["volume", "R;t\\g"], ...objectCommonTips],
  pdf: [["next", "L+S"], ["page", "q\\e"], ...objectCommonTips],
  text: [
    ["edit", "~", "mediaTextEdit"],
    ["color", "q\\e"],
    ["font", "t\\g"],
    ...objectCommonTips.filter(t => t[0] !== "open")
  ],
  rotate: [["rotate", "G"], ["roll", "H+G"], ["guides", "q\\e"]],
  scale: [["scale", "G"]],
  focus: [["zoom", "R"]],
  text_editor: [
    ["close", "~", "mediaTextEditClose"],
    ["bold", "L+b"],
    ["italic", "L+i"],
    ["underline", "L+u"],
    ["list", "-,S"]
  ]
};

const KEY_TIP_TYPES = Object.keys(TIP_DATA);

const itemForData = ([label, keys, flag]) => {
  const tipLabel = (
    <TipLabel key={label}>
      <FormattedMessage id={`key-tips.${label}`} />
    </TipLabel>
  );

  // Hacky, if key is _ then the next key is labelled "hold"
  let hold = false;

  const keyLabels = keys.split("").map(key => {
    if (key === "_") {
      hold = true;
      return null;
    }

    const els = [];

    if (hold) {
      els.push(
        <NamedKey key={key}>
          <FormattedMessage id="key-tips.hold" />&nbsp;&nbsp;<span className="caps">{key}</span>
        </NamedKey>
      );
    } else {
      if (key === "S") {
        els.push(
          <WideNamedKey key={key}>
            <FormattedMessage id="key-tips.space" />
          </WideNamedKey>
        );
      } else if (key === "E") {
        els.push(
          <NamedKey key={key}>
            <FormattedMessage id="key-tips.enter" />
          </NamedKey>
        );
      } else if (key === "H") {
        els.push(
          <NamedKey key={key}>
            <FormattedMessage id="key-tips.shift" />
          </NamedKey>
        );
      } else if (key === "R") {
        els.push(
          <NamedKey key={key}>
            <FormattedMessage id="key-tips.scroll" />
          </NamedKey>
        );
      } else if (key === "T") {
        els.push(
          <NamedKey key={key}>
            <FormattedMessage id="key-tips.tab" />
          </NamedKey>
        );
      } else if (key === "G") {
        els.push(
          <NamedKey key={key}>
            <FormattedMessage id="key-tips.leftDrag" />
          </NamedKey>
        );
      } else if (key === "I") {
        els.push(
          <NamedKey key={key}>
            <FormattedMessage id="key-tips.rightDrag" />
          </NamedKey>
        );
      } else if (key === "Z") {
        els.push(
          <NamedKey key={key}>
            <FormattedMessage id="key-tips.escape" />
          </NamedKey>
        );
      } else if (key === "L") {
        els.push(
          <NamedKey key={key}>
            <FormattedMessage id="key-tips.control" />
          </NamedKey>
        );
      } else if (key === " ") {
        els.push(<KeySeparator key={key} />);
      } else if (key === "|") {
        els.push(
          <KeyWideSeparator key={key}>
            <FormattedMessage id="key-tips.or" />
          </KeyWideSeparator>
        );
      } else if (key === "+") {
        els.push(<KeySmallSeparator key={key}>{key}</KeySmallSeparator>);
      } else if (key === ",") {
        els.push(<KeySeparator key={key}>{key}</KeySeparator>);
      } else if (key === ";") {
        els.push(<KeySeparator key={key}>or</KeySeparator>);
      } else if (key === "^") {
        els.push(<KeySeparator key={key}>-</KeySeparator>);
      } else if (key === "\\") {
        els.push(<KeySeparator key={key}>/</KeySeparator>);
      } else if (key === " ") {
        els.push(<KeySeparator key={key}>&nbsp;</KeySeparator>);
      } else if (key === "~" || key === "*" || key === "-") {
        // Some characters are hard to see
        els.push(<BigLetterKey key={key}>{key}</BigLetterKey>);
      } else {
        els.push(<LetterKey key={key}>{key}</LetterKey>);
      }
    }

    hold = false;

    return els;
  });

  // Allow clicking on help item
  const style = label === "help" || label === "hide" ? { pointerEvents: "auto" } : null;
  const component = label === "help" || label === "hide" ? KeyTipButton : KeyTipItem;

  let className = "";

  if (flag && !window.APP.store.state.activity[flag]) {
    if (flag === "chat") {
      // Special case: highlight chat when others are co-present
      const hubChannel = window.APP.hubChannel;

      const hasOtherOccupants =
        hubChannel.presence && hubChannel.presence.state && Object.entries(hubChannel.presence.state).length > 1;
      className = hasOtherOccupants ? "highlight" : "";
    } else {
      className = "highlight";
    }
  }

  return React.createElement(component, { key: label, style: style, className }, [keyLabels, tipLabel]);
};

const genTips = tips => {
  return (
    <KeyTipsElement key={tips} className={tips}>
      {TIP_DATA[tips].map(itemForData)}
    </KeyTipsElement>
  );
};

const KeyTipChooser = styled.div`
  & > div {
    opacity: 0;
    transition: opacity 75ms linear;
  }

  ${KEY_TIP_TYPES.map(
    type =>
      `&[data-show-tips="${type}"] .${type} {
      transition-duration: 25ms;
      opacity: 1;
    }`
  )};
`;

const KeyTips = forwardRef((props, ref) => {
  const [flagVersion, setFlagVersion] = useState(0);
  const store = window.APP.store;

  useEffect(
    () => {
      const handler = () => setFlagVersion(flagVersion + 1);
      store.addEventListener("activityflagged", handler);
      return () => store.removeEventListener("activityflagged", handler);
    },
    [store, flagVersion]
  );

  return (
    <KeyTipChooser {...props} ref={ref}>
      {[...Object.keys(TIP_DATA)].map(genTips)}
    </KeyTipChooser>
  );
});

KeyTips.displayName = "KeyTips";
KeyTips.propTypes = {};

export { KeyTips as default, KEY_TIP_TYPES };
