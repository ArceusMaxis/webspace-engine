//import PropTypes from "prop-types";
import PanelSectionHeader from "./panel-section-header";
import SegmentControl from "./segment-control";
import addIcon from "../../assets/jel/images/icons/add.svgi";
import Tooltip from "./tooltip";
import ColorEquip from "./color-equip";
import { FormattedMessage } from "react-intl";
import React, { useState, useRef, useCallback, forwardRef, useEffect } from "react";
import { BRUSH_TYPES } from "../constants";
import { getMessages } from "../../hubs/utils/i18n";
import styled from "styled-components";

const BuilderControlsElement = styled.div`
  display: flex;
  flex-direction: column;
`;

const NumericInput = styled.input`
  background-color: transparent;
  border: 0;
  color: var(--action-button-text-color);
  font-weight: var(--tiny-action-button-text-weight);
  font-size: var(--tiny-action-button-text-size);
  width: 48px;
  height: 42px;
`;

const HelpIconWrap = styled.div`
  flex: 10;
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const HelpIcon = styled.a`
  padding: 4px;
  width: 20px;
  height: 20px;
  border-radius: 12px;
  margin-left: 10px;
  border: 1px solid var(--action-button-border-color);
  color: var(--action-button-text-color);
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--tiny-icon-button-background-color);
  font-weight: var(--tiny-action-button-text-weight);
  font-size: var(--tiny-action-button-text-size);
`;

const ToolWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 108px;
`;

const OptionsWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 120px;
  z-index: 11;
`;

const SuboptionsWrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  justify-content: space-around;
  margin-bottom: 12px;
`;

