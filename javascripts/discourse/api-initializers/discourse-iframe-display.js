import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.11.1", (api) => {
  api.decorateWidget("topic-banners:after", (helper) => {
    helper.widget.appEvents.on("page:changed", () => {
      helper.widget.scheduleRerender();
    });
  });
});
