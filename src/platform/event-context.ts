import type { KeyplaneRuntimeTarget } from "./validate-target";

const EDITABLE_INPUT_TYPES = new Set([
  "text",
  "search",
  "url",
  "tel",
  "email",
  "password",
  "number",
]);

export function isEventWithinTargetBoundary(
  managerTarget: KeyplaneRuntimeTarget,
  eventTarget: EventTarget | null,
): boolean {
  if (!isHTMLElement(managerTarget)) {
    return true;
  }

  const targetNode = asNode(eventTarget);

  if (!targetNode) {
    return false;
  }

  return managerTarget.contains(targetNode);
}

export function isEditableEventTarget(eventTarget: EventTarget | null): boolean {
  const targetNode = asNode(eventTarget);
  const targetElement = toElement(targetNode);

  if (!targetElement) {
    return false;
  }

  const textarea = targetElement.closest("textarea");

  if (textarea) {
    return true;
  }

  const input = targetElement.closest("input");

  if (input && isTextualInput(input)) {
    return true;
  }

  return isHTMLElementElement(targetElement) && targetElement.isContentEditable;
}

function isTextualInput(element: Element): element is HTMLInputElement {
  if (typeof HTMLInputElement === "function" && !(element instanceof HTMLInputElement)) {
    return false;
  }

  const input = element as HTMLInputElement;
  return EDITABLE_INPUT_TYPES.has(input.type.toLowerCase());
}

function toElement(node: Node | null): Element | null {
  if (!node) {
    return null;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    return node as Element;
  }

  return node.parentElement;
}

function asNode(value: EventTarget | null): Node | null {
  if (
    typeof Node === "function" &&
    value instanceof Node
  ) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Node).nodeType === "number"
  ) {
    return value as Node;
  }

  return null;
}

function isHTMLElement(value: KeyplaneRuntimeTarget): value is HTMLElement {
  if (typeof HTMLElement === "function") {
    return value instanceof HTMLElement;
  }

  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as HTMLElement).nodeType === "number" &&
    (value as HTMLElement).nodeType === Node.ELEMENT_NODE
  );
}

function isHTMLElementElement(value: Element): value is HTMLElement {
  if (typeof HTMLElement === "function") {
    return value instanceof HTMLElement;
  }

  return value.nodeType === Node.ELEMENT_NODE;
}
