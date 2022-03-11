//
// shared.ts - various utilities that work on both client and server
//

import { stringify } from "querystring"

export const DEFAULT_LOCALE = "en-US"

/** Will Capitalize given string */
export function capitalize(str: string): string {
  if (str && str.length > 0) {
    return str.substring(0, 1).toUpperCase() + str.substring(1)
  }
  return str
}

//
// Localization and content related utilities
//

/**
 * Returns a content type strings that can be shown to users
 * @param contentType A mime content type, eg application/pdf or image/jpg
 * @param locale User's locale
 * @returns A simple type like pdf, jpeg or png
 */
export function prettyContentType(contentType: string, locale = DEFAULT_LOCALE) {
  if (contentType && contentType.indexOf("/") != -1) {
    if (contentType == "application/pdf") {
      return "pdf"
    }
    if (contentType.startsWith("image/")) {
      return contentType.substring(contentType.indexOf("/") + 1)
    }
    return contentType.substring(0, contentType.indexOf("/"))
  }
  return contentType
}

/**
 * Returns a file size formatted for users of given locale
 * @param size Size in bytes
 * @param locale User's locale
 * @returns Formatted size. eg. 2.39 GB
 */
export function prettyBytes(size: number, locale = DEFAULT_LOCALE) {
  const kb = size / 1024,
    mb = kb / 1024,
    gb = mb / 1024
  if (mb > 500) {
    return gb.toLocaleString(locale, { maximumFractionDigits: 2 }) + " GB"
  }
  if (mb > 1) {
    return mb.toLocaleString(locale, { maximumFractionDigits: 2 }) + " MB"
  }
  if (kb > 1) {
    return kb.toLocaleString(locale, { maximumFractionDigits: 2 }) + " kB"
  }
  return size.toLocaleString(locale, { maximumFractionDigits: 2 }) + " bytes"
}
