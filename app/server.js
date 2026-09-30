'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const HOST = '0.0.0.0';
const PORT = Number(process.env.LAN_TRANSFER_PORT || 8765);
const TOKEN = crypto.randomBytes(6).toString('hex');
const ROOT_DIR = path.resolve(__dirname, '..');
const RECEIVE_DIR = path.join(ROOT_DIR, 'Received Files');
const PID_FILE = path.join(__dirname, 'server.pid');
const LOG_FILE = path.join(ROOT_DIR, 'transfer.log');
const startedAt = new Date().toISOString();

fs.mkdirSync(RECEIVE_DIR, { recursive: true });

const state = {
  successfulFiles: 0,
  failedFiles: 0,
  receivedBytes: 0,
  activeUploads: 0,
  events: [],
};

function logEvent(level, message, details = {}) {
  const event = { time: new Date().toISOString(), level, message, ...details };
  state.events.unshift(event);
  state.events = state.events.slice(0, 60);
  const suffix = details.path ? ` | ${details.path}` : details.error ? ` | ${details.error}` : '';
  const line = `[${event.time}] ${level.toUpperCase()}: ${message}${suffix}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, `${line}\r\n`, 'utf8'); } catch (error) { console.error(`Could not write the log: ${error.message}`); }
}

function safeRelativePath(input) {
  const raw = String(input || '').replace(/\\/g, '/');
  const parts = raw.split('/').filter(Boolean);
  if (!parts.length || parts.some((part) => part === '.' || part === '..')) throw new Error('Invalid file path.');
  const cleaned = parts.map((part) => {
    const value = part.replace(/[<>:"|?*\x00-\x1f]/g, '_').replace(/[. ]+$/g, '').slice(0, 180);
    if (!value || value === '.' || value === '..') throw new Error('Invalid file or folder name.');
    return value;
  });
  const relative = cleaned.join(path.sep);
  if (relative.length > 1200) throw new Error('The folder path is too long.');
  const resolved = path.resolve(RECEIVE_DIR, relative);
  if (resolved !== RECEIVE_DIR && !resolved.startsWith(`${RECEIVE_DIR}${path.sep}`)) throw new Error('Invalid destination path.');
  return { relative, resolved };
}

function availablePath(destination) {
  if (!fs.existsSync(destination)) return destination;
  const parsed = path.parse(destination);
  let number = 1;
  let candidate;
  do { candidate = path.join(parsed.dir, `${parsed.name} (${number++})${parsed.ext}`); } while (fs.existsSync(candidate));
  return candidate;
}

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function html(res, body) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'",
  });
  res.end(body);
}

function formatBytes(value) {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unit = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / (1024 ** unit)).toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function page() {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>LAN File Transfer</title>
<style>
:root{color-scheme:dark;--bg:#0b1020;--panel:#141c2f;--line:#2c3955;--text:#edf3ff;--muted:#9eabc3;--blue:#66a6ff;--green:#55d68b;--red:#ff7474}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top,#17233e,var(--bg) 45%);color:var(--text);font:16px system-ui,-apple-system,Segoe UI,sans-serif;min-height:100vh;padding:36px 16px}
main{width:min(820px,100%);margin:auto}.head{display:flex;align-items:center;justify-content:space-between;gap:16px}.online{color:var(--green);font-weight:700}.offline{color:var(--red);font-weight:700}
.card{background:color-mix(in srgb,var(--panel) 94%,transparent);border:1px solid var(--line);border-radius:20px;padding:24px;box-shadow:0 18px 60px #0006;margin-top:18px}
h1{font-size:clamp(27px,5vw,42px);margin:0 0 6px}p{color:var(--muted)}.drop{border:2px dashed #5877a9;border-radius:16px;padding:42px 18px;text-align:center;background:#0f1729;transition:.15s}
.drop.over{border-color:var(--blue);background:#172c4c;transform:scale(1.005)}button{background:var(--blue);color:#06101f;border:0;border-radius:11px;padding:12px 17px;font-weight:800;cursor:pointer;margin:5px}
button.secondary{background:#2b3954;color:var(--text)}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.stat{background:#0e1627;border-radius:12px;padding:14px}.stat b{display:block;font-size:21px;margin-top:4px}
.queue{max-height:330px;overflow:auto}.item{padding:11px 0;border-bottom:1px solid #25314a}.row{display:flex;justify-content:space-between;gap:12px}.name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.result{font-size:13px;color:var(--muted)}
.bar{height:7px;background:#2a354d;border-radius:7px;overflow:hidden;margin-top:8px}.fill{height:100%;width:0;background:var(--blue)}.ok .fill{background:var(--green)}.error .fill{background:var(--red)}.error .result{color:var(--red)}
.events{font:13px ui-monospace,SFMono-Regular,Consolas,monospace;max-height:180px;overflow:auto;color:#bdc9dd}.events div{margin:6px 0}.empty{color:var(--muted)}
@media(max-width:640px){.summary{grid-template-columns:1fr 1fr}.head{align-items:flex-start;flex-direction:column}}
</style></head><body><main>
<div class="head"><div><h1>LAN File Transfer</h1><p>Securely send files and complete folders to the receiving computer over the local network.</p></div><div id="connection" class="online">● Receiver connected</div></div>
<section class="card"><div id="drop" class="drop"><h2>Drop files or folders here</h2><p>Folder structure is preserved on the receiving computer.</p><button id="filesButton">Choose files</button><button id="folderButton" class="secondary">Choose a folder</button><input id="filesInput" type="file" multiple hidden><input id="folderInput" type="file" webkitdirectory directory multiple hidden></div></section>
<section class="card"><div class="summary"><div class="stat">Queue<b id="queued">0</b></div><div class="stat">Completed<b id="completed">0</b></div><div class="stat">Failed<b id="failed">0</b></div><div class="stat">Transferred<b id="bytes">0 B</b></div></div><div id="queue" class="queue"><p class="empty">No files selected yet.</p></div></section>
<section class="card"><h3>Receiver acknowledgements</h3><p>These messages come back from the receiving computer.</p><div id="events" class="events"><div class="empty">Waiting for activity…</div></div></section>
<script>
const base=location.pathname;
const drop=document.querySelector('#drop'),filesInput=document.querySelector('#filesInput'),folderInput=document.querySelector('#folderInput'),queue=document.querySelector('#queue');
let completed=0,failed=0,totalBytes=0,pending=0;
document.querySelector('#filesButton').onclick=()=>filesInput.click();document.querySelector('#folderButton').onclick=()=>folderInput.click();
filesInput.onchange=()=>enqueue([...filesInput.files].map(file=>({file,path:file.name})));
folderInput.onchange=()=>enqueue([...folderInput.files].map(file=>({file,path:file.webkitRelativePath||file.name})));
for(const name of ['dragenter','dragover'])drop.addEventListener(name,event=>{event.preventDefault();drop.classList.add('over')});
for(const name of ['dragleave','drop'])drop.addEventListener(name,event=>{event.preventDefault();drop.classList.remove('over')});
drop.addEventListener('drop',async event=>{const items=[...event.dataTransfer.items];if(items.some(item=>item.webkitGetAsEntry)){const entries=await Promise.all(items.map(item=>walk(item.webkitGetAsEntry())));enqueue(entries.flat())}else enqueue([...event.dataTransfer.files].map(file=>({file,path:file.name}))) });
async function walk(entry,prefix=''){if(!entry)return[];if(entry.isFile)return new Promise(resolve=>entry.file(file=>resolve([{file,path:prefix+file.name}]),()=>resolve([])));if(entry.isDirectory){const reader=entry.createReader(),children=[];while(true){const batch=await new Promise(resolve=>reader.readEntries(resolve,()=>resolve([])));if(!batch.length)break;children.push(...batch)}const nested=await Promise.all(children.map(child=>walk(child,prefix+entry.name+'/')));return nested.flat()}return[]}
function formatBytes(value){if(!value)return'0 B';const units=['B','KB','MB','GB','TB'],unit=Math.min(Math.floor(Math.log(value)/Math.log(1024)),units.length-1);return(value/1024**unit).toFixed(unit?1:0)+' '+units[unit]}
function updateSummary(){document.querySelector('#queued').textContent=pending;document.querySelector('#completed').textContent=completed;document.querySelector('#failed').textContent=failed;document.querySelector('#bytes').textContent=formatBytes(totalBytes)}
async function enqueue(files){if(!files.length)return;const empty=queue.querySelector('.empty');if(empty)empty.remove();pending+=files.length;updateSummary();for(const entry of files)await upload(entry.file,entry.path)}
function upload(file,relativePath){return new Promise(resolve=>{const item=document.createElement('div');item.className='item';item.innerHTML='<div class="row"><span class="name"></span><span class="size"></span></div><div class="result">Waiting…</div><div class="bar"><div class="fill"></div></div>';item.querySelector('.name').textContent=relativePath;item.querySelector('.size').textContent=formatBytes(file.size);queue.prepend(item);const result=item.querySelector('.result'),fill=item.querySelector('.fill'),xhr=new XMLHttpRequest();xhr.open('PUT',base+'upload?path='+encodeURIComponent(relativePath));xhr.setRequestHeader('Content-Type','application/octet-stream');xhr.upload.onprogress=event=>{if(event.lengthComputable){fill.style.width=(event.loaded/event.total*100)+'%';result.textContent='Sending '+Math.round(event.loaded/event.total*100)+'%'}};xhr.onload=()=>{pending--;let reply={};try{reply=JSON.parse(xhr.responseText)}catch{}if(xhr.status===201&&reply.ok){completed++;totalBytes+=file.size;item.classList.add('ok');fill.style.width='100%';result.textContent='Receiver confirmed: saved as '+reply.savedPath}else{failed++;item.classList.add('error');fill.style.width='100%';result.textContent='Receiver error: '+(reply.error||('HTTP '+xhr.status))}updateSummary();resolve()};xhr.onerror=()=>{pending--;failed++;item.classList.add('error');result.textContent='Connection error: the receiving computer did not respond.';updateSummary();resolve()};xhr.send(file)})}
async function poll(){try{const response=await fetch(base+'status',{cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json();const indicator=document.querySelector('#connection');indicator.className='online';indicator.textContent='● Receiver connected';const events=document.querySelector('#events');events.innerHTML=data.events.length?data.events.map(event=>'<div>'+escapeHtml(new Date(event.time).toLocaleTimeString()+' — '+event.message+(event.path?' — '+event.path:event.error?' — '+event.error:''))+'</div>').join(''):'<div class="empty">Waiting for activity…</div>'}catch{const indicator=document.querySelector('#connection');indicator.className='offline';indicator.textContent='● Receiver disconnected'}setTimeout(poll,2000)}
function escapeHtml(value){const node=document.createElement('div');node.textContent=value;return node.innerHTML}updateSummary();poll();
</script></main></body></html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const base = `/${TOKEN}/`;

  if (req.method === 'GET' && url.pathname === base) return html(res, page());
  if (req.method === 'GET' && url.pathname === `${base}status`) {
    return json(res, 200, { ok: true, startedAt, ...state, events: state.events.slice(0, 20) });
  }

  if (req.method === 'PUT' && url.pathname === `${base}upload`) {
    let parsed;
    try { parsed = safeRelativePath(url.searchParams.get('path')); }
    catch (error) { state.failedFiles++; logEvent('error', 'Upload rejected', { error: error.message }); req.resume(); return json(res, 400, { ok: false, error: error.message }); }

    fs.mkdirSync(path.dirname(parsed.resolved), { recursive: true });
    const finalPath = availablePath(parsed.resolved);
    const tempPath = `${finalPath}.${crypto.randomBytes(5).toString('hex')}.part`;
    const output = fs.createWriteStream(tempPath, { flags: 'wx' });
    let bytes = 0;
    let settled = false;
    state.activeUploads++;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      state.activeUploads--;
      state.failedFiles++;
      output.destroy();
      fs.rm(tempPath, { force: true }, () => {});
      logEvent('error', 'Upload failed', { path: parsed.relative, error: error.message });
      if (!res.headersSent && !res.destroyed) json(res, 500, { ok: false, error: error.message });
    };

    req.on('data', (chunk) => { bytes += chunk.length; });
    req.on('aborted', () => fail(new Error('Sender disconnected before the file was complete.')));
    req.on('error', fail);
    output.on('error', fail);
    output.on('finish', () => {
      if (settled) return;
      fs.rename(tempPath, finalPath, (error) => {
        if (error) return fail(error);
        settled = true;
        state.activeUploads--;
        state.successfulFiles++;
        state.receivedBytes += bytes;
        const savedPath = path.relative(RECEIVE_DIR, finalPath);
        logEvent('success', `Received ${formatBytes(bytes)}`, { path: savedPath });
        json(res, 201, { ok: true, savedPath, bytes });
      });
    });
    req.pipe(output);
    return;
  }

  json(res, 404, { ok: false, error: 'Not found.' });
});

server.listen(PORT, HOST, () => {
  fs.writeFileSync(PID_FILE, String(process.pid));
  const addresses = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const network of entries || []) if (network.family === 'IPv4' && !network.internal) addresses.push(network.address);
  }
  console.log('\nLAN FILE TRANSFER IS RUNNING');
  console.log('On the other computer, open one of these addresses:\n');
  for (const address of addresses) console.log(`  http://${address}:${PORT}/${TOKEN}/`);
  console.log(`\nReceived files: ${RECEIVE_DIR}`);
  console.log(`Activity log:   ${LOG_FILE}`);
  console.log('\nKeep this window open. Press Ctrl+C to stop.\n');
  logEvent('info', 'Server started');
});

function shutdown() {
  logEvent('info', 'Server stopped');
  server.close(() => {
    try { fs.rmSync(PID_FILE, { force: true }); } catch {}
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 2000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
server.on('error', (error) => {
  console.error(`Server could not start: ${error.message}`);
  process.exitCode = 1;
});
