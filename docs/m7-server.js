// Module 7, two tabs about MCP servers in more technical depth:
// "Inside a server": who builds a server (three cases), the life of a server message by message,
// a real Python server with clickable line notes, and how an AI app is told to connect to it.
// "Questions & answers": the doubts students usually have, as teacher–student conversations with a search box.
// Module 7 calls WB_M7SRV.server() and WB_M7SRV.qa() for the tabs and WB_M7SRV.mount(root) after rendering.
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const json = (o) => JSON.stringify(o, null, 2);

  /* ---------- Who has the server? ---------- */
  const CASES = [
    { q: "I want Claude to use my school's library app", who: "You build an MCP server for the library app", how: "Write a small server with tools like <code>search_books(query)</code> that calls your library app's existing API. Students then add your server to Claude. Your library app itself doesn't change.", parts: [["Claude", "host + client", "a"], ["Your MCP server", "you build this", "s"], ["Library app", "unchanged", "x"]] },
    { q: "I want my website's chatbot to use Claude", who: "No MCP server needed", how: "Your website calls Claude's API directly: it sends the conversation and gets a reply. That's what you built in Module 4's My first chatbot. MCP is only for giving an AI <i>extra tools</i>.", parts: [["Your website", "calls the API", "a"], ["Claude API", "the model", "x"]] },
    { q: "My app uses Claude and should check the weather too", who: "Your app is the host; it connects to someone's weather server", how: "Your app calls Claude's API and also acts as an MCP host: it connects to an existing weather MCP server and offers its tools to Claude. You build the host side, not a server.", parts: [["Your app", "host + client", "a"], ["Weather MCP server", "someone else's", "s"], ["Claude API", "the model", "x"]] },
    { q: "I want Claude to read my GitHub issues", who: "Use GitHub's own MCP server", how: "Many services already publish an official MCP server: GitHub, Slack, Google Drive and more. You just add it to Claude, usually by signing in. Nobody needs to build anything.", parts: [["Claude", "host + client", "a"], ["GitHub's MCP server", "already exists", "s"], ["GitHub", "unchanged", "x"]] },
  ];
  let caseI = 0;
  function caseHTML() {
    const C = CASES[caseI];
    return `<div class="chips4" style="margin:0 0 10px">${CASES.map((c, i) => `<button class="choice" data-m7case="${i}" aria-pressed="${i === caseI}">${esc(c.q)}</button>`).join("")}</div>
      <div class="m7case"><p class="lbl good">${C.who}</p><div class="m7chain">${C.parts.map(([n, r, k]) => `<div class="${k}"><b>${n}</b><small>${r}</small></div>`).join('<span aria-hidden="true">⟷</span>')}</div><p style="margin:10px 0 0">${C.how}</p></div>`;
  }

  /* ---------- The life of a server ---------- */
  const LIFE = [
    ["Start", "The app starts the server. For a local server, the app runs it as a program on your computer (stdio). For a remote one, the server is already running on the internet and the app opens a connection (Streamable HTTP).", null],
    ["Handshake", "The client says hello: which MCP version it speaks and what it supports.", { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "Claude Desktop", version: "1.0" } } }],
    ["Capabilities", "The server answers with its name and its capabilities: here, “I offer tools, and I'll tell you if my list changes”.", { jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-06-18", capabilities: { tools: { listChanged: true } }, serverInfo: { name: "weather", version: "1.0" } } }],
    ["Ready", "The client confirms. This is a notification: it has no id because no reply is expected.", { jsonrpc: "2.0", method: "notifications/initialized" }],
    ["Menu", "The client asks for the tools. The server describes each one with a name, a description and a JSON Schema of its inputs.", { jsonrpc: "2.0", id: 2, method: "tools/list" }],
    ["Menu sent", "This list is what the model reads to decide which tool fits.", { jsonrpc: "2.0", id: 2, result: { tools: [{ name: "get_forecast", description: "Get the weather forecast for a city for the next 3 days.", inputSchema: { type: "object", properties: { city: { type: "string" } }, required: ["city"] } }] } }],
    ["Call", "Later, when the model asks for the tool and the user allows it, the client sends a call.", { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_forecast", arguments: { city: "Paris" } } }],
    ["Result", "The server runs its own code (maybe calling a real weather API) and returns content. If something goes wrong it sets isError: true so the model can explain.", { jsonrpc: "2.0", id: 3, result: { content: [{ type: "text", text: "Paris: 14°C, light rain" }], isError: false } }],
    ["Update", "If the server's tools change, it can tell the client without being asked. The client then asks for the list again.", { jsonrpc: "2.0", method: "notifications/tools/list_changed" }],
    ["Stop", "When the app closes, a local server's input is closed and the program ends. A remote session simply ends or times out.", null],
  ];
  let lifeI = 0;
  function lifeHTML() {
    const [t, say, msg] = LIFE[lifeI];
    return `<ol class="botsteps">${LIFE.map(([n], i) => `<li><button data-m7life="${i}" aria-current="${i === lifeI ? "step" : "false"}" class="${i < lifeI ? "done" : ""}"><span>${i + 1}</span>${n}</button></li>`).join("")}</ol>
      <div class="qkpanel"><p style="margin-top:0"><b>${t}.</b> ${say}</p>${msg ? `<pre class="pbox m7json">${esc(json(msg))}</pre>` : ""}</div>
      <div class="btnrow">${lifeI ? `<button class="btn sm" data-m7lifenav="-1">← Back</button>` : ""}${lifeI < LIFE.length - 1 ? `<button class="btn primary sm" data-m7lifenav="1">Next →</button>` : ""}</div>`;
  }

  /* ---------- A real server, line by line ---------- */
  const CODE = [
    ["from mcp.server.fastmcp import FastMCP", "Uses the official MCP library for Python. It handles all the JSON-RPC messages, the handshake and the transports, so you only write the useful part."],
    ["", null],
    ["mcp = FastMCP(\"weather\")", "Creates the server and gives it a name. The name is sent in the handshake as serverInfo."],
    ["", null],
    ["@mcp.tool()", "This line turns the function below into an MCP tool. Without it, the function is ordinary Python that no AI can see."],
    ["def get_forecast(city: str) -> str:", "The function name becomes the tool's name. The input city: str becomes the JSON Schema: one required input called city, of type string."],
    ["    \"\"\"Get the weather forecast for a city for the next 3 days.\"\"\"", "The docstring becomes the tool's description. This is the sentence the model reads to decide whether to use the tool, so write it carefully."],
    ["    # real code would call a weather API here", "Here is where the server does the real work: call a weather service, read a database, open a file. The model never sees this code."],
    ["    return f\"{city}: 14°C, light rain\"", "Whatever you return goes back to the app as the tool's result, which the model then reads."],
    ["", null],
    ["if __name__ == \"__main__\":", "Only runs when the file is started as a program, which is what an AI app does."],
    ["    mcp.run()", "Starts listening. By default it uses stdio: messages arrive on the program's input and replies go to its output. A remote server would choose the HTTP transport here instead."],
  ];
  let lineI = 5;
  function codeHTML() {
    return `<div class="m7code" role="list">${CODE.map(([l, n], i) => n ? `<button role="listitem" class="m7line ${i === lineI ? "on" : ""}" data-m7line="${i}"><span class="ln">${i + 1}</span><code>${esc(l)}</code></button>` : `<div class="m7line blank"><span class="ln">${i + 1}</span></div>`).join("")}</div>
      <div class="qkpanel" aria-live="polite"><p style="margin:0"><b>Line ${lineI + 1}.</b> ${esc(CODE[lineI][1])}</p></div>`;
  }

  function server() {
    return `<section class="m2sec">
    <header><p class="kicker">Deep dive · 20 minutes</p><h2>Inside an MCP server</h2>
      <p>An MCP server is <b>an ordinary program</b> that publishes a menu of tools, data and prompts in a standard format, and runs them when an AI app asks. There is <b>no AI inside it</b>. Most servers are a thin layer in front of something that already exists: an API, a database, a folder of files.</p></header>
    <div class="card2"><p class="kicker">1 · Who has the server?</p><h3>Pick a situation</h3>
      <p class="crit" style="margin:0 0 10px">The rule: whoever <b>has the tools or data</b> provides the server. Whoever <b>has the AI chat</b> is the host.</p>
      <div id="m7case">${caseHTML()}</div></div>
    <div class="card2 dzsec"><p class="kicker">2 · The life of a server</p><h3>From start-up to shut-down, message by message</h3>
      <p class="crit" style="margin:0 0 10px">These are the real message names from the MCP specification. Every request has an <code>id</code>; its reply has the same <code>id</code>.</p>
      <div id="m7life">${lifeHTML()}</div></div>
    <div class="card2 dzsec"><p class="kicker">3 · A real server</p><h3>A whole weather server in 12 lines of Python</h3>
      <p class="crit" style="margin:0 0 10px">Click any line to see what it does. You don't need to run this: the point is how little a server is.</p>
      <div id="m7code">${codeHTML()}</div>
      <p class="crit" style="margin:10px 0 0">There are official MCP libraries for Python, TypeScript, Java, C# and other languages. Each does the same job: you write normal functions, the library speaks MCP.</p></div>
    <div class="card2 dzsec"><p class="kicker">4 · Connecting it</p><h3>How an AI app finds your server</h3>
      <div class="hrfair"><div><p class="lbl">Local server (stdio)</p><p style="margin:0 0 8px">You tell the app <b>how to start</b> the program. In Claude Desktop that's a settings file:</p>
          <pre class="pbox m7json">${esc(json({ mcpServers: { weather: { command: "python", args: ["weather.py"] } } }))}</pre>
          <p class="crit" style="margin:6px 0 0">When the app opens, it runs <code>python weather.py</code> and starts the handshake. The server runs with <i>your</i> permissions on <i>your</i> computer.</p></div>
        <div><p class="lbl">Remote server (Streamable HTTP)</p><p style="margin:0 0 8px">You give the app <b>a web address</b>, for example as a custom connector:</p>
          <pre class="pbox m7json">https://mcp.example.com/mcp</pre>
          <p class="crit" style="margin:6px 0 0">The app sends its messages there. Usually you sign in first (with OAuth, the “Sign in with…” system), so the server knows whose data it may use.</p></div></div>
      <p class="crit" style="margin:10px 0 0">Menus and file names differ between apps and change over time. Check the app's own help page for the exact steps.</p></div>
    <div class="card2 dzsec"><p class="kicker">5 · What a good server adds</p><h3>The parts that make it safe and reliable</h3>
      <div class="pipeline"><div><span class="n">1</span><b>Check inputs</b><small>Is the city a real word? Is the number sensible?</small></div><div><span class="n">2</span><b>Check who's asking</b><small>Remote servers verify the user's sign-in for every call</small></div><div><span class="n">3</span><b>Least access</b><small>Only the folders, records and actions it needs</small></div><div><span class="n">4</span><b>Clear errors</b><small>Return isError with a message a model can explain</small></div><div><span class="n">5</span><b>Limits and logs</b><small>Timeouts, rate limits, and a record of what ran</small></div></div>
      <div class="btnrow"><button class="btn primary" data-tab="qa">Next: questions students ask →</button></div></div>
  </section>`;
  }

  /* ---------- Questions & answers ---------- */
  // [group, student question, teacher answer (HTML), optional tab to try]
  const QA = [
    ["The basics", "Is an MCP server an AI?", "No. It's a normal program with no model inside. The AI is in the app (the host). The server just offers a menu of tools and runs them when asked, like a waiter who brings what the customer orders but doesn't decide what to eat.", null],
    ["The basics", "Is an MCP server the same as a web server?", "Not quite. “Server” here means “the side that serves things”. A local MCP server isn't on the internet at all: the AI app starts it as a program on your own computer and talks to it privately. Only remote MCP servers run on the web.", null],
    ["The basics", "My app already has an API. Why does it need an MCP server too?", "Your API speaks your own language: your web addresses, your formats. Each AI app would need custom code to use it. An MCP server wraps your API in the standard MCP format once, and then every MCP app can use it straight away. It's a translator, not a replacement.", "nm"],
    ["The basics", "Is MCP the same as function calling or tool use?", "They work together. Tool use is the model's skill of asking for a tool. MCP is the standard plug that lets an app find tools from any server and call them. Tool use is the request; MCP is how the request reaches the right program.", "learn"],
    ["Who builds what", "Do I need an MCP server to use Claude?", "No. You use Claude normally with no server at all. You only add MCP servers when you want Claude to reach extra tools or data, such as your files, your calendar or GitHub.", "server"],
    ["Who builds what", "Does Claude have its own MCP server?", "Claude apps are on the other side: they're MCP <b>hosts</b> with a client inside. They connect <i>to</i> servers. The service that has the data or tools provides the server.", "server"],
    ["Who builds what", "Who builds the server: me, Anthropic or the company?", "Whoever owns the tool or data. Big services often publish an official server you just add (GitHub, Slack, Google Drive and many more). For your own app, you or your developers build it. Anyone can build one: MCP is an open standard.", null],
    ["Who builds what", "If I build one server, does it work in ChatGPT and Claude?", "That's the whole point of a standard. Any app that supports MCP can use it. In practice, check that the app supports the transport you chose (local or remote) and the features you use.", "nm"],
    ["How it works", "Does the model run the server's code?", "Never. The model only <i>asks</i> for a tool by name, with inputs. The app checks with you, the client sends the request, and the server runs its own code on its own machine. The model only sees the result.", "sim"],
    ["How it works", "Does the server see my whole conversation?", "Normally no. It receives only what each request contains: the tool name and its inputs, like <code>{\"city\": \"Paris\"}</code>. But those inputs can include things you said, so only connect servers you trust.", "sim"],
    ["How it works", "Can Claude use many servers at once?", "Yes. The host keeps one client per server, so you might have files, calendar and GitHub connected together. But every tool's description is sent to the model, which uses up tokens and can confuse it. Connect what you need, not everything.", null],
    ["How it works", "How does the model know which tool to use?", "Only from the tool list the server sent: each tool's name, description and inputs. That's why vague descriptions like “Gets data” make it guess wrong.", "desc"],
    ["How it works", "Where does a server run? Do I need to rent a computer?", "A local server runs on your own computer, started by the AI app, so you rent nothing. A remote server runs on a hosting service, like a website, so other people can use it. Start local while learning.", "server"],
    ["How it works", "What happens when a tool fails?", "The server returns its result with <code>isError: true</code> and a message, such as “City not found”. The model reads it and can explain or try again, instead of the whole chat crashing.", "server"],
    ["How it works", "Can a server ask the AI or me something?", "Yes, with permission. <b>Sampling</b> lets a server ask the host's model to write something. <b>Elicitation</b> lets it ask you for a missing detail, like “Which account?”. The host stays in control and shows you these requests.", null],
    ["Safety and cost", "Can an MCP server harm my computer?", "A local server runs with your permissions, so a bad one could read or change your files. Treat it like installing any program: only from people you trust, and give it the smallest access it needs, such as one folder.", "safe"],
    ["Safety and cost", "How does a remote server know who I am?", "You sign in, usually through OAuth: the “Sign in with…” screen. The app then sends a token with each request, and the server checks it before touching your data. The model never sees your password.", null],
    ["Safety and cost", "Can a server trick the AI?", "It can try. Tool descriptions and results are text the model reads, so a bad server could hide instructions in them. That's prompt injection. Good hosts ask before actions and treat tool results as information, not orders.", "safe"],
    ["Safety and cost", "Does MCP cost money?", "The standard is free and open. Costs come from elsewhere: hosting a remote server, the service it calls, and the AI's tokens. Every connected tool's description is sent to the model, so many tools add to every request.", null],
  ];
  let filter = "", openQ = {};
  function qaList() {
    const f = filter.trim().toLowerCase(), groups = [...new Set(QA.map((x) => x[0]))];
    const hit = (x) => !f || (x[1] + " " + x[2]).toLowerCase().includes(f);
    const shown = QA.filter(hit).length;
    if (!shown) return `<p class="crit">No questions match “${esc(filter)}”. Try a shorter word, or right-click any word on the page and ask an AI.</p>`;
    return groups.map((g) => {
      const items = QA.map((x, i) => [x, i]).filter(([x]) => x[0] === g && hit(x));
      if (!items.length) return "";
      return `<p class="lbl" style="margin:16px 0 6px">${g}</p>${items.map(([[, q, a, tryTab], i]) => `<details class="m7qa" data-m7qa="${i}" ${openQ[i] || f ? "open" : ""}><summary>${esc(q)}</summary>
        <div class="pgtalk"><p class="s"><b>Student</b>${esc(q)}</p><p class="t"><b>Teacher</b>${a}</p></div>
        ${tryTab ? `<button class="wordlink" data-tab="${tryTab}" style="margin-top:6px">See it in action →</button>` : ""}</details>`).join("")}`;
    }).join("");
  }
  function qa() {
    return `<section class="m2sec">
    <header><p class="kicker">Questions & answers · read any order</p><h2>Doubts students have about MCP servers</h2>
      <p>The questions that come up in almost every class, answered by a teacher. Search, or open the ones you're wondering about.</p></header>
    <div class="card2"><div class="field" style="margin:0"><label for="m7qaq">Search the questions</label><input id="m7qaq" data-m7qaq type="search" value="${esc(filter)}" placeholder="e.g. cost, Claude, safe, API"></div>
      <div class="btnrow" style="margin:8px 0 0"><button class="btn sm" data-m7qaall="1">Open all</button><button class="btn sm" data-m7qaall="0">Close all</button></div>
      <div id="m7qalist">${qaList()}</div>
      <p class="crit" style="margin-top:14px">Still unsure? Right-click any word or sentence on this page to ask an AI about it, or ask your teacher.</p></div>
  </section>`;
  }

  let root = null;
  function mount(el) {
    if (root === el) return; root = el;
    const put = (id, h) => { const x = el.querySelector("#" + id); if (x) x.innerHTML = h; };
    el.addEventListener("click", (e) => {
      const t = e.target;
      const c = t.closest("[data-m7case]"); if (c) { caseI = +c.dataset.m7case; put("m7case", caseHTML()); return; }
      const l = t.closest("[data-m7life]"); if (l) { lifeI = +l.dataset.m7life; put("m7life", lifeHTML()); return; }
      const ln = t.closest("[data-m7lifenav]"); if (ln) { lifeI = Math.max(0, Math.min(LIFE.length - 1, lifeI + +ln.dataset.m7lifenav)); put("m7life", lifeHTML()); return; }
      const cl = t.closest("[data-m7line]"); if (cl) { lineI = +cl.dataset.m7line; put("m7code", codeHTML()); return; }
      const all = t.closest("[data-m7qaall]"); if (all) { const open = all.dataset.m7qaall === "1"; QA.forEach((x, i) => (openQ[i] = open)); filter = ""; const s = el.querySelector("#m7qaq"); if (s) s.value = ""; put("m7qalist", qaList()); }
    });
    el.addEventListener("toggle", (e) => { const d = e.target; if (d.matches && d.matches("[data-m7qa]")) openQ[+d.dataset.m7qa] = d.open; }, true);
    el.addEventListener("input", (e) => { if (e.target.matches("[data-m7qaq]")) { filter = e.target.value; put("m7qalist", qaList()); } });
  }

  window.WB_M7SRV = { server, qa, mount };
})();
