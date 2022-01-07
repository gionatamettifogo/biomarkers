// Imports the Google Cloud client libraries

const vision = require('@google-cloud/vision').v1;
import fs from 'fs/promises';

function assert(value: unknown) {
	if (!value) throw 'An error occoured';
}

// create a google vision client located in the EU
const imageAnnotatorClientOptions = { apiEndpoint: 'eu-vision.googleapis.com' };
const imageAnnotatorClient = new vision.ImageAnnotatorClient(imageAnnotatorClientOptions);

/**
 * Calls Google Vision APIs to perform OCR on a pdf document and return annotations
 * @see https://console.cloud.google.com/apis/library/vision.googleapis.com
 * @see https://cloud.google.com/vision/docs/pdf
 * @param sourceUri Url of a pdf document in google storage gs:// or local path
 * @returns The response from Google Vision APIs
 */
export async function getGoogleVisionAnnotations(sourceUri: string): Promise<any> {
	try {
		let inputConfig;
		if (sourceUri.startsWith('gs://')) {
			// reading a file stored in an accessible google storage bucket
			// supported mime_types are: 'application/pdf' and 'image/tiff'
			inputConfig = { mimeType: 'application/pdf', gcsSource: { uri: sourceUri } };
		} else {
			// read file from local filesystem and send along with request to annotate
			inputConfig = { mimeType: 'application/pdf', content: await fs.readFile(sourceUri) };
		}

		// make the synchronous batch request, process the results
		// just get the first result since only one file was sent
		const [result] = await imageAnnotatorClient.batchAnnotateFiles({
			requests: [{ inputConfig, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }],
		});

		assert(result.responses[0].responses);
		return result.responses[0].responses;
	} catch (exception) {
		console.error(exception);
		throw exception;
	}
}

/**
 * Takes a google vision fullTextAnnotation response and converts it to
 * an internal format that we use we block and paragraph information is
 * dropped and everything is converted to pages and words on page.
 * @param responses The original google vision response from getGoogleVisionAnnotations
 * @returns A normalized and simplified version of the annotations
 */
export async function normalizeGoogleVisionAnnotations(responses: any) {
	// https://cloud.google.com/vision/docs/reference/rest/v1/AnnotateImageResponse#TextAnnotation
	const normalized = { pages: new Array<any>() };

	for (const response of responses) {
		assert(!response.error);
		const normalizedPage: any = {};
		normalized.pages.push(normalizedPage);

		const fullTextAnnotation = response.fullTextAnnotation;
		const page = fullTextAnnotation.pages[0];
		assert(fullTextAnnotation.pages.length == 1);
		assert(page.width > 0 && page.height > 0);

		normalizedPage.pageNumber = response.context.pageNumber;
		normalizedPage.detectedLanguages = page?.property?.detectedLanguages.slice(0, 3);
		normalizedPage.text = fullTextAnnotation.text;
		normalizedPage.width = page.width;
		normalizedPage.height = page.height;
		normalizedPage.words = new Array();

		for (const block of page.blocks) {
			// skipping blocks as they are huge and useless
			for (const paragraph of block.paragraphs) {
				// skipping paragraphs as they are quite large and useless
				for (const word of paragraph.words) {
					let word_text = '';
					for (const symbol of word.symbols) {
						word_text += symbol.text;

						// is there a space or other break?
						if (symbol.property?.detectedBreak) {
							// https://cloud.google.com/vision/docs/reference/rest/v1/AnnotateImageResponse#breaktype
							let breakSymbol = null;
							switch (symbol.property?.detectedBreak?.type) {
								case 'SPACE':
									breakSymbol = ' ';
									break;
								case 'SURE_SPACE':
									breakSymbol = '  ';
									break;
								case 'LINE_BREAK':
									breakSymbol = '\n';
									break;
							}
							if (breakSymbol) {
								if (symbol.property.detectedBreak.isPrefix) word_text = breakSymbol + word_text;
								else word_text += breakSymbol;
							}
						}
					}

					normalizedPage.words.push({
						text: word_text,
						boundingBox: word.boundingBox.normalizedVertices,
						confidence: word.confidence.toFixed(3),
					});
				}
			}
		}
	}

	return normalized;
}

//
// further processing of ocr results...
//

function htmlEntities(str?: string) {
	if (str) {
		return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}
	return null;
}

function bboxToSvg(boundingBox: any, color: any, w: number, h: number, tooltip?: string) {
	const v = [
		(boundingBox[0].x * w).toFixed(0),
		(boundingBox[0].y * h).toFixed(0),
		(boundingBox[1].x * w).toFixed(0),
		(boundingBox[1].y * h).toFixed(0),
		(boundingBox[2].x * w).toFixed(0),
		(boundingBox[2].y * h).toFixed(0),
		(boundingBox[3].x * w).toFixed(0),
		(boundingBox[3].y * h).toFixed(0),
	];
	return `<polygon points='${v[0]},${v[1]} ${v[2]},${v[3]} \
    ${v[4]},${v[5]} ${v[6]},${v[7]}' style='stroke:${color};\
    fill:transparent;stroke-width:1'><title>'${htmlEntities(tooltip)}'</title></polygon>\n`;
}

/**
 * Converts annotations to an html page for debugging and development
 * @param annotations Annotations generated by normalizeGoogleVisionAnnotations 
 * @param pageNumber Page number is 1 based
 * @returns A simple html page with an svg image showing words in the document
 */
export function annotationsToHtml(annotations: any, pageNumber?: number): string {
	const page = annotations.pages[(pageNumber || 1) - 1];

	let svg = '';
	for (const word of page.words) {
		svg += bboxToSvg(word.boundingBox, 'green', page.width, page.height, word.text);
	}

	svg = `<html><body><svg height='${page.height}' width='${page.width}'>${svg}</svg></body></html>`;
	return svg;
}