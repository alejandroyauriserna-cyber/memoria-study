import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const pdfText = body.pdfText;
    const question = body.question;

    if (!pdfText || !question) {
      return NextResponse.json(
        { error: "Missing pdfText or question" },
        { status: 400 },
      );
    }

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",

      messages: [
        {
          role: "system",
          content:
            `
You are an elite university tutor.

Answer ONLY using the provided PDF.

Be analytical, rigorous, academic, and explanatory.

If legal content appears:
- explain implications,
- compare doctrines,
- provide hypotheticals,
- simulate difficult oral exam questions.

Never invent information outside the PDF.
`,
        },

        {
          role: "user",
          content:
            `
PDF CONTENT:

${pdfText}

QUESTION:

${question}
`,
        },
      ],

      temperature: 0.7,
    });

    return NextResponse.json({
      answer: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to chat with PDF" },
      { status: 500 },
    );
  }
}