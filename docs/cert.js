// Certificates of completion: after a test scored 60% or more (and saved), the server records the certificate in the
// teacher's Google Sheet and returns its ID. The certificate is drawn as an image with a public link (cert.html?id=…)
// that anyone can verify against the Sheet, and that students can share on LinkedIn, Facebook, X or WhatsApp.
(function () {
  "use strict";
  const COURSE = "AI Concepts", PASS = 0.6;
  // The instructor who signs every certificate. signature.png (transparent background) sits next to this file.
  const SIGNER = { name: "Ar. Mohammad Ali Jaffry", title: "Course Instructor", image: "signature.png" };
  const SIG = new Image();
  const sigReady = new Promise((done) => { SIG.onload = () => done(true); SIG.onerror = () => done(false); });
  SIG.src = SIGNER.image;
  let sigOk = null; sigReady.then((ok) => { sigOk = ok; });
  const SITE = "https://mjaffry01.github.io/ai-word-bank/";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  // Legacy check code for the first version's links (cert.html?c=…), which were not recorded in the Sheet
  function code(c) {
    let h = 0x811c9dc5; const s = ["aic1", c.n, c.t, c.s, c.o, c.d].join("|");
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    const x = h.toString(36).toUpperCase().padStart(7, "0");
    return "AIC-" + x.slice(0, 4) + "-" + x.slice(4);
  }
  const unb64 = (s) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))));
  const link = (id) => SITE + "cert.html?id=" + encodeURIComponent(id);
  const pct = (c) => Math.round((c.s / c.o) * 100);
  const longDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  // Draw the certificate on a canvas (1600 × 1131, A4 landscape proportions). c = { n: name, t: test, s: score, o: out of, d: date, id }
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
    x.save(); x.translate(W / 2, 925); x.fillStyle = gold; x.beginPath();
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = i % 2 ? 66 : 78; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    x.closePath(); x.fill(); x.fillStyle = "#fbf8f1"; x.beginPath(); x.arc(0, 0, 54, 0, 7); x.fill();
    x.fillStyle = gold; x.font = "700 30px Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("AI", 0, -10); x.font = "700 16px Georgia, serif"; x.fillText("CONCEPTS", 0, 18); x.restore();
    const rule = (cx) => { x.strokeStyle = muted; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - 200, 912); x.lineTo(cx + 200, 912); x.stroke(); };
    const small = (t, cx, y, font, col) => { x.textAlign = "center"; x.textBaseline = "alphabetic"; x.font = font; x.fillStyle = col; x.fillText(t, cx, y, 400); };
    // Left: the instructor's signature above the line, then the printed name and title
    if (sigOk && SIG.naturalWidth) { const sc = Math.min(360 / SIG.naturalWidth, 120 / SIG.naturalHeight), w = SIG.naturalWidth * sc, h = SIG.naturalHeight * sc; x.drawImage(SIG, 360 - w / 2, 906 - h, w, h); }
    rule(360); small(SIGNER.name, 360, 950, "600 28px 'Segoe UI', system-ui, sans-serif", ink); small(SIGNER.title, 360, 984, "500 22px 'Segoe UI', system-ui, sans-serif", muted);
    // Right: the date, and the certificate ID underneath
    small(longDate(c.d), W - 360, 898, "600 32px 'Segoe UI', system-ui, sans-serif", ink); rule(W - 360); small("Date", W - 360, 948, "500 24px 'Segoe UI', system-ui, sans-serif", muted);
    small("Certificate ID: " + (c.id || code(c)), W - 360, 984, "600 22px 'Segoe UI', system-ui, sans-serif", ink);
    T(c.id ? "Verify at mjaffry01.github.io/ai-word-bank/cert.html?id=" + c.id : "mjaffry01.github.io/ai-word-bank", 1050, "400 22px 'Segoe UI', system-ui, sans-serif", muted);
    return canvas;
  }

  const shareText = (c) => `I earned a certificate of completion for "${c.t}" from ${COURSE}, scoring ${c.s}/${c.o} (${pct(c)}%).`;
  function shareLinks(c) {
    const u = link(c.id), d = new Date(c.d + "T12:00:00"), e = encodeURIComponent;
    return {
      linkedinAdd: `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${e(c.t)}&organizationName=${e(COURSE)}&issueYear=${d.getFullYear()}&issueMonth=${d.getMonth() + 1}&certUrl=${e(u)}&certId=${e(c.id)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${e(u)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${e(u)}`,
      x: `https://twitter.com/intent/tweet?text=${e(shareText(c))}&url=${e(u)}`,
      whatsapp: `https://wa.me/?text=${e(shareText(c) + " " + u)}`,
      url: u,
    };
  }

  // One certificate per result: issued certificates are remembered so re-showing the result never issues another
  const issued = store.get("wb-certs", {}), pending = new Map(), errors = new Map(), tests = new Map(), images = new Map();
  const keyOf = (t) => [t.title, t.score, t.total, new Date().toISOString().slice(0, 10)].join("|");

  function issue(key) {
    const t = tests.get(key);
    if (pending.has(key) || !window.WB || !window.WB.call) return;
    errors.delete(key);
    pending.set(key, window.WB.call("issueCertificate", { cert: { title: t.title, score: t.score, total: t.total, match: t.match } })
      .then((r) => { issued[key] = { id: r.id, name: r.name || "Student", date: r.issued }; store.set("wb-certs", issued); },
            (err) => { errors.set(key, (err && err.error) || "failed"); })
      .then(() => { pending.delete(key); refresh(key); }));
  }
  function refresh(key) {
    document.querySelectorAll(".certbox[data-certkey]").forEach((el) => { if (el.dataset.certkey === key) el.outerHTML = block(tests.get(key)); });
  }

  const ERRORS = {
    not_approved: "Your teacher hasn't approved your account yet, so a certificate can't be issued.",
    no_matching_result: "This result wasn't found in your teacher's records yet. Wait a moment and try again.",
    below_pass_mark: "This score is below the 60% needed for a certificate.",
    signed_out: "Your sign-in has ended. Sign in again, then retake the test to get your certificate.",
  };

  // HTML for a quiz result screen. test = { title, score, total, saved: QZ.save, match: what the server should look for }
  function block(test) {
    const ratio = test.total ? test.score / test.total : 0;
    if (ratio < PASS) {
      const need = Math.ceil(PASS * test.total) - test.score;
      return `<div class="certbox certmiss"><b>Certificate of completion</b><p>Score ${Math.round(PASS * 100)}% or more to earn a certificate you can download and share. You need ${need} more correct ${need === 1 ? "answer" : "answers"} on this test.</p></div>`;
    }
    const key = keyOf(test); tests.set(key, test);
    const wait = (msg, retry) => `<div class="certbox certmiss" data-certkey="${esc(key)}"><b>Certificate of completion</b><p>${msg}</p>${retry ? `<button type="button" class="btn sm" data-cert-retry>Try again</button>` : ""}</div>`;
    const got = issued[key];
    if (!got) {
      if (test.saved === "failed") return wait("Your result couldn't be saved, so a certificate can't be issued. Check your connection and take the test again.");
      if (test.saved !== "saved") return wait("Saving your result… your certificate will appear here in a moment.");
      if (errors.has(key)) return wait(ERRORS[errors.get(key)] || "The certificate couldn't be issued just now.", errors.get(key) !== "below_pass_mark" && errors.get(key) !== "not_approved");
      issue(key);
      return wait("Issuing your certificate and recording it with your teacher…");
    }
    const c = { n: got.name, t: test.title, s: test.score, o: test.total, d: got.date, id: got.id };
    if (sigOk === null) { sigReady.then(() => refresh(key)); return wait("Preparing your certificate…"); }
    if (!images.has(got.id)) images.set(got.id, draw(c, document.createElement("canvas")).toDataURL("image/png"));
    const L = shareLinks(c), canFiles = !!(navigator.canShare && window.File);
    const a = (href, label, cls) => `<a class="btn sm ${cls}" href="${esc(href)}" target="_blank" rel="noopener">${label}</a>`;
    return `<div class="certbox" data-certkey="${esc(key)}" data-cert="${esc(JSON.stringify(c))}">
      <p class="kicker">You earned a certificate · ID ${esc(got.id)}</p>
      <img class="certimg" src="${images.get(got.id)}" alt="Certificate of completion for ${esc(c.n)}: ${esc(c.t)}, ${c.s} out of ${c.o}">
      <div class="certbtns">
        <button type="button" class="btn sm primary" data-cert-dl>Download certificate</button>
        ${canFiles ? `<button type="button" class="btn sm" data-cert-share>Share image…</button>` : ""}
        <button type="button" class="btn sm" data-cert-copy>Copy link</button>
        <a class="btn sm" href="${esc(L.url)}" target="_blank" rel="noopener">Open certificate page</a>
      </div>
      <p class="certlbl">Share it</p>
      <div class="certbtns">
        ${a(L.linkedinAdd, "Add to LinkedIn profile", "li")}${a(L.linkedin, "Post on LinkedIn", "li")}${a(L.facebook, "Facebook", "fb")}${a(L.x, "X", "xx")}${a(L.whatsapp, "WhatsApp", "wa")}
      </div>
      <p class="certnote">Your certificate is recorded with your teacher, and anyone who opens the link can check it's genuine. Sharing posts the link; to post the picture itself, download it first (or use "Share image…" on a phone) and attach it. The name comes from your Google account.</p>
    </div>`;
  }

  document.addEventListener("click", async (e) => {
    const r = e.target.closest("[data-cert-retry]");
    if (r) { const k = r.closest("[data-certkey]").dataset.certkey; errors.delete(k); issue(k); refresh(k); return; }
    const box = e.target.closest("[data-cert]"); if (!box) return;
    const c = JSON.parse(box.dataset.cert), img = images.get(c.id), file = `AI-Concepts-certificate-${c.id}.png`;
    if (e.target.closest("[data-cert-dl]")) { const a = document.createElement("a"); a.href = img; a.download = file; document.body.appendChild(a); a.click(); a.remove(); }
    else if (e.target.closest("[data-cert-copy]")) { const b = e.target.closest("[data-cert-copy]"); try { await navigator.clipboard.writeText(link(c.id)); b.textContent = "Link copied ✓"; } catch (err) { prompt("Copy your certificate link:", link(c.id)); } }
    else if (e.target.closest("[data-cert-share]")) {
      try { const blob = await (await fetch(img)).blob(), f = new File([blob], file, { type: "image/png" }); const data = { files: [f], title: "My certificate", text: shareText(c) + " " + link(c.id) }; if (navigator.canShare(data)) await navigator.share(data); else await navigator.share({ title: "My certificate", text: shareText(c), url: link(c.id) }); } catch (err) { /* cancelled */ }
    }
  });

  window.WB_CERT = { block, draw, code, unb64, link, shareLinks, longDate, pct, PASS, sigReady, SIGNER };
})();
