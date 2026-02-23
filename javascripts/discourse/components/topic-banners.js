import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { service } from "@ember/service";
import { htmlSafe } from "@ember/template";
import { ajax } from "discourse/lib/ajax";

function parseSetups(raw = "") {
  const parsed = {};

  raw
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((setting) => {
      const [url, postId] = setting.split(",").map((s) => s.trim());
      if (!url || !postId) {
        return;
      }
      parsed[url] = { post: postId };
    });

  return parsed;
}

const setups = parseSetups(settings.topic_banners);
const postCache = new Map();
const pendingRequests = new Map();

export default class TopicBanners extends Component {
  @service router;
  @tracked cacheVersion = 0;

  get currentSetup() {
    if (!settings.enable_theme_component) {
      this._setBodyClass(false);
      return null;
    }

    const setup = setups[this.router.currentURL];
    this._setBodyClass(Boolean(setup));
    return setup;
  }

  get cookedPost() {
    this.cacheVersion;

    const setup = this.currentSetup;
    if (!setup?.post) {
      return null;
    }

    if (!postCache.has(setup.post)) {
      this._loadPost(setup.post);
      return null;
    }

    const cooked = postCache.get(setup.post);
    return cooked ? htmlSafe(cooked) : null;
  }

  _loadPost(postId) {
    if (pendingRequests.has(postId)) {
      return pendingRequests.get(postId);
    }

    const request = ajax(`/t/${postId}.json`)
      .then((response) => {
        postCache.set(postId, response?.post_stream?.posts?.[0]?.cooked || "");
        this.cacheVersion++;
      })
      .catch(() => {
        postCache.set(postId, "");
        this.cacheVersion++;
      })
      .finally(() => {
        pendingRequests.delete(postId);
      });

    pendingRequests.set(postId, request);
    return request;
  }

  _setBodyClass(enabled) {
    document.body?.classList.toggle("topic-banners", enabled);
  }

  willDestroy() {
    super.willDestroy(...arguments);
    this._setBodyClass(false);
  }
}
