import { useState } from "react";
import { downloadReport, openReport } from "../api.js";
import { Notice, errorMessage } from "./common.jsx";

export default function ReportButtons({ reportUrl, filename }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const run = (name, fn) => async () => {
    setBusy(name);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <div className="button-row">
        <button className="btn" disabled={!!busy} onClick={run("view", () => openReport(reportUrl))}>
          {busy === "view" ? "Opening…" : "View report"}
        </button>
        <button className="btn quiet" disabled={!!busy} onClick={run("download", () => downloadReport(reportUrl, filename))}>
          {busy === "download" ? "Downloading…" : "Download report"}
        </button>
      </div>
      <Notice>{error}</Notice>
    </>
  );
}
