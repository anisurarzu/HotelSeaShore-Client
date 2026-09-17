/**
 * Invoice PDF + print helpers.
 * Avoid off-screen clones and visibility:hidden print tricks — both cause
 * blank Chrome/Edge print previews and empty PDFs on desktop.
 */

function waitForImages(root) {
  const imgs = Array.from(root.querySelectorAll("img"));
  if (!imgs.length) return Promise.resolve();
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          setTimeout(done, 2000);
        })
    )
  );
}

function hideForCapture(selectors) {
  const nodes = [];
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      nodes.push({ el, display: el.style.display });
      el.style.display = "none";
    });
  });
  return () => {
    nodes.forEach(({ el, display }) => {
      el.style.display = display;
    });
  };
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "Invoice.pdf";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function downloadElementPdf(element, filename) {
  if (!element) throw new Error("Invoice element not found");

  const html2pdf = (await import("html2pdf.js")).default;

  // Prefer same-origin / local logos; remote without CORS blanks canvas
  element.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (/^https?:\/\//i.test(src) && !src.includes(window.location.host)) {
      img.setAttribute("crossorigin", "anonymous");
    }
  });

  await waitForImages(element);
  element.scrollIntoView({ block: "start", behavior: "instant" });

  const restore = hideForCapture([".inv-toolbar", ".print\\:hidden", ".no-print"]);

  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  try {
    // Brief paint so layout settles after hiding toolbar
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const options = {
      margin: [0.2, 0.2, 0.2, 0.2],
      filename: filename || "Invoice.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        windowWidth: document.documentElement.clientWidth,
        onclone: (doc) => {
          const card = doc.getElementById("invoice-card");
          if (card) {
            card.style.boxShadow = "none";
            card.style.maxWidth = "210mm";
            card.style.width = "100%";
            card.style.margin = "0 auto";
            card.style.background = "#ffffff";
          }
          doc.querySelectorAll(".inv-toolbar, .no-print").forEach((n) => {
            n.style.display = "none";
          });
        },
      },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    // Capture the LIVE visible element (not an off-screen clone)
    const worker = html2pdf().set(options).from(element);
    const blob = await worker.outputPdf("blob");

    if (!blob || blob.size < 800) {
      throw new Error("Generated PDF was empty");
    }

    triggerBlobDownload(blob, filename || "Invoice.pdf");
    return true;
  } finally {
    document.body.style.overflow = prevOverflow;
    restore();
  }
}

/** In-page print — relies on @media print rules (no popup / about:blank). */
export function printInvoicePage() {
  if (typeof window === "undefined") return;
  const element = document.getElementById("invoice-card");
  if (element) {
    element.scrollIntoView({ block: "start", behavior: "instant" });
  }
  window.requestAnimationFrame(() => {
    window.print();
  });
}
