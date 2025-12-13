import * as THREE from "three";
import { createStandardMaterial } from "../../renderkit/materialUtils.js";

function createNoiseTexture(baseColor) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const color = new THREE.Color(baseColor);

  // Fill base.
  ctx.fillStyle = `rgb(${(color.r * 255) | 0}, ${(color.g * 255) | 0}, ${(color.b * 255) | 0})`;
  ctx.fillRect(0, 0, size, size);

  // Layer a gentle cloudy noise so the skin does not look flat.
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = 20 - Math.random() * 40; // +/-20 delta
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Create a MeshStandardNodeMaterial styled to resemble the Zoo elephant skin.
 * The material is intentionally lightweight but keeps the rough, leathery
 * surface and supports both smooth and low-poly shading.
 */
export function createElephantSkinMaterial(options = {}) {
  const {
    color = "#7a7a7a",
    roughness = 0.85,
    metalness = 0.0,
    flatShading = false,
  } = options;

  const texture = createNoiseTexture(color);

  return createStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
    map: texture,
    skinning: true,
    flatShading,
  });
}

export default createElephantSkinMaterial;
