
# Meeting Summarizer

An AI-powered meeting assistant that converts meeting recordings into transcripts and structured, action-oriented summaries.

## Overview

Meeting Summarizer processes an uploaded meeting recording and generates:

- Meeting transcript
- Executive overview
- Key decisions
- Action items with owner, deadline, and priority
- Risks and blockers
- Meeting history

The application combines local speech-to-text processing with an LLM-based summarization pipeline.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Speech-to-Text:** Faster-Whisper
- **LLM:** Google Gemini
- **File Processing:** Multer
- **Storage:** JSON

## Architecture

```text
Meeting Recording
       |
       v
Node.js / Express
       |
       v
Multer Upload
       |
       v
Faster-Whisper
(Local Speech-to-Text)
       |
       v
Transcript
       |
       v
Google Gemini API
       |
       v
Structured JSON
       |
       v
Summary / Decisions / Action Items / Risks
```

## Key Features

- **Local speech-to-text:** Fast, local ASR using `faster-whisper` without third-party speech API dependencies.
- **LLM-powered summarization:** Generates structured executive summaries and key decision lists.
- **Action item extraction:** Captures tasks, assignees/owners, deadlines, and priorities (High, Medium, Low).
- **Fact-grounded prompting:** Prevents hallucinated assumptions; sets unstated details to "Not specified".
- **Meeting history & retrieval:** Saves and accesses previous meeting summaries instantly.
- **Media compatibility:** Supports common audio and video formats.
- **Clean web interface:** Responsive UI for file uploads, live status updates, and one-click summary copying.

## Prompt Engineering

The summarization pipeline uses a structured prompt that:

- Instructs the model not to invent information
- Separates decisions, action items, and risks into explicit schema fields
- Explicitly handles missing owners and deadlines using `"Not specified"`
- Requires a consistent JSON response format
- Restricts action-item priorities strictly to `High`, `Medium`, or `Low`

This enables predictable parsing directly on the frontend without relying on regex or unstructured text manipulation.

## Project Structure

```text
meeting-summarizer/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── data/
│   └── meetings.json
├── uploads/
├── server.js
├── transcribe.py
├── requirements.txt
├── package.json
└── README.md
```

## Local Setup

### Requirements

- Node.js 20+
- Python 3.10+
- Google Gemini API key

### 1. Clone and Install Backend Dependencies

```bash
git clone [https://github.com/Shruti-jain23/meeting-summarizer.git](https://github.com/Shruti-jain23/meeting-summarizer.git)
cd meeting-summarizer
npm install
```

### 2. Configure Python Virtual Environment

```powershell
python -m venv whisper\venv
.\whisper\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_available_gemini_model
WHISPER_MODEL=base
```

### 4. Run the Server

```powershell
npm start
```

Open your browser and navigate to:

```text
http://localhost:3000
```

## Evaluation Highlights

- **Transcription Accuracy:** Uses `faster-whisper` with beam search and Voice Activity Detection (VAD) for fast, accurate local inference.
- **Summary Quality:** Segregates high-signal meeting data into executive overview, concrete decisions, task assignments, and identified blockers.
- **Prompt Effectiveness:** Employs strict system rules and JSON schema constraints to eliminate hallucination risks on missing metadata.
- **Code Modularity:** Clean separation of concerns between Express API routing, Python transcription sub-processes, and frontend rendering logic.

## Future Improvements

- Database integration (PostgreSQL / MongoDB)
- Speaker diarization and identification
- User authentication and role-based access
- Asynchronous queue processing for long audio files
- Cloud storage integration (AWS S3)

## Demo

- **Video Demo:** https://drive.google.com/file/d/1YnllSOX7i5jkd-NXvwSIYKQzkEi_Yhjh/view?usp=drive_link

