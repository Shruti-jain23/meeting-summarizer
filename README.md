# Meeting Summarizer

AI meeting assistant: audio → local Whisper transcription → Gemini free-tier LLM → action-oriented meeting record.

## Why this architecture?

- **ASR:** `faster-whisper` runs locally on the user's machine. No ASR API key or cloud billing is required.
- **LLM:** Gemini API Free tier is used for structured summarization.
- **Backend:** Node.js + Express.
- **Frontend:** Vanilla HTML/CSS/JS.
- **Storage:** JSON for this assignment/demo.

Google's Gemini API has a Free tier with free input/output tokens for supported models. Paid billing is optional for higher limits.

## Requirements

- Node.js 20+
- Python 3.10+
- A Gemini API key from Google AI Studio
- No credit/debit card is required for the Free tier in the normal free-tier setup.

## Setup — Windows PowerShell

### 1. Install Node dependencies

```powershell
npm install
```

### 2. Create Python virtual environment

```powershell
python -m venv whisper\venv
Set-ExecutionPolicy -Scope Process Bypass
.\whisper\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Gemini

Copy `.env.example` to `.env` and put your Gemini API key in:

```env
GEMINI_API_KEY=your_key_here
```

Do NOT commit `.env`.

### 4. Run

Keep the Python virtual environment activated, then:

```powershell
npm start
```

Open http://localhost:3000

### First transcription

The first run of Whisper downloads the selected `base` model. Later runs reuse the local model.

## Pipeline

```text
Meeting Audio
     ↓
Multer Upload
     ↓
faster-whisper (local ASR)
     ↓
Transcript
     ↓
Gemini 2.5 Flash-Lite
     ↓
Structured JSON
     ↓
Overview / Decisions / Actions / Risks
```

## Evaluation talking points

**Transcription accuracy:** local faster-whisper with VAD and beam search.

**Summary quality:** the prompt separates overview, decisions, action items and risks.

**Prompt effectiveness:** JSON schema + "Never invent facts" + explicit handling of missing owner/deadline.

**Code structure:** upload/API orchestration lives in `server.js`; ASR is isolated in `transcribe.py`; UI is isolated in `public/`.

## Limitations / production improvements

Use a database instead of JSON, add authentication, object storage, background jobs, speaker diarization, rate limiting, logging and a production deployment.

## Demo

Upload a 1–3 minute meeting recording. Show transcript → decisions → action items → risks → refresh and show saved meeting history.
