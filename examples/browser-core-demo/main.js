import {
  createKeyplane,
  formatBinding,
  normalizeBinding,
} from "../../dist/index.js";

const capture = document.getElementById("capture");
const editable = document.getElementById("editable");
const rawEvent = document.getElementById("raw-event");
const derivedMeanings = document.getElementById("derived-meanings");
const bindingList = document.getElementById("binding-list");
const matchLog = document.getElementById("match-log");
const scopeEditor = document.getElementById("scope-editor");
const scopePalette = document.getElementById("scope-palette");
const scopeGlobal = document.getElementById("scope-global");

const registeredBindings = [
  {
    label: "Physical letter",
    binding: "KeyZ",
  },
  {
    label: "Semantic letter",
    binding: "key:z",
  },
  {
    label: "Physical punctuation",
    binding: "Control+Minus",
  },
  {
    label: "Semantic punctuation",
    binding: "key:Control+-",
  },
  {
    label: "Sequence",
    binding: "Control+KeyK then Control+KeyC",
  },
  {
    label: "Scoped",
    binding: "KeyP",
    options: { scope: "palette" },
  },
  {
    label: "Editable blocked",
    binding: "KeyB",
  },
  {
    label: "Editable allowed",
    binding: "KeyE",
    options: { allowInEditable: true },
  },
];

const manager = createKeyplane({
  defaultScope: "editor",
});

const subscriptions = registeredBindings.map((entry) =>
  manager.bind(entry.binding, () => {
    appendLog(`${entry.label}: ${entry.binding}`);
  }, entry.options),
);

capture.addEventListener("keydown", updateInspection);
editable.addEventListener("keydown", updateInspection);
scopeEditor.addEventListener("click", () => setScope("editor"));
scopePalette.addEventListener("click", () => setScope("palette"));
scopeGlobal.addEventListener("click", () => setScope(null));

renderBindings();
capture.focus();

window.addEventListener("beforeunload", () => {
  for (const subscription of subscriptions) {
    subscription.dispose();
  }

  manager.destroy();
});

function renderBindings() {
  const rows = [
    {
      label: "Scope state",
      binding: "manager active scope",
      normalized: manager.getScope(),
      formattedDefault: manager.getScope(),
      formattedCanonical: manager.getScope(),
    },
    ...registeredBindings.map((entry) => ({
      label: entry.label,
      binding: entry.binding,
      normalized: normalizeBinding(entry.binding),
      formattedDefault: formatBinding(entry.binding),
      formattedCanonical: formatBinding(entry.binding, { style: "canonical" }),
    })),
  ];

  bindingList.innerHTML = rows
    .map((row) => {
      const normalized = escapeHtml(JSON.stringify(row.normalized, null, 2));
      const formattedDefault = escapeHtml(String(row.formattedDefault));
      const formattedCanonical = escapeHtml(String(row.formattedCanonical));
      const binding = escapeHtml(row.binding);
      const label = escapeHtml(row.label);

      return `
        <article class="binding-card">
          <p class="binding-label">${label}</p>
          <p class="binding-source"><code>${binding}</code></p>
          <dl class="binding-meta">
            <div>
              <dt>Default label</dt>
              <dd><code>${formattedDefault}</code></dd>
            </div>
            <div>
              <dt>Canonical label</dt>
              <dd><code>${formattedCanonical}</code></dd>
            </div>
          </dl>
          <pre class="code">${normalized}</pre>
        </article>
      `;
    })
    .join("");

  syncScopeButtons();
}

function updateInspection(event) {
  rawEvent.textContent = JSON.stringify(
    {
      type: event.type,
      code: event.code,
      key: event.key,
      repeat: event.repeat,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
      altGraph: event.getModifierState("AltGraph"),
      target:
        event.target instanceof HTMLElement
          ? event.target.tagName.toLowerCase()
          : "unknown",
    },
    null,
    2,
  );

  const physical = derivePhysicalBinding(event);
  const semantic = deriveSemanticBinding(event);

  derivedMeanings.textContent = JSON.stringify(
    {
      physical,
      semantic,
    },
    null,
    2,
  );
}

function derivePhysicalBinding(event) {
  const primary = event.code;

  if (!primary) {
    return null;
  }

  return normalizeBinding({
    mode: "physical",
    steps: [{ key: primary, modifiers: getModifiers(event) }],
  });
}

function deriveSemanticBinding(event) {
  const primary = normalizeSemanticEventKey(event.key);

  if (!primary) {
    return null;
  }

  return {
    mode: "semantic",
    steps: [{ key: primary, modifiers: getModifiers(event) }],
  };
}

function getModifiers(event) {
  const modifiers = [];

  if (event.ctrlKey) {
    modifiers.push("Control");
  }

  if (event.altKey) {
    modifiers.push("Alt");
  }

  if (event.shiftKey) {
    modifiers.push("Shift");
  }

  if (event.metaKey) {
    modifiers.push("Meta");
  }

  if (event.getModifierState("AltGraph")) {
    modifiers.push("AltGraph");
  }

  return modifiers;
}

function normalizeSemanticEventKey(key) {
  if (!key || key === "Compose") {
    return null;
  }

  if (key === " ") {
    return "Space";
  }

  return key;
}

function appendLog(message) {
  const item = document.createElement("li");
  item.textContent = message;
  matchLog.prepend(item);

  while (matchLog.children.length > 8) {
    matchLog.removeChild(matchLog.lastElementChild);
  }
}

function setScope(scope) {
  manager.setScope(scope);
  appendLog(`Active scope: ${scope ?? "none"}`);
  renderBindings();
}

function syncScopeButtons() {
  const activeScope = manager.getScope();
  const buttons = [
    [scopeEditor, activeScope === "editor"],
    [scopePalette, activeScope === "palette"],
    [scopeGlobal, activeScope === null],
  ];

  for (const [button, active] of buttons) {
    button.dataset.active = active ? "true" : "false";
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
