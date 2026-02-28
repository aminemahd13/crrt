import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
    const { formId, data } = await request.json();

    if (!formId || !data) {
        return NextResponse.json({ error: "Missing formId or data" }, { status: 400 });
    }

    // Verify form exists and is published
    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form || form.status !== "published") {
        return NextResponse.json({ error: "Form not found or not published" }, { status: 404 });
    }

    const submission = await prisma.formSubmission.create({
        data: {
            formId,
            data: JSON.stringify(data),
            status: "new",
        },
    });

    // Send confirmation email to submitter (if they provided an email)
    const submitterEmail = data.email as string | undefined;
    if (submitterEmail) {
        try {
            await sendEmail({
                to: submitterEmail,
                subject: `Submission received: ${form.title}`,
                html: `
          <div style="font-family: system-ui, sans-serif; padding: 24px; background: #0F172A; color: #F8FAFC; border-radius: 12px;">
            <h2 style="color: #F97316; margin-bottom: 12px;">✅ We got your submission!</h2>
            <p style="color: #94A3B8; margin: 0 0 8px;">Thank you for submitting <strong style="color: #F8FAFC;">${form.title}</strong>.</p>
            <p style="color: #94A3B8; margin: 0 0 16px;">We'll review it and get back to you soon.</p>
            <hr style="border-color: rgba(248,250,252,0.08); margin: 16px 0;" />
            <p style="color: #64748B; font-size: 12px; margin: 0;">
              Submission ID: ${submission.id}<br/>
              Submitted: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        `,
            });
        } catch (err) {
            // Don't fail the submission if email fails
            console.error("Submitter confirmation email failed:", err);
        }
    }

    // Notify admin about new submission
    try {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
            const summary = Object.entries(data)
                .map(([k, v]) => `<strong>${k}</strong>: ${v}`)
                .join("<br/>");

            await sendEmail({
                to: adminEmail,
                subject: `New submission: ${form.title}`,
                html: `
          <div style="font-family: system-ui, sans-serif; padding: 24px; background: #0F172A; color: #F8FAFC; border-radius: 12px;">
            <h2 style="color: #F97316; margin-bottom: 8px;">📋 New Form Submission</h2>
            <p style="color: #94A3B8; margin: 4px 0;"><strong>Form:</strong> ${form.title}</p>
            <p style="color: #94A3B8; margin: 4px 0;"><strong>Status:</strong> New</p>
            <hr style="border-color: rgba(248,250,252,0.08); margin: 16px 0;" />
            <div style="color: #94A3B8; font-size: 14px; line-height: 1.6;">${summary}</div>
          </div>
        `,
            });
        }
    } catch {
        // Non-critical admin notification
    }

    return NextResponse.json(submission, { status: 201 });
}
