const outdent = require("outdent");
const Image = require("@11ty/eleventy-img");
const fs = require("fs");
const NOT_FOUND_PATH = "_site/404.html";

module.exports = function (eleventyConfig) {
	// Copy the `css` directory to the output
	eleventyConfig.addPassthroughCopy("css");

	// Watch the `css` directory for changes
	eleventyConfig.addWatchTarget("css");

	eleventyConfig.addPassthroughCopy("public");
	eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);

	eleventyConfig.setBrowserSyncConfig({
		callbacks: {
			ready: function (err, bs) {
				bs.addMiddleware("*", (req, res) => {
					if (!fs.existsSync(NOT_FOUND_PATH)) {
						throw new Error(
							`Expected a \`${NOT_FOUND_PATH}\` file but could not find one. Did you create a 404.html template?`
						);
					}

					const content_404 = fs.readFileSync(NOT_FOUND_PATH);
					// Add 404 http status code in request header.
					res.writeHead(404, { "Content-Type": "text/html; charset=UTF-8" });
					// Provides the 404 content without redirect.
					res.write(content_404);
					res.end();
				});
			},
		},
	});
};

const imageShortcode = async (
	src,
	alt,
	className = undefined,
	widths = [300, 600],
	formats = ["webp", "jpeg"]
) => {
	const imageMetadata = await Image(src, {
		widths: [...widths, null],
		formats: [...formats, null],
		outputDir: "_site/assets/images",
		urlPath: "/assets/images",
	});

	const sourceHtmlString = Object.values(imageMetadata)
		// Map each format to the source HTML markup
		.map((images) => {
			// The first entry is representative of all the others
			// since they each have the same shape
			const { sourceType } = images[0];

			// Use our util from earlier to make our lives easier
			const sourceAttributes = stringifyAttributes({
				type: sourceType,
				// srcset needs to be a comma-separated attribute
				srcset: images.map((image) => image.srcset).join(", "),
			});

			// Return one <source> per format
			return `<source ${sourceAttributes}>`;
		})
		.join("\n");

	const getLargestImage = (format) => {
		const images = imageMetadata[format];
		return images[images.length - 1];
	};

	const largestUnoptimizedImg = getLargestImage(formats[0]);
	const imgAttributes = stringifyAttributes({
		src: largestUnoptimizedImg.url,
		width: largestUnoptimizedImg.width,
		height: largestUnoptimizedImg.height,
		alt,
		loading: "lazy",
		decoding: "async",
	});
	const imgHtmlString = `<img ${imgAttributes}>`;

	const pictureAttributes = stringifyAttributes({
		class: className,
	});
	const picture = `<picture ${pictureAttributes}>
    ${sourceHtmlString}
    ${imgHtmlString}
  </picture>`;

	return outdent`${picture}`;
};

const stringifyAttributes = (attributeMap) => {
	return Object.entries(attributeMap)
		.map(([attribute, value]) => {
			if (typeof value === "undefined") return "";
			return `${attribute}="${value}"`;
		})
		.join(" ");
};
