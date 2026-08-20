const form = document.getElementById("form");
const audio = document.getElementById("audio");
const status = document.getElementById("status");
const result = document.getElementById("result");
const fileName = document.getElementById("fileName");
const submitButton = document.getElementById("submit");

audio.onchange = () => {
  fileName.textContent =
    audio.files[0]?.name || "Choose a meeting recording";
};

form.onsubmit = async (e) => {
  e.preventDefault();

  if (!audio.files[0]) {
    status.textContent =
      "Please choose a meeting recording first.";
    return;
  }

  const fd = new FormData();
  fd.append("audio", audio.files[0]);

  submitButton.disabled = true;

  try {
    status.textContent =
      "Transcribing locally with Whisper…";

    const r = await fetch("/api/meetings", {
      method: "POST",
      body: fd
    });

    status.textContent =
      "Generating meeting summary with Gemini…";

    const d = await r.json();

    if (!r.ok) {
      throw new Error(
        d.message || "Something went wrong."
      );
    }

    status.textContent =
      "Finalizing meeting output…";

    render(d.meeting);

    status.textContent =
      "✓ Meeting processed successfully.";

    loadHistory();

  } catch (err) {
    console.error(err);

    status.textContent =
      `Error: ${err.message}`;

  } finally {
    submitButton.disabled = false;
  }
};

function render(m) {
  result.classList.remove("hidden");

  document.getElementById("meetingName").textContent =
    m.filename || "Meeting";

  document.getElementById("overview").textContent =
    m.summary?.overview ||
    "No overview available.";

  list(
    "topics",
    m.summary?.importantTopics,
    "No important topics were identified."
  );

  list(
    "decisions",
    m.summary?.keyDecisions,
    "No key decisions were identified."
  );

  list(
    "risks",
    m.summary?.risksOrBlockers,
    "No risks or blockers were identified."
  );

  renderActionItems(
    m.summary?.actionItems
  );

  document.getElementById("transcript").textContent =
    m.transcript ||
    "No transcript available.";

  window.current = m;

  result.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function renderActionItems(items = []) {
  const container =
    document.getElementById("actions");

  container.innerHTML = "";

  if (!items.length) {
    const empty =
      document.createElement("div");

    empty.className = "empty-state";

    empty.textContent =
      "No action items were identified.";

    container.appendChild(empty);

    return;
  }

  items.forEach((item) => {
    const card =
      document.createElement("div");

    card.className = "action";

    const task =
      document.createElement("strong");

    task.textContent =
      item.task || "Untitled task";

    const owner =
      document.createElement("span");

    owner.textContent =
      `Owner: ${
        item.owner || "Not specified"
      }`;

    const deadline =
      document.createElement("span");

    deadline.textContent =
      `Due: ${
        item.deadline || "Not specified"
      }`;

    const priority =
      document.createElement("span");

    priority.className =
      `pill ${
        String(
          item.priority || "Medium"
        ).toLowerCase()
      }`;

    priority.textContent =
      item.priority || "Medium";

    card.appendChild(task);
    card.appendChild(owner);
    card.appendChild(deadline);
    card.appendChild(priority);

    container.appendChild(card);
  });
}

function list(id, items = [], emptyMessage) {
  const element =
    document.getElementById(id);

  element.innerHTML = "";

  if (!items.length) {
    const li =
      document.createElement("li");

    li.className = "empty-state";

    li.textContent = emptyMessage;

    element.appendChild(li);

    return;
  }

  items.forEach((item) => {
    const li =
      document.createElement("li");

    li.textContent = item;

    element.appendChild(li);
  });
}

async function loadHistory() {
  try {
    const r =
      await fetch("/api/meetings");

    const d =
      await r.json();

    const box =
      document.getElementById(
        "historyList"
      );

    box.innerHTML = "";

    if (!d.meetings?.length) {
      box.textContent =
        "No previous meetings yet.";

      return;
    }

    d.meetings.forEach((meeting) => {
      const item =
        document.createElement("div");

      item.className =
        "history-item";

      const date =
        new Date(
          meeting.createdAt
        ).toLocaleString();

      item.innerHTML = `
        <strong>
          ${esc(meeting.filename)}
        </strong>
        <span>
          ${esc(date)}
        </span>
      `;

      item.onclick = () =>
        render(meeting);

      box.appendChild(item);
    });

  } catch (err) {
    console.error(
      "Could not load meeting history:",
      err
    );
  }
}

document.getElementById(
  "copyBtn"
).onclick = async () => {

  const meeting =
    window.current;

  if (!meeting) return;

  const summary =
    meeting.summary || {};

  const topics =
    (summary.importantTopics || [])
      .map(
        (item) => `- ${item}`
      )
      .join("\n");

  const decisions =
    (summary.keyDecisions || [])
      .map(
        (item) => `- ${item}`
      )
      .join("\n");

  const actions =
    (summary.actionItems || [])
      .map(
        (item) =>
          `- ${item.task} | Owner: ${item.owner} | Due: ${item.deadline} | Priority: ${item.priority}`
      )
      .join("\n");

  const risks =
    (summary.risksOrBlockers || [])
      .map(
        (item) => `- ${item}`
      )
      .join("\n");

  const text = `
MEETING SUMMARY

${summary.overview || ""}

IMPORTANT TOPICS
${topics || "None identified."}

KEY DECISIONS
${decisions || "None identified."}

ACTION ITEMS
${actions || "None identified."}

RISKS & BLOCKERS
${risks || "None identified."}

TRANSCRIPT
${meeting.transcript || ""}
`.trim();

  try {
    await navigator.clipboard.writeText(
      text
    );

    const button =
      document.getElementById(
        "copyBtn"
      );

    const originalText =
      button.textContent;

    button.textContent =
      "Copied ✓";

    setTimeout(() => {
      button.textContent =
        originalText;
    }, 1500);

  } catch (err) {
    console.error(
      "Copy failed:",
      err
    );
  }
};

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]
  );
}

loadHistory();