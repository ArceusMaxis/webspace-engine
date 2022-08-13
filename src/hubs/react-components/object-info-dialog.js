import PropTypes from "prop-types";
import React, { Component } from "react";
import classNames from "classnames";
import DialogContainer from "./dialog-container.js";
import cStyles from "../../assets/hubs/stylesheets/client-info-dialog.scss";
import rootStyles from "../../assets/hubs/stylesheets/ui-root.scss";
import oStyles from "../../assets/hubs/stylesheets/object-info-dialog.scss";
import { FormattedMessage } from "react-intl";
import { ensureOwnership } from "../../jel/utils/ownership-utils";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons/faChevronLeft";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons/faChevronRight";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons/faTrashAlt";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons/faLightbulb";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons/faExternalLinkAlt";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import entryStyles from "../../assets/hubs/stylesheets/entry.scss";
import { mediaSort, mediaSortOrder, DISPLAY_IMAGE } from "../utils/media-sorting";
import { performAnimatedRemove } from "../utils/media-utils";
import { HorizontalScrollView } from "./horizontal-scroll-view";

export function NavigationRowItem(props) {
  const { onClick, icon, isSelected } = props;
  return (
    <button className={oStyles.innerNavigationRowItem} onClick={onClick}>
      <i className={oStyles.flex}>
        <FontAwesomeIcon
          className={classNames(oStyles.navigationRowItem, { [oStyles.selected]: isSelected })}
          icon={icon}
        />
      </i>
    </button>
  );
}
NavigationRowItem.propTypes = {
  onClick: PropTypes.func,
  icon: PropTypes.object,
  isSelected: PropTypes.bool
};

function HeaderIcon(props) {
  const { icon, onClick, ariaLabel, small } = props;
  return (
    <button aria-label={ariaLabel} className={oStyles.noDefaultButtonStyle} onClick={onClick}>
      <i className={oStyles.flex}>
        <FontAwesomeIcon className={classNames(oStyles.headerIcon, { [oStyles.small]: small })} icon={icon} />
      </i>
    </button>
  );
}
HeaderIcon.propTypes = {
  icon: PropTypes.object,
  onClick: PropTypes.func,
  ariaLabel: PropTypes.string,
  small: PropTypes.bool
};
HeaderIcon.defaultProps = {
  small: false
};

function HeaderIconLink(props) {
  const { icon, href } = props;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <i className={oStyles.flex}>
        <FontAwesomeIcon className={oStyles.headerIcon} icon={icon} />
      </i>
    </a>
  );
}
HeaderIconLink.propTypes = {
  icon: PropTypes.object,
  href: PropTypes.string
};

function ActionRowIcon(props) {
  const { icon, onClick, ariaLabel } = props;
  return (
    <button aria-label={ariaLabel} className={oStyles.noDefaultButtonStyle} onClick={onClick}>
      <i className={oStyles.flex}>
        <FontAwesomeIcon className={classNames(oStyles.actionRowIcon)} icon={icon} />
      </i>
    </button>
  );
}
ActionRowIcon.propTypes = {
  icon: PropTypes.object,
  onClick: PropTypes.func,
  ariaLabel: PropTypes.string
};

let uiRoot;
export default class ObjectInfoDialog extends Component {
  static propTypes = {
    scene: PropTypes.object,
    el: PropTypes.object,
    src: PropTypes.string,
    onClose: PropTypes.func,
    onNavigated: PropTypes.func,
    hubChannel: PropTypes.object
  };

  state = {
    enableLights: false,
    mediaEntities: []
  };

