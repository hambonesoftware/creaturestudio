const OVERLAY_ID = "zoo-renderkit-webgpu-overlay";

export function ensureWebGPUOverlay(container, message = "WebGPU is required to render this experience.") {
  if (!container) return null;
  let overlay = container.querySelector(`#${OVERLAY_ID}`);
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.background = "linear-gradient(135deg, #0b1224, #131a2f)";
  overlay.style.color = "#e2edff";
  overlay.style.fontFamily = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  overlay.style.fontSize = "1rem";
  overlay.style.letterSpacing = "0.01em";
  overlay.style.textAlign = "center";
  overlay.style.padding = "1.5rem";
  overlay.style.zIndex = "10";

  overlay.textContent = message;
  container.appendChild(overlay);
  return overlay;
}

export function removeWebGPUOverlay(container) {
  if (!container) return;
  const overlay = container.querySelector(`#${OVERLAY_ID}`);
  if (overlay && overlay.parentNode === container) {
    overlay.parentNode.removeChild(overlay);
  }
}
