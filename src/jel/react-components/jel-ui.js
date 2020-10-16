import React from "react";
import PropTypes from "prop-types";
import HubTrail from "./hub-trail";
import styled, { ThemeProvider } from "styled-components";
import { dark } from "./theme";

const Wrap = styled.div`
  color: ${p => p.theme.text};
  pointer-events: none;
  height: 100%;
  top: 0;
  left: var(--scene-left);
  width: calc(100% - var(--scene-right) - var(--scene-left));
  position: fixed;
  z-index: 4;
  background: linear-gradient(180deg, rgba(64, 64, 64, 0.4) 0%, rgba(32, 32, 32, 0) 128px);
`;

function JelUI({ treeManager, hubCan, hub }) {
  const tree = treeManager && treeManager.sharedNav;
  const hubMetadata = tree && tree.atomMetadata;
  const hubTrailHubIds = (tree && hub && tree.getAtomTrailForAtomId(hub.hub_id)) || (hub && [hub.hub_id]) || [];

  return (
    <ThemeProvider theme={dark}>
      <Wrap>
        <HubTrail hubMetadata={hubMetadata} hubCan={hubCan} hubIds={hubTrailHubIds} />
      </Wrap>
    </ThemeProvider>
  );
}

JelUI.propTypes = {
  treeManager: PropTypes.object,
  //history: PropTypes.object,
  hub: PropTypes.object,
  //spaceCan: PropTypes.func,
  hubCan: PropTypes.func
  //orgPresences: PropTypes.object,
  //hubPresences: PropTypes.object,
  //sessionId: PropTypes.string,
  //spaceId: PropTypes.string,
  //memberships: PropTypes.array
};

export default JelUI;
