import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { spawn } from "child_process";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (_, file, cb) =>
    cb(
      null,
      [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav",
        "audio/mp4",
        "audio/webm",
        "audio/ogg",
        "video/mp4"
      ].includes(file.mimetype)
    )
});

const ai = () =>
  new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_, res) =>
  res.json({
    success: true,
    service: "meeting-summarizer"
  })
);

function transcribe(audioPath) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, "transcribe.py");
    const python = process.env.PYTHON_CMD || "python";

    const child = spawn(
      python,
      [script, audioPath],
      {
        cwd: __dirname
      }
    );

    let out = "";
    let err = "";

    child.stdout.on("data", (data) => {
      out += data;
    });

    child.stderr.on("data", (data) => {
      err += data;
    });

    child.on("error", (error) => {
      reject(
        new Error(
          `Could not start Python/Whisper: ${error.message}`
        )
      );
    });

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(
            err || "Whisper transcription failed."
          )
        );
      }

      try {
        const result = JSON.parse(out);
        resolve(result.text);
      } catch {
        reject(
          new Error(
            "Whisper returned invalid output."
          )
        );
      }
    });
  });
}

async function summarize(transcript) {
  const prompt = `You are an expert meeting analyst.

Analyze the meeting transcript carefully.

IMPORTANT RULES:
1. Never invent facts.
2. Only extract information explicitly supported by the transcript.
3. If there are no explicit key decisions, return an empty array.
4. If there are no explicit action items, return an empty array.
5. Do not convert general descriptions of an existing system into action items.
6. If an owner or deadline is not stated, use "Not specified".
7. Identify the main technical or business topics discussed, even if the meeting is a walkthrough, presentation, demo, status update, lecture, or discussion.
8. Keep the output concise and useful.
9. Return ONLY valid JSON.

Return JSON with exactly this structure:

{
  "overview": "A concise 2-4 sentence summary of the meeting",
  "importantTopics": [
    "Main topic discussed"
  ],
  "keyDecisions": [
    "Explicit decision made during the meeting"
  ],
  "actionItems": [
    {
      "task": "Explicit task or follow-up",
      "owner": "Person/team or Not specified",
      "deadline": "Date/time or Not specified",
      "priority": "High|Medium|Low"
    }
  ],
  "risksOrBlockers": [
    "Explicit risk, blocker, limitation, or challenge"
  ]
}

Meeting transcript:

${transcript}`;

  const response = await ai().models.generateContent({
    model:
      process.env.GEMINI_MODEL ||
      "gemini-3.5-flash-lite",
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text);
}

function readMeetings() {
  const file = path.join(
    __dirname,
    "data",
    "meetings.json"
  );

  try {
    return JSON.parse(
      fs.readFileSync(file, "utf8")
    );
  } catch {
    return [];
  }
}

function saveMeeting(meeting) {
  const file = path.join(
    __dirname,
    "data",
    "meetings.json"
  );

  fs.mkdirSync(
    path.dirname(file),
    {
      recursive: true
    }
  );

  fs.writeFileSync(
    file,
    JSON.stringify(
      [...readMeetings(), meeting],
      null,
      2
    )
  );
}

app.post(
  "/api/meetings",
  upload.single("audio"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}

      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY is missing."
      });
    }

    try {
      const transcript = await transcribe(
        req.file.path
      );

      if (!transcript?.trim()) {
        throw new Error(
          "No speech was detected."
        );
      }

      const summary =
        await summarize(transcript);

      const meeting = {
        id: crypto.randomUUID(),
        filename: req.file.originalname,
        createdAt: new Date().toISOString(),
        transcript,
        summary
      };

      saveMeeting(meeting);

      res.json({
        success: true,
        meeting
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Processing failed."
      });
    } finally {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch {}
    }
  }
);

app.get("/api/meetings", (_, res) =>
  res.json({
    success: true,
    meetings: readMeetings().reverse()
  })
);

app.get("*splat", (_, res) =>
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  )
);

app.listen(PORT, () =>
  console.log(
    `Meeting Summarizer running at http://localhost:${PORT}`
  )
);