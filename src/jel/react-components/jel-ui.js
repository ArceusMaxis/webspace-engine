import React, { useState, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import styled, { ThemeProvider } from "styled-components";
import { createHub } from "../../utils/phoenix-utils";
import "../assets/stylesheets/nav-tree.scss";
import Tree from "rc-tree";
import { pushHistoryPath } from "../../utils/history";

const dark = {
  text: "white",
  panelBg: "black"
};

/*const light = {
  text: "black",
  panelBg: "white"
};*/

const JelWrap = styled.div`
  color: ${p => p.theme.text};
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
`;

const Nav = styled.div``;

const TestButton = styled.button``;

function useNavResize(navExpanded) {
  const scene = useMemo(() => document.querySelector("a-scene"), []);

  const resizeTimeout = useRef();
  const resizeInterval = useRef();

  useEffect(
    () => {
      if (resizeTimeout.current) {
        clearInterval(resizeInterval.current);
        clearTimeout(resizeTimeout.current);
      }

      resizeTimeout.current = setTimeout(() => {
        clearInterval(resizeInterval.current);
        resizeTimeout.current = null;
      }, 800);

      // Don't run during RAF to reduce chop.
      resizeInterval.current = setInterval(() => scene.resize(), 100);
      const { body } = document;

      if (navExpanded) {
        const wasHidden = body.classList.contains("nav-hidden");
        body.classList.remove("nav-hidden");
        body.offsetHeight; // relayout
        if (wasHidden) {
          body.classList.add("nav-expanded");
        }
      } else {
        body.classList.remove("nav-expanded");
        body.offsetHeight; // relayout
        body.classList.add("nav-hidden");
      }
    },
    [navExpanded, scene]
  );
}

function useTreeData(tree, setTreeData) {
  useEffect(
    () => {
      if (!tree) return () => {};

      const handleTreeData = () => setTreeData(tree.expandedTreeData);

      tree.addEventListener("expanded_treedata_updated", handleTreeData);
      tree.rebuildExpandedTreeData();

      () => tree.removeEventListener("expanded_treedata_updated", handleTreeData);
    },
    [tree, setTreeData]
  );
}

function useExpandableTree(treeManager) {
  useEffect(
    () => {
      if (!treeManager) return () => {};

      const handleExpandedNodeIdsChanged = () => {
        treeManager.nav.rebuildExpandedTreeData();
        treeManager.trash.rebuildExpandedTreeData();
      };

      treeManager.addEventListener("expanded_nodes_updated", handleExpandedNodeIdsChanged);

      () => treeManager.removeEventListener("expanded_nodes_updated", handleExpandedNodeIdsChanged);
    },
    [treeManager]
  );
}

function navigateToHubUrl(history, url) {
  const search = history.location.search;
  const path = new URL(url).pathname;
  pushHistoryPath(history, path, search);
}

function HubTree({ treeManager, history, hub }) {
  const [navTreeData, setNavTreeData] = useState([]);
  const [trashTreeData, setTrashTreeData] = useState([]);

  useTreeData(treeManager && treeManager.nav, setNavTreeData);
  useTreeData(treeManager && treeManager.trash, setTrashTreeData);
  useExpandableTree(treeManager);

  if (!treeManager || !hub) return null;

  const onTreeDragEnter = () => {
    // TODO store + expand
  };

  const onTreeDrop = tree => ({ dragNode, node, dropPosition }) => {
    const dropPos = node.pos.split("-");
    const dropOffset = dropPosition - Number(dropPos[dropPos.length - 1]);
    switch (dropOffset) {
      case -1:
        treeManager[tree].moveAbove(dragNode.key, node.key);
        break;
      case 1:
        treeManager[tree].moveBelow(dragNode.key, node.key);
        break;
      case 0:
        treeManager[tree].moveInto(dragNode.key, node.key);
        break;
    }
  };

  const navSelectedKeys = hub ? [treeManager.nav.getNodeIdForHubId(hub.hub_id)] : [];
  const trashSelectedKeys = hub ? [treeManager.trash.getNodeIdForHubId(hub.hub_id)] : [];

  return (
    <div>
      <Tree
        treeData={navTreeData}
        selectable={true}
        selectedKeys={navSelectedKeys}
        draggable
        onDragEnter={onTreeDragEnter}
        onDrop={onTreeDrop("nav")}
        onSelect={(selectedKeys, { node: { url } }) => navigateToHubUrl(history, url)}
        expandedKeys={treeManager.expandedNodeIds()}
        onExpand={(expandedKeys, { expanded, node: { key } }) => treeManager.setNodeExpanded(key, expanded)}
      />
      Trash
      <Tree
        treeData={trashTreeData}
        selectable={true}
        selectedKeys={trashSelectedKeys}
        draggable
        expandedKeys={treeManager.expandedNodeIds()}
        onSelect={(selectedKeys, { node: { url } }) => navigateToHubUrl(history, url)}
        onDragEnter={onTreeDragEnter}
        onDrop={onTreeDrop}
        onExpand={(expandedKeys, { expanded, node: { key } }) => treeManager.setNodeExpanded(key, expanded)}
      />
    </div>
  );
}

function JelUI({
  navExpanded = true,
  treeManager,
  history,
  hub,
  hubCan = () => false,
  spaceCan = () => false,
  onHubDestroyConfirmed,
  spaceIdsToHomeHubUrls,
  spaceId
}) {
  const onCreateClick = async () => {
    const hub = await createHub(spaceId);
    treeManager.nav.addToRoot(hub.hub_id);
  };

  const onTrashClick = () => {
    const nodeId = treeManager.nav.getNodeIdForHubId(hub.hub_id);
    if (!nodeId) return;

    treeManager.moveToTrash(nodeId);
  };

  const onRestoreClick = () => {
    const nodeId = treeManager.trash.getNodeIdForHubId(hub.hub_id);
    if (!nodeId) return;

    treeManager.restoreFromTrash(nodeId);
  };

  const onDestroyClick = async () => {
    const hubId = hub.hub_id;
    const nodeId = treeManager.trash.getNodeIdForHubId(hubId);
    if (!nodeId) return;

    const destroyed = await onHubDestroyConfirmed(hubId);
    if (destroyed) {
      treeManager.removeFromTrash(nodeId);
    }

    const homeHubUrl = spaceIdsToHomeHubUrls.get(spaceId);
    navigateToHubUrl(history, homeHubUrl);
  };

  useNavResize(navExpanded);

  return (
    <ThemeProvider theme={dark}>
      <JelWrap>
        <Nav>
          {spaceCan("create_hub") && <TestButton onClick={onCreateClick}>Create World</TestButton>}
          {spaceCan("edit_nav") && hubCan("close_hub") && <TestButton onClick={onTrashClick}>Trash World</TestButton>}
          <HubTree treeManager={treeManager} hub={hub} history={history} />
          {spaceCan("edit_nav") && <TestButton onClick={onRestoreClick}>Restore World</TestButton>}
          {hubCan("close_hub") && <TestButton onClick={onDestroyClick}>Destroy World</TestButton>}
        </Nav>
        {spaceIdsToHomeHubUrls && (
          <select onChange={e => navigateToHubUrl(history, spaceIdsToHomeHubUrls.get(e.target.value))} value={spaceId}>
            {[...spaceIdsToHomeHubUrls.keys()].map(sid => (
              <option key={sid} value={sid}>
                {sid}
              </option>
            ))}
          </select>
        )}
      </JelWrap>
    </ThemeProvider>
  );
}

JelUI.propTypes = {
  navExpanded: PropTypes.bool,
  treeManager: PropTypes.object,
  history: PropTypes.object,
  hub: PropTypes.object,
  spaceCan: PropTypes.func,
  hubCan: PropTypes.func,
  orgPresences: PropTypes.object,
  hubPresences: PropTypes.object,
  sessionId: PropTypes.string,
  spaceId: PropTypes.string,
  spaceIdsToHomeHubUrls: PropTypes.object,
  onHubDestroyConfirmed: PropTypes.func
};

HubTree.propTypes = {
  treeManager: PropTypes.object,
  history: PropTypes.object,
  hub: PropTypes.object
};

export default JelUI;
