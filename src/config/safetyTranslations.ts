// Fixed translated lines shown under the English safety and scope messages, chosen by the note's language.
// The model never translates a safety message. These lines were written by the build team and have NOT been
// reviewed by a native speaker of each language. 911 and 988 are United States numbers.
export type SafetyLineKind = "red_flag" | "emergency" | "abuse" | "person_wish_to_die" | "distress" | "scope";
export type TranslatedLanguage = "es" | "hi" | "zh";

export const SAFETY_TRANSLATIONS: Record<TranslatedLanguage, Record<SafetyLineKind, string>> = {
  es: {
    red_flag: "Por favor, comuníquese con su médico o su equipo de atención. Lo que describió puede necesitar atención médica.",
    emergency: "Llame al 911 ahora. Lo que describió puede ser una emergencia. No espere a ver si se pasa.",
    abuse: "Por favor, comuníquese con su médico o su equipo de atención. Si alguien está en peligro inmediato, llame al 911 ahora.",
    person_wish_to_die: "Por favor, comuníquese hoy con su médico o su equipo de atención y cuénteles exactamente lo que dijo. También puede llamar o enviar un mensaje de texto al 988.",
    distress: "Usted también importa. Si siente que no puede seguir o piensa en hacerse daño, llame o envíe un mensaje de texto al 988 (Línea 988 de Prevención del Suicidio y Crisis) ahora. Es gratis y atiende las 24 horas. No se guardó nada de esta nota.",
    scope: "Unspoken no puede diagnosticar ni dar consejos sobre medicamentos o dosis. Por favor, pregunte a su médico o a su equipo de atención.",
  },
  hi: {
    red_flag: "कृपया अपने डॉक्टर या देखभाल टीम से संपर्क करें। आपने जो बताया है, उसके लिए चिकित्सकीय जाँच की ज़रूरत हो सकती है।",
    emergency: "अभी 911 पर कॉल करें। आपने जो बताया है, वह आपात स्थिति हो सकती है। ठीक होने का इंतज़ार न करें।",
    abuse: "कृपया अपने डॉक्टर या देखभाल टीम से संपर्क करें। अगर कोई तुरंत ख़तरे में है, तो अभी 911 पर कॉल करें।",
    person_wish_to_die: "कृपया आज ही अपने डॉक्टर या देखभाल टीम से संपर्क करें और उन्हें ठीक वही बताएँ जो कहा गया था। आप 988 पर कॉल या मैसेज भी कर सकते हैं।",
    distress: "आप भी मायने रखते हैं। अगर आपको लगता है कि आप और नहीं सह सकते या खुद को नुकसान पहुँचाने का विचार आ रहा है, तो अभी 988 (988 सुसाइड एंड क्राइसिस लाइफ़लाइन) पर कॉल या मैसेज करें। यह मुफ़्त है और 24 घंटे खुली है। इस नोट से कुछ भी सेव नहीं किया गया।",
    scope: "Unspoken निदान नहीं कर सकता और दवा या खुराक के बारे में सलाह नहीं दे सकता। कृपया अपने डॉक्टर या देखभाल टीम से पूछें।",
  },
  zh: {
    red_flag: "请联系您的医生或护理团队。您描述的情况可能需要医疗检查。",
    emergency: "请立即拨打 911。您描述的情况可能是紧急情况，不要等待观察。",
    abuse: "请联系您的医生或护理团队。如果有人正处于危险之中，请立即拨打 911。",
    person_wish_to_die: "请今天就联系您的医生或护理团队，并如实告诉他们所说的话。您也可以拨打或发短信至 988。",
    distress: "您也很重要。如果您觉得撑不下去，或有伤害自己的念头，请立即拨打或发短信至 988（988 自杀与危机生命热线）。免费，全天 24 小时开放。这条记录没有被保存。",
    scope: "Unspoken 不能做出诊断，也不能提供用药或剂量方面的建议。请咨询您的医生或护理团队。",
  },
};

export function isTranslatedLanguage(code: string | null | undefined): code is TranslatedLanguage {
  return code === "es" || code === "hi" || code === "zh";
}
