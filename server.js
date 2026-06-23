const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured. Please add ANTHROPIC_API_KEY to your Replit Secrets." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.content?.[0]?.text) {
      res.json({ letter: data.content[0].text });
    } else {
      // Log the ACTUAL error from Anthropic's API rather than swallowing it.
      // Previously this only showed a generic "Unexpected response" message
      // with no way to diagnose what actually went wrong (e.g. a retired
      // model ID, an invalid API key, a malformed request, etc).
      console.error("Anthropic API returned unexpected shape:", JSON.stringify(data));
      const errMsg = data.error?.message || "Unexpected response from AI. Please try again.";
      res.status(500).json({ error: errMsg });
    }
  } catch (err) {
    console.error("Failed to reach Anthropic API:", err);
    res.status(500).json({ error: "Failed to connect to AI. Please try again." });
  }
});

// Fallback: serve index.html for any other route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`EHN Family Coach running on port ${PORT}`);
});