  componentDidMount() {
    this.onresize = () => {
      this.forceUpdate();
    };
    window.addEventListener("resize", this.onresize);
    this.updateMediaEntities = this.updateMediaEntities.bind(this);
    this.navigateNext = this.navigateNext.bind(this);
    this.navigatePrev = this.navigatePrev.bind(this);
    this.navigate = this.navigate.bind(this);
    this.viewingCamera = DOM_ROOT.getElementById("viewing-camera");
    this.props.scene.addEventListener("uninspect", () => {
      this.props.onClose();
    });
    const cameraSystem = this.props.scene.systems["hubs-systems"].cameraSystem;
    this.setState({ enableLights: cameraSystem.enableLights });
    this.updateMediaEntities();
    this.props.scene.addEventListener("listed_media_changed", () => setTimeout(() => this.updateMediaEntities(), 0));
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onresize);
  }

  updateMediaEntities() {
    const mediaEntities = [...this.props.scene.systems["listed-media"].els];
    mediaEntities.sort(mediaSort);
    this.setState({ mediaEntities });
  }

  toggleLights() {
    const cameraSystem = this.props.scene.systems["hubs-systems"].cameraSystem;
    cameraSystem.enableLights = !cameraSystem.enableLights;
    localStorage.setItem("show-background-while-inspecting", cameraSystem.enableLights.toString());
    this.setState({ enableLights: cameraSystem.enableLights });
    if (cameraSystem.enableLights) {
      cameraSystem.showEverythingAsNormal();
    } else {
      cameraSystem.hideEverythingButThisObject(this.props.el.object3D);
    }
  }

  navigateNext() {
    this.navigate(1);
  }

  navigatePrev() {
    this.navigate(-1);
  }

  navigate(direction) {
    const { mediaEntities } = this.state;
    let targetIndex = (mediaEntities.indexOf(this.props.el) + direction) % mediaEntities.length;
    targetIndex = targetIndex === -1 ? mediaEntities.length - 1 : targetIndex;
    this.props.onNavigated && this.props.onNavigated(mediaEntities[targetIndex]);
  }

  navigateTo(el) {
    this.props.onNavigated && this.props.onNavigated(el);
  }

  remove() {
    if (this._isRemoving) return;
    this._isRemoving = true;

    const targetEl = this.props.el;

    if (!ensureOwnership(targetEl)) return;

    performAnimatedRemove(targetEl, () => {
      const exitAfterRemove = this.state.mediaEntities.length <= 1;
      this.props.scene.systems["hubs-systems"].cameraSystem.uninspect();

      if (exitAfterRemove) {
        this.props.onClose();
      } else {
        this.navigateNext();
      }

      this._isRemoving = false;
    });
  }

  renderSmallScreen(
    targetIndex,
    selectedEl,
    mediaEntities,
    showNavigationButtons,
    showGoToButton,
    showRemoveButton,
    onClose
  ) {
    const showObjectActionRow = showGoToButton || showRemoveButton;
    return (
      <div>
        {/* Header  */}
        <div className={classNames(oStyles.header, rootStyles.uiInteractive)}>
          <div className={classNames(oStyles.floatLeft)}>
            <HeaderIcon icon={faTimes} small={true} onClick={onClose} ariaLabel={"Close object info panel"} />
          </div>
          <div className={classNames(oStyles.floatCenter)}>
            <span
              aria-label={`Showing item ${1 + targetIndex} of ${this.state.mediaEntities.length}`}
              className={oStyles.objectCounterText}
            >
              {`${1 + targetIndex}/${this.state.mediaEntities.length}`}
            </span>
          </div>
          <div className={classNames(oStyles.floatRight)}>
            <HeaderIconLink icon={faExternalLinkAlt} href={this.props.src} />
            <HeaderIcon
              icon={faLightbulb}
              onClick={this.toggleLights.bind(this)}
              ariaLabel={"Toggle rendering of the background"}
            />
          </div>
        </div>

        {/* Bottom Panel */}
        <div className={classNames(oStyles.panel, rootStyles.uiInteractive)}>
          <div className={oStyles.navigationRow}>
            {showNavigationButtons && (
              <HeaderIcon icon={faChevronLeft} onClick={this.navigatePrev} ariaLabel={"Previous Object"} />
            )}
            <HorizontalScrollView
              itemWidth={60}
              selectedEl={selectedEl}
              onWheel={e => {
                if (e.deltaY > 0) {
                  this.navigate(1);
                } else if (e.deltaY < 0) {
                  this.navigate(-1);
                }
              }}
              numItems={this.state.mediaEntities.length}
              targetIndex={targetIndex}
              onItemSelected={index => {
                this.navigateTo(this.state.mediaEntities[index]);
              }}
            >
              {mediaEntities.map(entity => {
                return (
                  <NavigationRowItem
                    icon={DISPLAY_IMAGE.get(mediaSortOrder(entity))}
                    isSelected={entity === selectedEl}
                    key={`${entity.object3D.uuid}_nav-row-item`}
                  />
                );
              })}
            </HorizontalScrollView>
            {showNavigationButtons && (
              <HeaderIcon icon={faChevronRight} onClick={this.navigateNext} ariaLabel={"Next Object"} />
            )}
          </div>
          {showObjectActionRow && (
            <div className={classNames(oStyles.objectActionRow)}>
              {showRemoveButton && (
                <div className={oStyles.floatLeft}>
                  <ActionRowIcon icon={faTrashAlt} onClick={this.remove.bind(this)} ariaLabel={"Remove Object"} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  render() {
    const { onClose } = this.props;
    const isStatic = this.props.el.components.tags && this.props.el.components.tags.data.isStatic;
    const showNavigationButtons = this.state.mediaEntities.length > 1;
    uiRoot = uiRoot || DOM_ROOT.getElementById("ui-root");
    const isGhost = uiRoot && uiRoot.firstChild && uiRoot.firstChild.classList.contains("isGhost");
    const showGoToButton = this.props.scene.is("entered") || isGhost;
    const showRemoveButton =
      this.props.scene.is("entered") &&
      !isStatic &&
      this.props.hubChannel &&
      this.props.hubChannel.can("spawn_and_move_media");

    const isSmallScreen =
      window.APP.store.state.preferences.preferMobileObjectInfoPanel ||
      AFRAME.utils.device.isMobile() ||
      window.innerHeight < 800;
    if (isSmallScreen) {
      let targetIndex = this.state.mediaEntities.indexOf(this.props.el) % this.state.mediaEntities.length;
      targetIndex = targetIndex === -1 ? this.state.mediaEntities.length - 1 : targetIndex;
      return this.renderSmallScreen(
        targetIndex,
        this.props.el,
        this.state.mediaEntities,
        showNavigationButtons,
        showGoToButton,
        showRemoveButton,
        onClose
      );
    }

    return (
      <DialogContainer noOverlay={true} wide={true} {...this.props}>
        <div className={cStyles.roomInfo}>
          <div className={cStyles.titleAndClose}>
            <button
              aria-label={`Close object info panel`}
              autoFocus
              className={entryStyles.collapseButton}
              onClick={onClose}
            >
              <i>
                <FontAwesomeIcon icon={faTimes} />
              </i>
            </button>
            <a className={cStyles.objectDisplayString} href={this.props.src} target="_blank" rel="noopener noreferrer">
              <FormattedMessage id={`object-info.open-link`} />
            </a>
          </div>
          <div className={cStyles.actionButtonSections}>
            <div className={cStyles.leftActionButtons}>
              {showNavigationButtons && (
                <button aria-label="Previous Object" className={cStyles.navigationButton} onClick={this.navigatePrev}>
                  <i>
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </i>
                </button>
              )}
            </div>
            <div className={cStyles.primaryActionButtons}>
              <button onClick={this.toggleLights.bind(this)}>
                <FormattedMessage id={`object-info.${this.state.enableLights ? "lower" : "raise"}-lights`} />
              </button>
              {showRemoveButton ? (
                <button onClick={this.remove.bind(this)}>
                  <FormattedMessage id="object-info.remove-button" />
                </button>
              ) : (
                <div className={cStyles.actionButtonPlaceholder} />
              )}
              <a className={cStyles.cancelText} href="#" onClick={onClose}>
                <FormattedMessage id="client-info.cancel" />
              </a>
            </div>
            <div className={cStyles.rightActionButtons}>
              {showNavigationButtons && (
                <button aria-label="Next Object" className={cStyles.navigationButton} onClick={this.navigateNext}>
                  <i>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </i>
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContainer>
    );
  }
}
