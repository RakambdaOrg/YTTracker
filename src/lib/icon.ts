import {browser} from 'wxt/browser';

/** Turns RGBA pixels gray in place, keeping their transparency. */
export function grayscale(pixels: Uint8ClampedArray): void {
	for (let i = 0; i < pixels.length; i += 4) {
		const luma = Math.round(0.299 * (pixels[i] ?? 0) + 0.587 * (pixels[i + 1] ?? 0) + 0.114 * (pixels[i + 2] ?? 0));
		pixels[i] = pixels[i + 1] = pixels[i + 2] = luma;
	}
}

async function grayIcon(path: string, size: number): Promise<ImageData> {
	const bitmap = await createImageBitmap(await (await fetch(`/${path}`)).blob());
	const context = new OffscreenCanvas(size, size).getContext('2d');
	if (!context) {
		throw new Error('No 2D canvas');
	}
	context.drawImage(bitmap, 0, 0, size, size);
	const image = context.getImageData(0, 0, size, size);
	grayscale(image.data);
	return image;
}

/** Shows the toolbar icon grayed out while tracking is paused. */
export async function updateIcon(paused: boolean): Promise<void> {
	const manifest = browser.runtime.getManifest() as {action?: {default_icon?: Record<string, string>}};
	const icons = manifest.action?.default_icon ?? {};
	if (!paused) {
		await browser.action.setIcon({path: icons});
		return;
	}
	const entries = await Promise.all(Object.entries(icons).map(async ([size, path]) => [size, await grayIcon(path, Number(size))] as const));
	await browser.action.setIcon({imageData: Object.fromEntries(entries)});
}
