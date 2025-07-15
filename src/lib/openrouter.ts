const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function askAgent({
    messages,
    model = "mistralai/mistral-7b-instruct",
} : {
    messages: { role: "user" | "assistant" | "system"; content: string }[];
    model?: string;
}) {
    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messages,
            model
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter API error: ${error.message}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No response from model";
}