import {
	DitheringTypes,
	ShaderFitOptions,
	ShaderMount,
	defaultObjectSizing,
	getShaderColorFromString,
	imageDitheringFragmentShader,
} from '@paper-design/shaders';

type Sizing = typeof defaultObjectSizing;

function sizingUniforms(sizing: Sizing) {
	return {
		u_fit: ShaderFitOptions[sizing.fit],
		u_scale: sizing.scale,
		u_rotation: sizing.rotation,
		u_offsetX: sizing.offsetX,
		u_offsetY: sizing.offsetY,
		u_originX: sizing.originX,
		u_originY: sizing.originY,
		u_worldWidth: sizing.worldWidth,
		u_worldHeight: sizing.worldHeight,
	};
}

const MAX_PIXEL_COUNT = 1920 * 1080;

/** Line art gets lost in a 2-colour dither, so contrast is raised and dark strokes are thickened by stamping the image at 1px offsets. */
async function prepareLineArt(src: string, size: number) {
	const image = new Image();
	image.crossOrigin = 'anonymous';
	image.src = src;
	await image.decode();

	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d');
	if (!context) return image;

	context.fillStyle = '#fff';
	context.fillRect(0, 0, size, size);
	context.filter = 'grayscale(1) contrast(1.8) brightness(1.1)';
	context.globalCompositeOperation = 'darken';
	for (const [dx, dy] of [
		[0, 0],
		[1, 0],
		[0, 1],
		[1, 1],
	]) {
		context.drawImage(image, dx, dy, size, size);
	}
	// The vanilla ShaderMount only accepts an HTMLImageElement for texture uniforms.
	const prepared = new Image();
	prepared.src = canvas.toDataURL('image/png');
	await prepared.decode();
	return prepared;
}

export async function mountDitheredAvatar(element: HTMLElement) {
	const src = element.dataset.src;
	if (!src) return;
	const image = await prepareLineArt(src, 256);
	return new ShaderMount(
		element,
		imageDitheringFragmentShader,
		{
			u_image: image,
			u_colorBack: getShaderColorFromString('#4a2c1d'),
			u_colorFront: getShaderColorFromString('#e8a070'),
			u_colorHighlight: getShaderColorFromString('#fff4e2'),
			u_type: DitheringTypes['4x4'],
			u_pxSize: 1.5,
			u_colorSteps: 2,
			u_originalColors: false,
			u_inverted: false,
			...sizingUniforms({ ...defaultObjectSizing, fit: 'cover' }),
		},
		undefined,
		0,
		0,
		2,
		MAX_PIXEL_COUNT,
	);
}
