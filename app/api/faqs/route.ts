import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const faqs = await prisma.fAQ.findMany({
    where: { businessId: user.businessId },
    orderBy: { usageCount: "desc" }
  });

  return NextResponse.json({ faqs });
}

export async function POST(request: Request) {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    question?: string;
    answer?: string;
  };

  if (!body.question?.trim() || !body.answer?.trim()) {
    return NextResponse.json({ error: "Question and answer are required." }, { status: 400 });
  }

  const faq = await prisma.fAQ.create({
    data: {
      businessId: user.businessId,
      question: body.question.trim(),
      answer: body.answer.trim()
    }
  });

  return NextResponse.json({ faq }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    question?: string;
    answer?: string;
  };

  if (!body.id || !body.question?.trim() || !body.answer?.trim()) {
    return NextResponse.json({ error: "FAQ, question, and answer are required." }, { status: 400 });
  }

  const faq = await prisma.fAQ.updateMany({
    where: {
      id: body.id,
      businessId: user.businessId
    },
    data: {
      question: body.question.trim(),
      answer: body.answer.trim()
    }
  });

  if (!faq.count) {
    return NextResponse.json({ error: "FAQ not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
  };

  if (!body.id) {
    return NextResponse.json({ error: "FAQ is required." }, { status: 400 });
  }

  const faq = await prisma.fAQ.deleteMany({
    where: {
      id: body.id,
      businessId: user.businessId
    }
  });

  if (!faq.count) {
    return NextResponse.json({ error: "FAQ not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
