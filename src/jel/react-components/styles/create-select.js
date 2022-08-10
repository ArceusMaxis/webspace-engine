export const CREATE_SELECT = `
  .create-select {
     display: inline-block;
     font-size: 12px;
     width: 100px;
     position: relative;
  }
   .create-select-disabled, .create-select-disabled input {
     cursor: not-allowed;
  }
   .create-select-disabled .create-select-selector {
     opacity: 0.3;
  }
   .create-select-show-arrow .create-select-loading .create-select-arrow-icon::after {
     box-sizing: border-box;
     width: 12px;
     height: 12px;
     border-radius: 100%;
     border: 2px solid #999;
     border-top-color: transparent;
     border-bottom-color: transparent;
     transform: none;
     margin-top: 4px;
  }
   .create-select .create-select-selection-search-input {
     appearance: none;
  }
   .create-select .create-select-selection-search-input::-webkit-search-cancel-button {
     display: none;
     appearance: none;
  }
   .create-select-single .create-select-selector {
     display: flex;
     position: relative;
     background-color: var(--menu-background-color);
     height: fit-content;
     flex-direction: row;
     align-items: flex-start;
     justify-content: flex-start;
     border-radius: 6px 6px 0 0;
     border: 1px solid var(--menu-border-color);
     border-bottom-width: 0;
     box-shadow: 0px 12px 28px var(--menu-shadow-color);
     padding: 6px;
     box-sizing: border-box;
  }
   .create-select-single .create-select-selector .create-select-selection-search {
     width: 100%;
     flex: 1;
     padding: 2px;
     border-radius: 4px;
     border: 0;
     background: var(--text-input-background-color);
     box-shadow: inset 0px 0px 2px var(--menu-background-color);
  }
   .create-select-single .create-select-selector .create-select-selection-search-input {
     width: 100%;
     border: 0;
     color: var(--text-input-text-color);
     font-size: var(--text-input-text-size);
     font-weight: var(--text-input-text-weight);
     padding: 4px;
  }
   .create-select-single .create-select-selector .create-select-selection-item, .create-select-single .create-select-selector .create-select-selection-placeholder {
     position: absolute;
     padding: 4px;
     top: 9px;
     left: 8px;
     pointer-events: none;
     color: var(--text-input-placeholder-ephemeral-color);
     font-size: var(--text-input-text-size);
     border: 0;
     font-weight: var(--text-input-text-weight);
  }
   .create-select-single:not(.create-select-customize-input) .create-select-selector {
     padding: 1px;
     border: 1px solid #000;
  }
   .create-select-single:not(.create-select-customize-input) .create-select-selector .create-select-selection-search-input {
     border: none;
     outline: none;
     background: rgba(255, 0, 0, 0.2);
     width: 100%;
  }
   .create-select-dropdown {
     min-height: 100px;
     position: absolute;
     background: transparent;
  }
   .create-select-item {
     padding: 8px 16px;
  }
   .create-select-item-group {
     color: var(--panel-subheader-text-color);
     font-size: var(--panel-subheader-text-size);
     font-weight: var(--panel-subheader-text-weight);
     text-transform: uppercase;
     margin: 0px 8px;
  }
   .create-select-item-option {
     position: relative;
     cursor: pointer;
  }
   .create-select-item-option-grouped {
     padding-left: 24px;
  }
   .create-select-item-option-active {
     background-color: var(--panel-item-hover-background-color);
  }
   .create-select-item-option-active img {
     background-color: var(--dropdown-thumb-active-background-color);
  }
   .create-select-item-option-state {
     display: none;
  }
   .create-select-item-empty {
     text-align: center;
  }
   .create-select-dropdown {
     z-index: 5;
     opacity: 1 !important;
  }
   .create-select-dropdown >
   div {
     background-color: var(--panel-background-color);
     color: var(--panel-text-color);
     border: 2px solid var(--panel-background-color);
     border-top-width: 0;
     border-left-width: 0;
     border-right-width: 0;
     box-shadow: 0px 12px 28px var(--menu-shadow-color);
     border-radius: 0 0 4px 4px;
     position: absolute;
     top: -4px;
     left: 0;
     width: 100%;
     height: fit-content;
     overflow: hidden;
  }
   .create-select-dropdown .rc-virtual-list-holder {
     scrollbar-color: transparent transparent;
     scrollbar-width: thin;
     padding: 10px 0 6px 0;
  }
   .create-select-dropdown .rc-virtual-list-holder::-webkit-scrollbar {
     width: 8px;
     height: 8px;
     visibility: hidden;
  }
   .create-select-dropdown .rc-virtual-list-holder::-webkit-scrollbar-thumb {
     background-clip: padding-box;
     border: 2px solid transparent;
     border-radius: 4px;
     background-color: transparent;
     transition: background-color 0.25s;
     min-height: 40px;
  }
   .create-select-dropdown .rc-virtual-list-holder::-webkit-scrollbar-corner {
     background-color: transparent;
  }
   .create-select-dropdown .rc-virtual-list-holder::-webkit-scrollbar-track {
     border-color: transparent;
     background-color: transparent;
     border: 2px solid transparent;
     visibility: hidden;
  }
   .create-select-dropdown .rc-virtual-list-holder:hover {
     scrollbar-color: var(--scroll-thumb-color) transparent;
  }
   .create-select-dropdown .rc-virtual-list-holder:hover::-webkit-scrollbar-thumb {
     background-color: var(--scroll-thumb-color);
     transition: background-color 0.25s;
  }
   .create-select-dropdown .rc-virtual-list-scrollbar {
     background-color: transparent;
  }
   .create-select-dropdown .rc-virtual-list-scrollbar-thumb {
     background-color: var(--scroll-thumb-color) !important;
     width: 4px !important;
  }
`;
