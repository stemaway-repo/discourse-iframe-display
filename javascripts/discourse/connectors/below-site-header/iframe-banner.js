export default {
  setupComponent(args, component) {
    if (settings.enable_theme_component) {
      this.set("belowHeader", true);
    } else {
      this.set("belowHeader", false);
    }
  },
};
