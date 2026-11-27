import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import CommonLoader from "../../../components/ui/CommonLoader";
GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ""}/assets/workers/pdf.worker.min.mjs`;

export default function PdfPageCanvas({ bytes, page = 1, onRendered }) {
  const canvas = useRef(null),
    wrapper = useRef(null),
    rendered = useRef(onRendered);
  rendered.current = onRendered;
  const [width, setWidth] = useState(600),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(1, entries[0].contentRect.width))
    );
    observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!bytes) return;
    let disposed = false,
      renderTask;
    setLoading(true);
    setError("");
    const task = getDocument({ data: new Uint8Array(bytes.slice(0)), isEvalSupported: false });
    (async () => {
      const pdf = await task.promise;
      const pdfPage = await pdf.getPage(page);
      if (disposed) return;
      const natural = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({
        scale: (width / natural.width) * Math.min(window.devicePixelRatio || 1, 2),
      });
      const target = canvas.current;
      target.width = Math.ceil(viewport.width);
      target.height = Math.ceil(viewport.height);
      renderTask = pdfPage.render({ canvasContext: target.getContext("2d"), viewport });
      await renderTask.promise;
      if (!disposed) {
        setLoading(false);
        rendered.current?.();
      }
    })().catch((err) => {
      if (!disposed && err.name !== "RenderingCancelledException") {
        setError("Unable to display this page. Reopen the document to retry.");
        setLoading(false);
      }
    });
    return () => {
      disposed = true;
      renderTask?.cancel();
      task.destroy();
    };
  }, [bytes, page, width]);
  return (
    <div ref={wrapper} className="relative w-full">
      {loading && (
        <div className="absolute inset-x-0 top-0 z-10 bg-white/90">
          <CommonLoader compact text="Loading page…" />
        </div>
      )}
      {error && (
        <p role="alert" className="p-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <canvas ref={canvas} className="block h-auto w-full" style={{ background: "#fff" }} />
    </div>
  );
}
