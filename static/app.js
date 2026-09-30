(() => {
  "use strict";

  // Copyright (c) 2026 nTech / ntech.rs. All rights reserved.

  const token = new URLSearchParams(window.location.search).get("token") || "";
  const $ = (id) => document.getElementById(id);
  const dropZone = $("dropZone");
  const fileInput = $("fileInput");
  const folderInput = $("folderInput");
  const folderButton = $("folderButton");
  const filePanel = $("filePanel");
  const fileList = $("fileList");
  const clearButton = $("clearButton");
  const convertButton = $("convertButton");
  const statusPanel = $("statusPanel");
  const statusLabel = $("statusLabel");
  const statusPercent = $("statusPercent");
  const statusDetail = $("statusDetail");
  const progressBar = $("progressBar");
  const cancelButton = $("cancelButton");
  const warningPanel = $("warningPanel");
  const errorPanel = $("errorPanel");
  const resultPanel = $("resultPanel");
  const resultList = $("resultList");
  const newConversionButton = $("newConversionButton");
  const shutdownButton = $("shutdownButton");
  const steps = [...document.querySelectorAll(".step")];

  let selectedFiles = [];
  let currentJob = null;
  let pollingTimer = null;
  let busy = false;

  function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("X-App-Token", token);
    return fetch(path, { ...options, headers });
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return "—";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = bytes;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1; }
    return `${value.toFixed(index < 2 ? 0 : 2)} ${units[index]}`;
  }

  function extension(name) {
    const dot = name.lastIndexOf(".");
    return dot >= 0 ? name.slice(dot).toLowerCase() : "";
  }

  function validateFiles(files) {
    const cues = files.filter((file) => extension(file.name) === ".cue");
    const bins = files.filter((file) => extension(file.name) === ".bin");
    if (files.some((file) => ![".cue", ".bin"].includes(extension(file.name)))) {
      return "Only .BIN and .CUE files are allowed.";
    }
    if (cues.length !== 1) return "Select exactly one .CUE file.";
    if (bins.length < 1) return "Add at least one .BIN file.";
    const names = new Set();
    for (const file of files) {
      const key = file.name.toLocaleLowerCase();
      if (names.has(key)) return `Duplicate file name: ${file.name}`;
      names.add(key);
    }
    return null;
  }

  function setFiles(incoming) {
    if (busy) return;
    const allowed = incoming.filter((file) => [".bin", ".cue"].includes(extension(file.name)));
    if (allowed.length === 0) {
      showError("The selection does not contain any .BIN or .CUE files.");
      return;
    }
    const map = new Map(selectedFiles.map((file) => [file.name.toLocaleLowerCase(), file]));
    allowed.forEach((file) => map.set(file.name.toLocaleLowerCase(), file));
    selectedFiles = [...map.values()];
    renderFiles();
  }

  function fileFromEntry(entry) {
    return new Promise((resolve, reject) => entry.file(resolve, reject));
  }

  async function directoryEntries(entry) {
    const reader = entry.createReader();
    const all = [];
    while (true) {
      const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
      if (!batch.length) return all;
      all.push(...batch);
    }
  }

  async function filesFromEntry(entry) {
    if (entry.isFile) return [await fileFromEntry(entry)];
    if (!entry.isDirectory) return [];
    const children = await directoryEntries(entry);
    const nested = await Promise.all(children.map(filesFromEntry));
    return nested.flat();
  }

  async function filesFromDrop(dataTransfer) {
    const entries = [...(dataTransfer.items || [])]
      .map((item) => item.webkitGetAsEntry?.())
      .filter(Boolean);
    if (!entries.length) return [...dataTransfer.files];
    const groups = await Promise.all(entries.map(filesFromEntry));
    return groups.flat();
  }

  function renderFiles() {
    fileList.innerHTML = "";
    selectedFiles.forEach((file) => {
      const li = document.createElement("li");
      const ext = extension(file.name).slice(1).toUpperCase();
      li.innerHTML = `
        <span class="file-icon">${ext}</span>
        <span class="file-info"><strong></strong><span>${formatBytes(file.size)}</span></span>
        <span class="file-ok">✓</span>`;
      li.querySelector("strong").textContent = file.name;
      fileList.appendChild(li);
    });
    filePanel.classList.toggle("hidden", selectedFiles.length === 0);
    const error = validateFiles(selectedFiles);
    convertButton.disabled = Boolean(error) || busy;
    folderButton.disabled = busy;
    errorPanel.classList.add("hidden");
    if (selectedFiles.length && error) showError(error);
  }

  function showError(message) {
    errorPanel.textContent = message;
    errorPanel.classList.remove("hidden");
  }

  function setProgress(percent, label, detail = "") {
    const safe = Math.max(0, Math.min(100, Number(percent) || 0));
    statusPanel.classList.remove("hidden");
    progressBar.style.width = `${safe}%`;
    statusPercent.textContent = `${Math.round(safe)}%`;
    statusLabel.textContent = label;
    statusDetail.textContent = detail;
  }

  function setStep(index) {
    steps.forEach((step, i) => {
      step.classList.toggle("active", i === index);
      step.classList.toggle("done", i < index);
      if (i < index) step.querySelector("b").textContent = "✓";
      else step.querySelector("b").textContent = String(i + 1);
    });
  }

  function uploadFile(jobId, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", `/api/jobs/${jobId}/files?name=${encodeURIComponent(file.name)}`);
      xhr.setRequestHeader("X-App-Token", token);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(event.loaded);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else {
          try { reject(new Error(JSON.parse(xhr.responseText).error)); }
          catch { reject(new Error("Upload failed.")); }
        }
      };
      xhr.onerror = () => reject(new Error("The local connection was interrupted."));
      xhr.send(file);
    });
  }

  async function convert() {
    const validation = validateFiles(selectedFiles);
    if (validation) return showError(validation);
    busy = true;
    renderFiles();
    warningPanel.classList.add("hidden");
    errorPanel.classList.add("hidden");
    resultPanel.classList.add("hidden");
    convertButton.classList.add("hidden");
    cancelButton.classList.remove("hidden");
    clearButton.disabled = true;
    setStep(1);

    try {
      const createResponse = await api("/api/jobs", { method: "POST" });
      if (!createResponse.ok) throw new Error("Could not create a local conversion job.");
      currentJob = (await createResponse.json()).id;

      const total = selectedFiles.reduce((sum, file) => sum + file.size, 0);
      let completed = 0;
      for (const file of selectedFiles) {
        await uploadFile(currentJob, file, (loaded) => {
          const uploadPercent = ((completed + loaded) / total) * 100;
          setProgress(uploadPercent, "Loading into the local app", file.name);
        });
        completed += file.size;
      }

      setProgress(0, "Converting sectors", "Reading the CUE and preparing tracks…");
      const cue = selectedFiles.find((file) => extension(file.name) === ".cue");
      const startResponse = await api(`/api/jobs/${currentJob}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cueName: cue.name }),
      });
      if (!startResponse.ok) {
        const data = await startResponse.json().catch(() => ({}));
        throw new Error(data.error || "Conversion could not be started.");
      }
      pollStatus();
    } catch (error) {
      finishWithError(error.message || String(error));
    }
  }

  async function pollStatus() {
    try {
      const response = await api(`/api/jobs/${currentJob}/status`);
      if (!response.ok) throw new Error("Could not read conversion status.");
      const data = await response.json();
      setProgress(data.progress, "Converting sectors", data.message);
      if (data.status === "done") return finishDone(data);
      if (data.status === "error") return finishWithError(data.error || data.message);
      if (data.status === "cancelled") return finishWithError("Conversion cancelled.");
      pollingTimer = window.setTimeout(pollStatus, 250);
    } catch (error) {
      finishWithError(error.message || String(error));
    }
  }

  function finishDone(data) {
    busy = false;
    cancelButton.classList.add("hidden");
    setProgress(100, "Conversion complete", data.message);
    setStep(2);
    resultList.innerHTML = "";
    data.results.forEach((result, index) => {
      const row = document.createElement("div");
      row.className = "result-row";
      row.innerHTML = `
        <span class="file-icon">ISO</span>
        <div><strong></strong><span>Track ${String(result.track).padStart(2, "0")} · ${result.mode} · ${formatBytes(result.size)}</span></div>
        <a class="download-button">Download</a>`;
      row.querySelector("strong").textContent = result.name;
      const link = row.querySelector("a");
      link.href = `/api/jobs/${currentJob}/results/${index}?token=${encodeURIComponent(token)}`;
      link.download = result.name;
      resultList.appendChild(row);
    });
    if (data.warnings.length) {
      warningPanel.textContent = data.warnings.join(" ");
      warningPanel.classList.remove("hidden");
    }
    resultPanel.classList.remove("hidden");
  }

  function finishWithError(message) {
    busy = false;
    if (pollingTimer) window.clearTimeout(pollingTimer);
    cancelButton.classList.add("hidden");
    convertButton.classList.remove("hidden");
    clearButton.disabled = false;
    showError(message);
    renderFiles();
    setStep(0);
  }

  function reset() {
    if (pollingTimer) window.clearTimeout(pollingTimer);
    selectedFiles = [];
    currentJob = null;
    busy = false;
    statusPanel.classList.add("hidden");
    warningPanel.classList.add("hidden");
    errorPanel.classList.add("hidden");
    resultPanel.classList.add("hidden");
    convertButton.classList.remove("hidden");
    clearButton.disabled = false;
    setStep(0);
    renderFiles();
  }

  dropZone.addEventListener("click", () => !busy && fileInput.click());
  fileInput.addEventListener("change", () => { setFiles([...fileInput.files]); fileInput.value = ""; });
  folderButton.addEventListener("click", () => !busy && folderInput.click());
  folderInput.addEventListener("change", () => { setFiles([...folderInput.files]); folderInput.value = ""; });
  ["dragenter", "dragover"].forEach((name) => dropZone.addEventListener(name, (event) => {
    event.preventDefault();
    if (!busy) dropZone.classList.add("dragging");
  }));
  ["dragleave", "drop"].forEach((name) => dropZone.addEventListener(name, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  }));
  dropZone.addEventListener("drop", async (event) => {
    try { setFiles(await filesFromDrop(event.dataTransfer)); }
    catch { showError("The folder could not be read. Try the ‘Choose a whole folder’ button."); }
  });
  clearButton.addEventListener("click", reset);
  newConversionButton.addEventListener("click", reset);
  convertButton.addEventListener("click", convert);
  cancelButton.addEventListener("click", async () => {
    if (currentJob) await api(`/api/jobs/${currentJob}/cancel`, { method: "POST" }).catch(() => {});
    cancelButton.disabled = true;
    statusDetail.textContent = "Stopping after the current block…";
  });
  shutdownButton.addEventListener("click", async () => {
    shutdownButton.disabled = true;
    await api("/api/shutdown", { method: "POST" }).catch(() => {});
    document.body.innerHTML = '<main class="shell"><section class="card"><h1>The app has stopped.</h1><p style="color:#929aab">You can close this tab now.</p></section></main>';
  });

  renderFiles();
})();
