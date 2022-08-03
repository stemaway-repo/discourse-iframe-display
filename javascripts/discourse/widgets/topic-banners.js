import { ajax } from "discourse/lib/ajax";
import { createWidget } from "discourse/widgets/widget";
import { getOwner } from "discourse-common/lib/get-owner";
import { h } from "virtual-dom";
import PostCooked from "discourse/widgets/post-cooked";

function defaultSettings() {
  return {};
}

function parseSetups(raw) {
  const parsed = {};
  raw.split("|").forEach((setting) => {
    const [url, value] = setting.split(",").map((s) => s.trim());
    parsed[url] = parsed[url] || defaultSettings();
    parsed[url]["post"] = value;
  });
  return parsed;
}

function createTopicBanner(taxonomy) {
  const setup = setups[taxonomy];
  const post = [this.getPost(setup["post"])];
  document.querySelector("body").classList.add("topic-banners");
  return h("div.topic-banner", post);
}

const postCache = {};
const setups = parseSetups(settings.topic_banners);

createWidget("topic-banners", {
  tagName: "div.topic-banner-container",
  html() {
    const router = getOwner(this).lookup("router:main");
    const url = router.currentURL;

    if (settings.show_url) {
      console.log("Current URL: ", url);
    }

    if (url && setups[url]) {
      return createTopicBanner.call(this, url);
    }

    // Remove classes if no sidebar returned
    document.querySelector("body").classList.remove("topic-banners");
  },
  getPost(id) {
    if (!postCache[id]) {
      ajax(`/t/${id}.json`).then((response) => {
        postCache[id] = new PostCooked({
          cooked: response.post_stream.posts[0].cooked,
        });
        this.scheduleRerender();
      });
    }
    return postCache[id];
  },
});
