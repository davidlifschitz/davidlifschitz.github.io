const DEFAULT_CONFIG = {
  appName: "ShortcutForge Web Runner",
  runnerShortcutName: "ShortcutForge Runner",
  runnerInstallUrl: "https://www.icloud.com/shortcuts/290365e70329446caec7e93f702a7919",
  scheduleOsEndpoint: "",
  examplePrompts: [
    "Ask me what text to send, let me choose a contact, and prepare the message."
  ]
};

const elements = {
  installRunner: document.querySelector("#installRunner"),
  copyRunnerLink: document.querySelector("#copyRunnerLink"),
  runnerStatus: document.querySelector("#runnerStatus"),
  promptInput: document.querySelector("#promptInput"),
  copyPrompt: document.querySelector("#copyPrompt"),
  buildPayload: document.querySelector("#buildPayload"),
  examples: document.querySelector("#examples"),
  payloadPreview: document.querySelector("#payloadPreview"),
  copyPayload: document.querySelector("#copyPayload")
};

let activeConfig = DEFAULT_CONFIG;
let activePayload = null;

async function loadConfig() {
  try {
    const response = await fetch("./config.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Config request failed with ${response.status}`);
    }
    const config = await response.json();
    activeConfig = { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.warn("Using default ShortcutForge web config", error);
    activeConfig = DEFAULT_CONFIG;
  }
}

function renderConfig() {
  document.title = activeConfig.appName;
  elements.installRunner.href = activeConfig.runnerInstallUrl;
  elements.runnerStatus.textContent = `${activeConfig.runnerShortcutName} install link is configured.`;

  elements.examples.innerHTML = "";
  for (const prompt of activeConfig.examplePrompts || []) {
    const button = document.createElement("button");
    button.className = "example-button";
    button.type = "button";
    button.textContent = prompt;
    button.addEventListener("click", () => {
      elements.promptInput.value = prompt;
      elements.promptInput.focus();
    });
    elements.examples.append(button);
  }
}

function inferShortcutId(prompt) {
  const normalized = prompt.toLowerCase();
  if (normalized.includes("text") || normalized.includes("message") || normalized.includes("contact")) {
    return "send-message-runner";
  }
  if (normalized.includes("task")) {
    return "create-task-from-text";
  }
  if (normalized.includes("idea") || normalized.includes("inbox")) {
    return "capture-idea-to-inbox";
  }
  if (normalized.includes("work on") || normalized.includes("next")) {
    return "what-should-i-work-on-now";
  }
  return "ask-scheduleos";
}

function buildRunnerPayload(prompt) {
  const trimmedPrompt = prompt.trim();
  const shortcutId = inferShortcutId(trimmedPrompt);
  const isLocalMessageRunner = shortcutId === "send-message-runner";

  return {
    shortcutId,
    invocationMode: "web",
    input: {
      message: trimmedPrompt,
      source: "ShortcutForge web app",
      capturedAt: new Date().toISOString()
    },
    routing: {
      mode: isLocalMessageRunner ? "local_runner_branch" : "interpret",
      target: isLocalMessageRunner ? "Shortcuts" : "ScheduleOS"
    },
    return: {
      type: isLocalMessageRunner ? "confirmation" : "text"
    }
  };
}

async function copyText(text, successLabel) {
  await navigator.clipboard.writeText(text);
  announce(successLabel);
}

function announce(message) {
  elements.runnerStatus.textContent = message;
}

function renderPayload(payload) {
  activePayload = payload;
  elements.payloadPreview.textContent = JSON.stringify(payload, null, 2);
}

function wireEvents() {
  elements.copyRunnerLink.addEventListener("click", async () => {
    await copyText(activeConfig.runnerInstallUrl, "Runner iCloud link copied.");
  });

  elements.copyPrompt.addEventListener("click", async () => {
    const prompt = elements.promptInput.value.trim();
    if (!prompt) {
      announce("Add a prompt before copying.");
      return;
    }
    await copyText(prompt, "Prompt copied.");
  });

  elements.buildPayload.addEventListener("click", () => {
    const prompt = elements.promptInput.value.trim();
    if (!prompt) {
      announce("Add a prompt before building a payload.");
      return;
    }
    renderPayload(buildRunnerPayload(prompt));
    announce("Runner payload built.");
  });

  elements.copyPayload.addEventListener("click", async () => {
    if (!activePayload) {
      announce("Build a payload before copying.");
      return;
    }
    await copyText(JSON.stringify(activePayload, null, 2), "Payload JSON copied.");
  });
}

await loadConfig();
renderConfig();
wireEvents();
