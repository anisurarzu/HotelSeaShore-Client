/**
 * Reliable invoice PDF export for desktop + mobile browsers.
 * Uses blob + <a download> instead of html2pdf().save(), which desktop
 * Chrome/Edge often block after an async import breaks the user-gesture chain.
 */

function waitForImages(root) {
  const imgs = Array.from(root.querySelectorAll("img"));
  if (!imgs.length) return Promise.resolve();
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 2500);
        })
    )
  );
}

function prepareCloneForExport(sourceEl) {
  const clone = sourceEl.cloneNode(true);
  clone.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    const isRemote =
      /^https?:\/\//i.test(src) && !src.includes(window.location.host);
    if (isRemote) {
      img.setAttribute("crossorigin", "anonymous");
      img.onerror = () => {
        img.style.display = "none";
        img.removeAttribute("src");
      };
    }
  });
  return clone;
}

export async function downloadElementPdf(element, filename) {
  if (!element) throw new Error("Invoice element not found");

  const html2pdf = (await import("html2pdf.js")).default;
  await waitForImages(element);

  const clone = prepareCloneForExport(element);
  clone.style.position = "fixed";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.width = element.offsetWidth ? `${element.offsetWidth}px` : "210mm";
  clone.style.background = "#ffffff";
  document.body.appendChild(clone);

  try {
    await waitForImages(clone);

    const options = {
      margin: [0.22, 0.22, 0.22, 0.22],
      filename: filename || "Invoice.pdf",
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: {
        scale: Math.min(2, window.devicePixelRatio > 1 ? 2 : 1.5),
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: clone.scrollWidth,
      },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    const blob = await html2pdf().set(options).from(clone).outputPdf("blob");
    if (!blob || blob.size < 500) {
      throw new Error("Generated PDF was empty");
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "Invoice.pdf";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } finally {
    clone.remove();
  }
}

/**
 * Desktop-friendly print via dedicated window (avoids blank pages from
 * visibility:hidden print CSS fighting app chrome on Chrome/Edge).
 */
export function printInvoicePage() {
  if (typeof window === "undefined") return;
  const element = document.getElementById("invoice-card");
  if (!element) {
    window.print();
    return;
  }

  const title =
    document.title ||
    `Invoice-${element.querySelector("[data-booking-no]")?.textContent || ""}`;
  const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((node) => node.outerHTML)
    .join("\n");

  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
  if (!win) {
    // Popup blocked — fall back to in-page print
    window.print();
    return;
  }

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title.replace(/</g, "")}</title>
  ${styles}
  <style>
    @page { size: A4; margin: 0.22in; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body { padding: 8px !important; }
    #invoice-card, .invoice-card-export {
      box-shadow: none !important;
      margin: 0 auto !important;
      max-width: 210mm !important;
      width: 100% !important;
    }
    .print\\:hidden, .no-print { display: none !important; }
  </style>
</head>
<body>
  ${element.outerHTML}
  <script>
    window.onload = function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`);
  win.document.close();
}
