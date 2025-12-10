import { GoogleGenAI } from "@google/genai";
import { InstallmentPlan } from "../types";

// Helper to analyze the installment plan
export const analyzeInstallmentPlan = async (plan: Partial<InstallmentPlan>): Promise<string> => {
  // 1. Check for Internet Connection
  if (!navigator.onLine) {
    return "⚠️ لا يتوفر اتصال بالإنترنت.\nيعمل هذا التطبيق بكفاءة في وضع عدم الاتصال (Offline)، لكن ميزة الذكاء الاصطناعي تتطلب إنترنت لتعمل.";
  }

  if (!process.env.API_KEY) {
    return "API Key missing. Cannot generate analysis.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      تصرف كمستشار مالي خبير. قم بتحليل خطة التقسيط التالية وأعط تقريراً موجزاً بالعربية:
      
      المنتج: ${plan.productName}
      السعر الأصلي: ${plan.basePrice}
      نسبة البائع: ${plan.sellerPercentage}%
      نسبة العميل: ${plan.customerPercentage}%
      صافي الربح للوسيط: ${plan.intermediaryProfit}
      المقدم: ${plan.downPayment}
      القسط الشهري: ${plan.monthlyInstallment}
      المدة: ${plan.months} شهر

      النقاط المطلوبة:
      1. هل هامش الربح جيد للوسيط؟
      2. هل القسط الشهري يبدو منطقياً بالنسبة للسعر؟
      3. نصيحة قصيرة جداً (سطر واحد) للوسيط.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "لم يتم استلام رد من النظام الذكي.";
  } catch (error) {
    console.error("AI Error:", error);
    return "حدث خطأ أثناء الاتصال بالمساعد الذكي (تأكد من اتصالك بالإنترنت).";
  }
};