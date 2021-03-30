import PropTypes from "prop-types";
import React, { useState, useCallback, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import Tree from "rc-tree";
import styled from "styled-components";
import {
  addNewHubToTree,
  useTreeDropHandler,
  useTreeData,
  useExpandableTree,
  useScrollToSelectedTreeNode
} from "../utils/tree-utils";
import HubNodeTitle from "./hub-node-title";
import { navigateToHubUrl } from "../utils/jel-url-utils";
import "../../assets/jel/stylesheets/atom-tree.scss";

const EmptyMessage = styled.div`
  margin-left: 16px;
  margin-top: 8px;
  font-size: var(--panel-header-text-size);
  line-height: calc(var(--panel-header-text-size) + 2px);
  white-space: pre;
`;

function HubTree({ treeManager, type, history, hub, spaceCan, setHubRenameReferenceElement, showHubContextMenuPopup }) {
  const [navTreeData, setNavTreeData] = useState([]);
  const [navTreeDataVersion, setNavTreeDataVersion] = useState(0);

  const tree = treeManager && (type === "world" ? treeManager.worldNav : treeManager.channelNav);
  const atomMetadata = tree && tree.atomMetadata;

  useTreeData(tree, navTreeDataVersion, setNavTreeData, setNavTreeDataVersion);
  useExpandableTree(treeManager, tree);

  // Ensure current selected node is always visible
  useScrollToSelectedTreeNode(navTreeData, hub);

  const navTitleControl = useCallback(
    data => {
      const metadata = atomMetadata.getMetadata(data.atomId);
      const showAdd = !!(spaceCan("create_world_hub") && metadata && metadata.type === "world");

      return (
        <HubNodeTitle
          hubId={data.atomId}
          showAdd={showAdd}
          showDots={true}
          hubMetadata={atomMetadata}
          onAddClick={e => {
            e.stopPropagation(); // Otherwise this will perform a tree node click event
            addNewHubToTree(history, treeManager, hub.space_id, hub.type, data.atomId);
          }}
          onDotsClick={(e, ref) => {
            e.stopPropagation(); // Otherwise this will perform a tree node click event
            showHubContextMenuPopup(data.atomId, ref, "bottom-start", [0, 0], {
              hideRename: false
            });
            setHubRenameReferenceElement(ref);
          }}
        />
      );
    },
    [history, hub, treeManager, atomMetadata, showHubContextMenuPopup, setHubRenameReferenceElement, spaceCan]
  );

  const onDragEnter = useCallback(({ node }) => treeManager.setNodeIsExpanded(node.key, true, tree), [
    treeManager,
    tree
  ]);
  const onDrop = useTreeDropHandler(treeManager, tree, type === "world");
  const onSelect = useCallback(
    (selectedKeys, { node: { atomId } }) => {
      const metadata = tree.atomMetadata.getMetadata(atomId);

      if (metadata) {
        navigateToHubUrl(history, metadata.url);
      }
    },
    [tree, history]
  );
  const onExpand = useCallback(
    (expandedKeys, { expanded, node: { key } }) => treeManager.setNodeIsExpanded(key, expanded, tree),
    [treeManager, tree]
  );

  const allowDrop = useCallback(() => type === "world", [type]);
  const navSelectedKeys = useMemo(() => (hub && tree ? [tree.getNodeIdForAtomId(hub.hub_id)] : []), [hub, tree]);

  if (!treeManager || !hub) return null;

  treeManager.setNavTitleControl(navTitleControl);

  // HACK - this is security through obscurity for the channel case, since
  // the edit_nav permission theoretically allows anyone to modify the entire
  // nav tree, not just the world nav.
  const draggable = type === "world" ? spaceCan("create_world_hub") : spaceCan("create_channel_hub");

  return (
    <div>
      <Tree
        prefixCls="atom-tree"
        treeData={navTreeData}
        selectable={true}
        selectedKeys={navSelectedKeys}
        draggable={draggable}
        onDragEnter={onDragEnter}
        onDrop={onDrop}
        allowDrop={allowDrop}
        onSelect={onSelect}
        expandedKeys={treeManager.navExpandedNodeIds()}
        onExpand={onExpand}
      />
      {navTreeData.length === 0 && (
        <EmptyMessage>
          <FormattedMessage id={type === "world" ? "nav.worlds-empty" : "nav.channels-empty"} />
        </EmptyMessage>
      )}
    </div>
  );
}

HubTree.propTypes = {
  treeManager: PropTypes.object,
  type: PropTypes.string,
  history: PropTypes.object,
  hub: PropTypes.object,
  spaceCan: PropTypes.func,
  hubCan: PropTypes.func,
  setHubRenameReferenceElement: PropTypes.func,
  showHubContextMenuPopup: PropTypes.func
};

export default HubTree;
