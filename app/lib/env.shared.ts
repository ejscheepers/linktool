/**
 * Values that are safe to use on both the server and in the browser. Keep
 * secrets out of this file.
 */

const DEFAULT_TIME_ZONE = "Africa/Johannesburg";

export const appTimeZone =
  (typeof process !== "undefined" && process.env?.APP_TIMEZONE) ||
  DEFAULT_TIME_ZONE;

export const timeZoneLabel = appTimeZone.replace(/_/g, " ");
