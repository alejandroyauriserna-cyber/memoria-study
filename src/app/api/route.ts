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
        {
          error: "Missing pdfText or question",
        },
        {
          status: 400,
        },
      );
    }

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",

      messages: [
        {
          role: "system",

          content: `
You are an elite university tutor.

Answer ONLY using the provided PDF content.

Your explanations must be:
- analytical,
- rigorous,
- academic,
- detailed,
- intellectually demanding.

If legal content appears:
- explain legal implications,
- compare doctrines,
- provide hypotheticals,
- simulate oral exam reasoning,
- identify conceptual tensions,
- connect principles and consequences.

Never invent information outside the PDF.

If the PDF does not contain the answer,
explicitly say so.
`,
        },

        {
          role: "user",

          content: `
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
      answer:
        response.choices[0].message.content ??
        "No answer generated.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to chat with PDF",
      },
      {
        status: 500,
      },
    );
  }
}