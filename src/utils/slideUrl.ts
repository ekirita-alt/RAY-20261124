/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Default fallback slide presentation URL
 * Real Google Slides presentation URL for Face-Driven Dentistry (with loop=true enabled)
 */
export const DEFAULT_FALLBACK_SLIDE_URL = 'https://docs.google.com/presentation/d/1QZ_xbrFeryvC7x57zo2GWfp5FcoTYYv1ohYi4u_jMak/embed?start=false&loop=true&delayms=3000';


/**
 * Formats any Google Slides or PowerPoint (OneDrive) URL into an embeddable iframe URL.
 * Supports:
 *  - Google Slides: /edit, /pub, /view -> /embed?start=false&loop=true&delayms=3000
 *  - PowerPoint Online / OneDrive: replaces :x:/ or action=view with action=embedview
 *  - Fallback to DEFAULT_FALLBACK_SLIDE_URL if empty or invalid
 */
export function formatSlideEmbedUrl(rawUrl?: string): string {
  if (!rawUrl || !rawUrl.trim()) {
    return DEFAULT_FALLBACK_SLIDE_URL;
  }

  const url = rawUrl.trim();

  // If already pointing to internal HTML slide presentation or custom embed
  if (url.startsWith('/slides/')) {
    return url;
  }

  // 1. Google Slides formatting
  // Match standard Google Slides presentation URL pattern
  // e.g. https://docs.google.com/presentation/d/{ID}/edit#slide=id.p
  // e.g. https://docs.google.com/presentation/d/{ID}/pub?start=false...
  // e.g. https://docs.google.com/presentation/d/{ID}/preview
  const googleSlidesRegex = /https:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/;
  const googleMatch = url.match(googleSlidesRegex);

  if (googleMatch) {
    const presentationId = googleMatch[1];
    return `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=true&delayms=3000`;
  }

  // 2. PowerPoint Online / OneDrive formatting
  // If OneDrive/SharePoint URL with action=default or action=view, convert to action=embedview
  if (url.includes('office.com') || url.includes('sharepoint.com') || url.includes('onedrive.live.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('action', 'embedview');
      return parsed.toString();
    } catch {
      // Fallback if URL parsing fails
      if (url.includes('action=view')) {
        return url.replace('action=view', 'action=embedview');
      }
    }
  }

  // If already an http/https URL that is not Google Slides, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return DEFAULT_FALLBACK_SLIDE_URL;
}
