// Certificates of completion: drawn as an image after each test (60% or more), with a public link (cert.html)
// that students can share on LinkedIn, Facebook, X or WhatsApp. Used by the quiz result screens and by cert.html.
(function () {
  "use strict";
  const COURSE = "AI Concepts", PASS = 0.6;
  const SITE = "https://mjaffry01.github.io/ai-word-bank/";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Short check code from the certificate details, so an edited link shows as altered (a casual check, not a secure credential)
  function code(c) {
    let h = 0x811c9dc5; const s = ["aic1", c.n, c.t, c.s, c.o, c.d].join("|");
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    const x = h.toString(36).toUpperCase().padStart(7, "0");
    return "AIC-" + x.slice(0, 4) + "-" + x.slice(4);
  }
  const b64 = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64 = (s) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))));
  const link = (c) => SITE + "cert.html?c=" + b64(Object.assign({}, c, { i: code(c) }));
  const pct = (c) => Math.round((c.s / c.o) * 100);
  const longDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  function studentName() {
    try { const s = JSON.parse(localStorage.getItem("wb-session") || "null"); if (s && (s.name || s.email)) return s.name || s.email; } catch (e) {}
    return "Student";
  }

  // Draw the certificate on a canvas (1600 × 1131, A4 landscape proportions)
  function draw(c, canvas) {
    const W = 1600, H = 1131, x = canvas.getContext("2d");
    canvas.width = W; canvas.height = H;
    const ink = "#1d2733", muted = "#5c6b7a", gold = "#b8860b", teal = "#0b6e69";
    x.fillStyle = "#fbf8f1"; x.fillRect(0, 0, W, H);
    x.strokeStyle = teal; x.lineWidth = 14; x.strokeRect(36, 36, W - 72, H - 72);
    x.strokeStyle = gold; x.lineWidth = 3; x.strokeRect(62, 62, W - 124, H - 124);
    const T = (t, y, font, col = ink, max = W - 260) => { x.font = font; x.fillStyle = col; x.textAlign = "center"; x.textBaseline = "alphabetic"; x.fillText(t, W / 2, y, max); };
    T(COURSE.toUpperCase(), 170, "700 34px Georgia, 'Times New Roman', serif", teal);
    T("Certificate of Completion", 280, "700 86px Georgia, 'Times New Roman', serif");
    x.strokeStyle = gold; x.lineWidth = 3; x.beginPath(); x.moveTo(W / 2 - 220, 318); x.lineTo(W / 2 + 220, 318); x.stroke();
    T("This certifies that", 410, "italic 36px Georgia, serif", muted);
    T(c.n, 520, "700 80px Georgia, 'Times New Roman', serif", ink, W - 320);
    T("has successfully completed", 610, "italic 36px Georgia, serif", muted);
    T(c.t, 700, "700 50px 'Segoe UI', system-ui, sans-serif", teal, W - 300);
    T(`with a score of ${c.s} / ${c.o} (${pct(c)}%)${pct(c) >= 90 ? " · with distinction" : ""}`, 780, "500 38px 'Segoe UI', system-ui, sans-serif", ink);
    // Seal
    x.save(); x.translate(W / 2, 925); x.fillStyle = gold; x.beginPath();
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = i % 2 ? 66 : 78; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    x.closePath(); x.fill(); x.fillStyle = "#fbf8f1"; x.beginPath(); x.arc(0, 0, 54, 0, 7); x.fill();
    x.fillStyle = gold; x.font = "700 30px Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("AI", 0, -10); x.font = "700 16px Georgia, serif"; x.fillText("CONCEPTS", 0, 18); x.restore();
    // Date and ID on either side of the seal
    const side = (label, value, cx) => { x.textAlign = "center"; x.textBaseline = "alphabetic"; x.strokeStyle = muted; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - 190, 912); x.lineTo(cx + 190, 912); x.stroke(); x.font = "600 32px 'Segoe UI', system-ui, sans-serif"; x.fillStyle = ink; x.fillText(value, cx, 898); x.font = "500 24px 'Segoe UI', system-ui, sans-serif"; x.fillStyle = muted; x.fillText(label, cx, 948); };
    side("Date", longDate(c.d), 360); side("Certificate ID", code(c), W - 360);
    T("Verify at mjaffry01.github.io/ai-word-bank/cert.html", 1050, "400 22px 'Segoe UI', system-ui, sans-serif", muted);
    return canvas;
  }

  const shareText = (c) => `I earned a certificate of completion for "${c.t}" from ${COURSE}, scoring ${c.s}/${c.o} (${pct(c)}%).`;
  function shareLinks(c) {
    const u = link(c), d = new Date(c.d + "T12:00:00"), e = encodeURIComponent;
    return {
      linkedinAdd: `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${e(c.t)}&organizationName=${e(COURSE)}&issueYear=${d.getFullYear()}&issueMonth=${d.getMonth() + 1}&certUrl=${e(u)}&certId=${e(code(c))}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${e(u)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${e(u)}`,
      x: `https://twitter.com/intent/tweet?text=${e(shareText(c))}&url=${e(u)}`,
      whatsapp: `https://wa.me/?text=${e(shareText(c) + " " + u)}`,
      url: u,
    };
  }

  const cache = new Map();
  // HTML for a quiz result screen. test = { title, score, total }
  function block(test) {
    const ratio = test.total ? test.score / test.total : 0;
    if (ratio < PASS) {
      const need = Math.ceil(PASS * test.total) - test.score;
      return `<div class="certbox certmiss"><b>Certificate of completion</b><p>Score ${Math.round(PASS * 100)}% or more to earn a certificate you can download and share. You need ${need} more correct ${need === 1 ? "answer" : "answers"} on this test.</p></div>`;
    }
    const c = { n: studentName(), t: test.title, s: test.score, o: test.total, d: new Date().toISOString().slice(0, 10) };
    const key = JSON.stringify(c);
    if (!cache.has(key)) cache.set(key, draw(c, document.createElement("canvas")).toDataURL("image/png"));
    const L = shareLinks(c), canFiles = !!(navigator.canShare && window.File);
    const a = (href, label, cls) => `<a class="btn sm ${cls}" href="${esc(href)}" target="_blank" rel="noopener">${label}</a>`;
    return `<div class="certbox" data-cert="${esc(key)}">
      <p class="kicker">You earned a certificate</p>
      <img class="certimg" src="${cache.get(key)}" alt="Certificate of completion for ${esc(c.n)}: ${esc(c.t)}, ${c.s} out of ${c.o}">
      <div class="certbtns">
        <button type="button" class="btn sm primary" data-cert-dl>Download certificate</button>
        ${canFiles ? `<button type="button" class="btn sm" data-cert-share>Share image…</button>` : ""}
        <button type="button" class="btn sm" data-cert-copy>Copy link</button>
      </div>
      <p class="certlbl">Share it</p>
      <div class="certbtns">
        ${a(L.linkedinAdd, "Add to LinkedIn profile", "li")}${a(L.linkedin, "Post on LinkedIn", "li")}${a(L.facebook, "Facebook", "fb")}${a(L.x, "X", "xx")}${a(L.whatsapp, "WhatsApp", "wa")}
      </div>
      <p class="certnote">Sharing posts a link to your certificate page. To post the picture itself, download it first (or use "Share image…" on a phone) and attach it to your post. The name comes from your Google account.</p>
    </div>`;
  }

  // Buttons on any result screen
  document.addEventListener("click", async (e) => {
    const box = e.target.closest("[data-cert]"); if (!box) return;
    const c = JSON.parse(box.dataset.cert), file = `AI-Concepts-certificate-${c.t.replace(/[^\w]+/g, "-")}.png`;
    if (e.target.closest("[data-cert-dl]")) { const a = document.createElement("a"); a.href = cache.get(box.dataset.cert); a.download = file; document.body.appendChild(a); a.click(); a.remove(); }
    else if (e.target.closest("[data-cert-copy]")) { const b = e.target.closest("[data-cert-copy]"); try { await navigator.clipboard.writeText(link(c)); b.textContent = "Link copied ✓"; } catch (err) { prompt("Copy your certificate link:", link(c)); } }
    else if (e.target.closest("[data-cert-share]")) {
      try { const blob = await (await fetch(cache.get(box.dataset.cert))).blob(), f = new File([blob], file, { type: "image/png" }); const data = { files: [f], title: "My certificate", text: shareText(c) + " " + link(c) }; if (navigator.canShare(data)) await navigator.share(data); else await navigator.share({ title: "My certificate", text: shareText(c), url: link(c) }); } catch (err) { /* cancelled */ }
    }
  });

  window.WB_CERT = { block, draw, code, link, unb64, shareLinks, longDate, pct, PASS };
})();
