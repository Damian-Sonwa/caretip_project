import type { Page } from "@playwright/test";

export type OverflowOffender = {
  tag: string;
  id: string;
  className: string;
  scrollWidth: number;
  clientWidth: number;
  overflow: number;
  selectorHint: string;
};

/** Mirrors DevTools: elements where scrollWidth > clientWidth. */
export async function findOverflowOffenders(page: Page, limit = 12): Promise<OverflowOffender[]> {
  return page.evaluate((max) => {
    type Row = {
      tag: string;
      id: string;
      className: string;
      scrollWidth: number;
      clientWidth: number;
      overflow: number;
      selectorHint: string;
    };

    const rows: Row[] = [];

    const hintFor = (el: Element): string => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.id) return `#${htmlEl.id}`;
      const parts: string[] = [];
      let node: Element | null = el;
      for (let depth = 0; node && depth < 4; depth += 1) {
        const tag = node.tagName.toLowerCase();
        const cls = (node as HTMLElement).className;
        const classToken =
          typeof cls === "string"
            ? cls
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .join(".")
            : "";
        parts.unshift(classToken ? `${tag}.${classToken}` : tag);
        node = node.parentElement;
      }
      return parts.join(" > ");
    };

    for (const el of Array.from(document.querySelectorAll("*"))) {
      const html = el as HTMLElement;
      if (html.scrollWidth <= html.clientWidth + 1) continue;
      const style = getComputedStyle(html);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = html.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      rows.push({
        tag: html.tagName.toLowerCase(),
        id: html.id,
        className: typeof html.className === "string" ? html.className.slice(0, 160) : "",
        scrollWidth: html.scrollWidth,
        clientWidth: html.clientWidth,
        overflow: html.scrollWidth - html.clientWidth,
        selectorHint: hintFor(html),
      });
    }

    rows.sort((a, b) => b.overflow - a.overflow);
    return rows.slice(0, max);
  }, limit);
}

export async function readPageOverflow(page: Page) {
  return page.evaluate(() => ({
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
    innerWidth: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
}
