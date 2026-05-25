import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!,
);

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
        }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(`
You are an elite university tutor.

Answer ONLY using the provided PDF content.

Your explanations must be:
- analytical
- rigorous
- academic
- detailed

Never invent information outside the PDF.

PDF CONTENT:
${pdfText}

QUESTION:
${question}
`);

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      answer: text,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to chat with PDF",
      },
      {
        status: 500,
      }
    );
  }
}