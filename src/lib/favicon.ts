const FAVICON_WIDTH = 16;
const FAVICON_SQUARES_PER_SIDE = 4;

let defaultHref: string | null = null;

function drawPalette(
  canvas: HTMLCanvasElement,
  squaresPerSide: number,
  colors: string[],
) {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const squareWidth = canvas.width / squaresPerSide;
  let colorIndex = 0;

  for (let row = 0; row < squaresPerSide; row += 1) {
    for (let column = 0; column < squaresPerSide; column += 1) {
      context.fillStyle = colors[colorIndex];
      context.fillRect(
        column * squareWidth,
        row * squareWidth,
        squareWidth,
        squareWidth,
      );
      colorIndex = (colorIndex + 1) % colors.length;
    }
  }
}

function createFaviconUrl(colors: string[]) {
  const canvas = document.createElement("canvas");
  canvas.width = FAVICON_WIDTH;
  canvas.height = FAVICON_WIDTH;

  drawPalette(canvas, FAVICON_SQUARES_PER_SIDE, colors);

  return canvas.toDataURL();
}

export function updateFavicon(colors: string[]) {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    return;
  }

  if (defaultHref === null) {
    defaultHref = link.getAttribute("href");
  }

  if (colors.length === 0) {
    if (defaultHref) {
      link.href = defaultHref;
    }
    return;
  }

  link.href = createFaviconUrl(colors);
}