const BuilderControls = forwardRef((props, ref) => {
  const { builderSystem } = SYSTEMS;
  const [tool, setTool] = useState(builderSystem.brushType);
  const [mode, setMode] = useState(builderSystem.brushMode);
  const [shape, setShape] = useState(builderSystem.brushShape);
  const [size, setSize] = useState(builderSystem.brushSize);
  const [mirrorX, setMirrorX] = useState(builderSystem.mirrorX);
  const [mirrorY, setMirrorY] = useState(builderSystem.mirrorY);
  const [mirrorZ, setMirrorZ] = useState(builderSystem.mirrorZ);
  const [crawlType, setCrawlType] = useState(builderSystem.brushCrawlType);
  const [crawlExtents, setCrawlExtents] = useState(builderSystem.brushCrawlExtents);
  const [colorFillMode, setColorFillMode] = useState(builderSystem.brushColorFillMode);

  const showShape = tool === BRUSH_TYPES.VOXEL;
  const showSize = tool === BRUSH_TYPES.VOXEL;
  const showCrawlType = tool === BRUSH_TYPES.FACE || tool === BRUSH_TYPES.FILL;
  const showCrawlExtents = tool === BRUSH_TYPES.FACE || tool === BRUSH_TYPES.FILL;
  const showColorFillMode = tool === BRUSH_TYPES.FACE;
  const showMirror = tool !== BRUSH_TYPES.FILL && tool !== BRUSH_TYPES.PICK;
  const messages = getMessages();

  useEffect(
    () => {
      if (!builderSystem) return;
      const handler = () => {
        setTool(builderSystem.brushType);
        setMode(builderSystem.brushMode);
        setShape(builderSystem.brushShape);
        setMirrorX(builderSystem.mirrorX);
        setMirrorY(builderSystem.mirrorY);
        setMirrorZ(builderSystem.mirrorZ);
        setCrawlType(builderSystem.brushCrawlType);
        setCrawlExtents(builderSystem.brushCrawlExtents);
        setColorFillMode(builderSystem.brushColorFillMode);
      };

      builderSystem.addEventListener("settingschanged", handler);
      return () => builderSystem.removeEventListener("settingschanged", handler);
    },
    [builderSystem, setTool, setMode, setMirrorX, setMirrorY, setMirrorZ, setCrawlType, setCrawlExtents]
  );

  const onToolChanged = useCallback(
    (id, idx) => {
      builderSystem.setBrushType(idx);
      document.activeElement.blur(); // focuses canvas
    },
    [builderSystem]
  );
  const onModeChanged = useCallback(
    (id, idx) => {
      builderSystem.setBrushMode(idx);
      document.activeElement.blur(); // focuses canvas
    },
    [builderSystem]
  );
  const onShapeChanged = useCallback(
    (id, idx) => {
      builderSystem.setBrushShape(idx);
      document.activeElement.blur(); // focuses canvas
    },
    [builderSystem]
  );
  const onMirrorChanged = useCallback(
    (id, idx) => {
      if (idx === 0) {
        builderSystem.toggleMirrorX();
      } else if (idx === 1) {
        builderSystem.toggleMirrorY();
      } else if (idx === 2) {
        builderSystem.toggleMirrorZ();
      }
      document.activeElement.blur();
    },
    [builderSystem]
  );
  const onCrawlTypeChanged = useCallback(
    (id, idx) => {
      builderSystem.setBrushCrawlType(idx);
      document.activeElement.blur(); // focuses canvas
    },
    [builderSystem]
  );
  const onCrawlExtentsChanged = useCallback(
    (id, idx) => {
      builderSystem.setBrushCrawlExtents(idx);
      document.activeElement.blur(); // focuses canvas
    },
    [builderSystem]
  );
  const onColorFillModeChanged = useCallback(
    (id, idx) => {
      builderSystem.setBrushColorFillMode(idx);
      document.activeElement.blur(); // focuses canvas
    },
    [builderSystem]
  );
  const onSizeChanged = useCallback(
    event => {
      builderSystem.setBrushSize(event.target.value || 1);
      setSize(event.target.value);
    },
    [builderSystem]
  );

  const onSelectedColorClicked = useCallback(() => {}, []);

  return (
    <BuilderControlsElement ref={ref}>
      <PanelSectionHeader style={{ height: "16px" }}>
        <FormattedMessage id="build.tool.header" />
        <HelpIconWrap>
          <Tooltip content={messages[`builder.help-tip`]} placement="bottom" key={"help"} delay={250}>
            <HelpIcon href="https://www.youtube.com/watch?v=853S5HIOF4o" target="_blank">
              ?
            </HelpIcon>
          </Tooltip>
        </HelpIconWrap>
      </PanelSectionHeader>
      <ToolWrap>
        <SuboptionsWrap>
          <SegmentControl
            rows={2}
            cols={3}
            onChange={onToolChanged}
            selectedIndices={[tool]}
            items={[
              { id: "builder.tool.paint", text: "V" },
              { id: "builder.tool.face", text: "F" },
              { id: "builder.tool.box", text: "B" },
              { id: "builder.tool.circle", text: "C" },
              { id: "builder.tool.fill", iconSrc: addIcon },
              { id: "builder.tool.pick", iconSrc: addIcon }
            ]}
          />
        </SuboptionsWrap>
        <SuboptionsWrap>
          <SegmentControl
            rows={1}
            cols={3}
            onChange={onModeChanged}
            selectedIndices={[mode]}
            items={[
              { id: "builder.mode.add", text: "Attach" },
              { id: "builder.mode.remove", text: "Erase" },
              { id: "builder.mode.paint", text: "Paint" }
            ]}
          />
        </SuboptionsWrap>
      </ToolWrap>
      <PanelSectionHeader style={{ height: "16px" }}>
        <FormattedMessage id="build.options.header" />
      </PanelSectionHeader>
      <OptionsWrap>
        {showMirror && (
          <SuboptionsWrap>
            <SegmentControl
              rows={1}
              cols={3}
              onChange={onMirrorChanged}
              selectedIndices={[mirrorX ? 0 : null, mirrorY ? 1 : null, mirrorZ ? 2 : null].filter(x => x !== null)}
              items={[
                { id: "builder.mirror.x", text: "X" },
                { id: "builder.mirror.y", text: "Y" },
                { id: "builder.mirror.z", text: "Z" }
              ]}
            />
          </SuboptionsWrap>
        )}
        {(showShape || showSize) && (
          <SuboptionsWrap>
            {showShape && (
              <SegmentControl
                rows={1}
                cols={2}
                onChange={onShapeChanged}
                selectedIndices={[shape]}
                items={[
                  { id: "builder.shape.box", iconSrc: addIcon },
                  { id: "builder.shape.sphere", iconSrc: addIcon }
                ]}
              />
            )}
            {showSize && (
              <Tooltip content={messages[`builder.size-tip`]} placement="bottom" key={"size"} delay={750}>
                <NumericInput type="number" value={size} onChange={onSizeChanged} />
              </Tooltip>
            )}
          </SuboptionsWrap>
        )}
        {(showCrawlType || showCrawlExtents) && (
          <SuboptionsWrap>
            {showCrawlType && (
              <SegmentControl
                rows={1}
                cols={2}
                onChange={onCrawlTypeChanged}
                selectedIndices={[crawlType]}
                items={[{ id: "builder.crawl.geo", text: "Geo" }, { id: "builder.crawl.color", text: "Col" }]}
              />
            )}
            {showCrawlExtents && (
              <SegmentControl
                rows={1}
                cols={2}
                onChange={onCrawlExtentsChanged}
                selectedIndices={[crawlExtents]}
                items={[{ id: "builder.crawl.nsew", text: "4" }, { id: "builder.crawl.all", text: "8" }]}
              />
            )}
          </SuboptionsWrap>
        )}
        {showColorFillMode && (
          <SuboptionsWrap>
            <SegmentControl
              rows={1}
              cols={2}
              onChange={onColorFillModeChanged}
              selectedIndices={[colorFillMode]}
              items={[
                { id: "builder.color-fill-mode.selected", text: "Selected" },
                { id: "builder.color-fill-mode.existing", text: "Existing" }
              ]}
            />
          </SuboptionsWrap>
        )}
      </OptionsWrap>
      <PanelSectionHeader style={{ height: "16px" }}>
        <FormattedMessage id="build.palette.header" />
      </PanelSectionHeader>
      <ColorEquip onSelectedColorClicked={onSelectedColorClicked} />
    </BuilderControlsElement>
  );
});

BuilderControls.displayName = "BuilderControls";
BuilderControls.propTypes = {};

export { BuilderControls as default };
