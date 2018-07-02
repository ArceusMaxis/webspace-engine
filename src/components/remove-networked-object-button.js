AFRAME.registerComponent("remove-networked-object-button", {
  init() {
    this.onClick = () => {
      // const texture = this.targetEl.getObject3D("mesh").material.map;
      // console.log(texture);
      // texture.image.src = "";
      this.targetEl.parentNode.removeChild(this.targetEl);
    };
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });
  },

  play() {
    this.el.addEventListener("click", this.onClick);
  },

  pause() {
    this.el.removeEventListener("click", this.onClick);
  }
});
