/**
 * Step-down canvas downsampling for smooth high-res image thumbnails.
 * Repeatedly halves the image through intermediate canvas frames until
 * reaching the target size, then center-crops to a square.
 */
export function downsampleImage(
  img: HTMLImageElement,
  targetSize: number,
): string {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d")!;
  let w = img.naturalWidth;
  let h = img.naturalHeight;

  // Step-down by halves until close to target
  while (w / 2 > targetSize || h / 2 > targetSize) {
    w = Math.max(Math.floor(w / 2), targetSize);
    h = Math.max(Math.floor(h / 2), targetSize);
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    // Use the current canvas as next source
    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    tmp.getContext("2d")!.drawImage(canvas, 0, 0);
    canvas = tmp;
    ctx = canvas.getContext("2d")!;
  }

  // Final draw at exact target
  const final = document.createElement("canvas");
  final.width = targetSize;
  final.height = targetSize;
  const fCtx = final.getContext("2d")!;
  // Crop to square from center
  const side = Math.min(w, h);
  const ox = (w - side) / 2;
  const oy = (h - side) / 2;
  fCtx.drawImage(canvas, ox, oy, side, side, 0, 0, targetSize, targetSize);
  return final.toDataURL("image/png");
}
