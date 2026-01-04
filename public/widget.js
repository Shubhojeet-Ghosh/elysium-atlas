(function (d, w) {
  // Guard against double-init
  if (w.__myWidgetInjected) return;
  w.__myWidgetInjected = true;

  // Global constants
  const ATLAS_BASE_URL = "https://atlas.sgdevstudio.in";
  const API_BASE_URL = "https://ai.sgdevstudio.in";

  // Closure-scoped state
  let agentIdGlobal = null;
  let chatSessionIdGlobal = null;
  let pageUrlGlobal = null;

  function getQueryParam(param) {
    const scripts = d.getElementsByTagName("script");
    for (let script of scripts) {
      if (script.src && script.src.includes("widget.js")) {
        const params = new URLSearchParams(script.src.split("?")[1]);
        return params.get(param);
      }
    }
    return null;
  }

  function getOrCreateSessionId() {
    let chatSessionId = w.localStorage.getItem("chat_session_id");

    if (chatSessionId) {
      console.log("chat_session_id:", chatSessionId);
    } else {
      const uuid = crypto.randomUUID();
      chatSessionId = "web-" + uuid;
      w.localStorage.setItem("chat_session_id", chatSessionId);
      console.log("chat_session_id:", chatSessionId);
    }

    return chatSessionId;
  }

  function createChatButton(iconUrl) {
    const button = d.createElement("div");
    button.id = "chat-widget-button";
    button.style.position = "fixed";
    button.style.bottom = "20px";
    button.style.right = "20px";
    button.style.width = "50px";
    button.style.height = "50px";
    button.style.borderRadius = "50%";
    button.style.overflow = "hidden";
    button.style.cursor = "pointer";
    button.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    button.style.zIndex = "9999";

    // Initial hidden state
    button.style.opacity = "0";
    button.style.transform = "translateY(20px)";
    button.style.filter = "blur(4px)";
    button.style.pointerEvents = "none";
    button.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

    const img = d.createElement("img");
    img.src = iconUrl;
    img.alt = "Chat";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";

    button.appendChild(img);
    d.body.appendChild(button);

    // Trigger animation to show button
    setTimeout(() => {
      button.style.opacity = "1";
      button.style.transform = "translateY(0)";
      button.style.filter = "blur(0px)";
      button.style.pointerEvents = "auto";
      button.style.transition =
        "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s";
    }, 50);

    // Add hover effect
    button.addEventListener("mouseenter", () => {
      if (button.style.opacity === "1") {
        button.style.transform = "translateY(0)";
      }
    });

    button.addEventListener("mouseleave", () => {
      if (button.style.opacity === "1") {
        button.style.transform = "translateY(0)";
      }
    });

    button.addEventListener("click", () => {
      // Animate button hide
      button.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      button.style.opacity = "0";
      button.style.transform = "translateY(20px)";
      button.style.filter = "blur(4px)";
      button.style.pointerEvents = "none";

      const iframe = d.getElementById("chat-widget-iframe");
      if (iframe && iframe.isLoaded) {
        showChatIframe();
        iframe.contentWindow.postMessage({ type: "open_chat" }, ATLAS_BASE_URL);
      } else if (iframe) {
        // If not loaded yet, wait for load
        iframe.onload = () => {
          iframe.isLoaded = true;
          showChatIframe();
          iframe.contentWindow.postMessage(
            { type: "open_chat" },
            ATLAS_BASE_URL
          );
        };
      }
    });

    console.log("Chat button created");
  }

  function createChatIframe() {
    const iframe = d.createElement("iframe");
    iframe.id = "chat-widget-iframe";
    const iframeSrc = `${ATLAS_BASE_URL}/chat-with-agent?agent_id=${agentIdGlobal}&chat_session_id=${chatSessionIdGlobal}&source=${encodeURIComponent(
      pageUrlGlobal
    )}`;
    iframe.src = iframeSrc;
    iframe.style.position = "fixed";
    iframe.style.bottom = "20px";
    iframe.style.right = "20px";
    iframe.style.width = "450px";
    iframe.style.height = "500px";
    iframe.style.border = "none";
    iframe.style.borderRadius = "12px";
    iframe.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
    iframe.style.zIndex = "10000";

    // Initial hidden state
    iframe.style.opacity = "0";
    iframe.style.transform = "translateY(20px) scale(0.95)";
    iframe.style.filter = "blur(4px)";
    iframe.style.pointerEvents = "none";
    iframe.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

    d.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.isLoaded = true;
    };

    return iframe;
  }

  function showChatIframe() {
    let iframe = d.getElementById("chat-widget-iframe");
    if (!iframe) {
      iframe = createChatIframe();
    }

    // Trigger animation to show iframe
    setTimeout(() => {
      iframe.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
      iframe.style.opacity = "1";
      iframe.style.transform = "translateY(0) scale(1)";
      iframe.style.filter = "blur(0px)";
      iframe.style.pointerEvents = "auto";
    }, 50);
  }

  function hideChatIframe() {
    const iframe = d.getElementById("chat-widget-iframe");
    const button = d.getElementById("chat-widget-button");

    if (iframe) {
      // Animate iframe hide
      iframe.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      iframe.style.opacity = "0";
      iframe.style.transform = "translateY(20px) scale(0.95)";
      iframe.style.filter = "blur(4px)";
      iframe.style.pointerEvents = "none";
    }

    if (button) {
      // Animate button show
      setTimeout(() => {
        button.style.transition =
          "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s";
        button.style.opacity = "1";
        button.style.transform = "translateY(0) scale(1)";
        button.style.filter = "blur(0px)";
        button.style.pointerEvents = "auto";
      }, 50);
    }
  }

  async function fetchAgentFields(agentId, chatSessionId, pageUrl) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/elysium-agents/elysium-atlas/agent/v1/get-agent-fields`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: agentId,
            chat_session_id: chatSessionId,
            fields: ["agent_icon"],
            visitor_at: pageUrl,
          }),
        }
      );

      const data = await response.json();
      console.log("API Response:", data);

      if (data.success && data.agent_fields?.agent_icon) {
        console.log("agent_icon:", data.agent_fields.agent_icon);
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      return null;
    }
  }

  async function init() {
    const agentId = getQueryParam("agent_id");
    if (!agentId) return;

    console.log("hello world");
    console.log("agent_id:", agentId);

    const pageUrl = w.location.href;
    console.log("page_url:", pageUrl);

    const chatSessionId = getOrCreateSessionId();

    // Store values in closure scope
    agentIdGlobal = agentId;
    chatSessionIdGlobal = chatSessionId;
    pageUrlGlobal = pageUrl;

    const data = await fetchAgentFields(agentId, chatSessionId, pageUrl);

    if (data?.success && data.agent_fields?.agent_icon) {
      // Preload the iframe
      createChatIframe();
      createChatButton(data.agent_fields.agent_icon);
    }

    // Listen for messages from the iframe
    w.addEventListener("message", (e) => {
      if (e.origin === ATLAS_BASE_URL) {
        if (e.data.type === "close_chat") {
          hideChatIframe();
        } else if (e.data.type === "navigate_link") {
          // Open link in parent window
          if (e.data.url) {
            w.open(e.data.url, "_blank");
          }
        }
      }
    });
  }

  // Run init as soon as <body> is available
  if (d.body) {
    init();
  } else {
    const obs = new MutationObserver(() => {
      if (d.body) {
        obs.disconnect();
        init();
      }
    });
    obs.observe(d.documentElement, { childList: true });
  }
})(document, window);
