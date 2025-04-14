import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
// ປ່ຽນຈາກການໃຊ້ cross-fetch ເປັນໃຊ້ fetch ຂອງ Convex ເລີຍ

// ໃຊ້ Gemini API ສຳລັບຖອດຄວາມສຽງ
export const transcribeAudio = action({
  args: {
    audioData: v.string(), // ຮັບຂໍ້ມູນສຽງເປັນ base64 string
    language: v.optional(v.string()) // ພາສາຂອງສຽງ (optional)
  },
  handler: async (ctx, args) => {
    try {
      // ຕ້ອງໄດ້ຕັ້ງຄ່າ GOOGLE_API_KEY ໃນ Convex environment variables
      const apiKey = process.env.GOOGLE_API_KEY;
      
      if (!apiKey) {
        throw new Error("GOOGLE_API_KEY is not set in environment variables");
      }

      console.log("Processing audio for transcription, length:", args.audioData.length);
      
      // ກຳນົດພາສາທີ່ຈະໃຊ້ໃນການຖອດຄວາມສຽງ
      const language = args.language || "lo";
      const languageName = language === "lo" ? "Lao" : "English";
      
      // ສ້າງ prompt ສຳລັບ Gemini API ທີ່ຂໍຮູບແບບ timecode, speaker, caption
      const prompt = `Transcribe the following audio file in ${languageName} language. 
      If you detect other languages besides ${languageName} in the audio, transcribe those parts in their original language and combine them seamlessly without marking the language.
      Format the transcript with timecode, speaker identification, and caption.
      Use the format: [MM:SS] Speaker A/B/C: Caption text
      Identify different speakers as Speaker A, Speaker B, etc.
      If there is no speech detected, return exactly "NO_SPEECH_DETECTED".
      Return only the formatted transcript without additional explanation.`;
      
      // ສົ່ງຄຳຂໍໄປຫາ Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: "audio/mp3",
                    data: args.audioData
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40
          }
        })
      });

      // ຕວດສອບຄວາມຖືກຕ້ອງຂອງການຕອບກັບ
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      // ແປງຄຳຕອບກັບເປັນ JSON
      const result = await response.json();
      
      // ຈັດການກັບກໍລະນີບໍ່ມີຜົນລັບ
      if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
        throw new Error("Invalid response from Gemini API");
      }
      
      // ດຶງເອົາເນື້ອຫາການຖອດຄວາມສຽງ
      const transcription = result.candidates[0].content.parts[0].text;
      
      // ກວດສອບກໍລະນີບໍ່ມີສຽງເວົ້າ
      if (transcription.trim() === "NO_SPEECH_DETECTED") {
        return {
          success: true,
          transcript: "NO_SPEECH_DETECTED",
          formattedTranscript: [],
          language: language
        };
      }
      
      // ປັບຮູບແບບຂໍ້ມູນໃຫ້ເປັນ structured format ສຳລັບໜ້າຈໍ frontend
      const transcriptLines = transcription.split('\n').filter((line: string) => line.trim() !== '');
      
      // ແປງຮູບແບບເປັນໂຄງສ້າງຂໍ້ມູນທີ່ມີ timecode, speaker, ແລະ text
      const formattedTranscript = transcriptLines.map((line: string) => {
        // ຮູບແບບທີ່ຄາດຫວັງ: [MM:SS] Speaker X: Caption text
        const match = line.match(/\[(\d+:\d+)\]\s+(Speaker\s+\w+):\s+(.*)/i);
        
        if (match) {
          return {
            timecode: match[1],
            speaker: match[2],
            text: match[3]
          };
        }
        
        // ຖ້າບໍ່ຕົງກັບຮູບແບບ, ເກັບໄວ້ເປັນຂໍ້ຄວາມທຳມະດາ
        return {
          timecode: "",
          speaker: "",
          text: line
        };
      });
      
      // ສົ່ງຄືນຂໍ້ຄວາມຖອດຄວາມສຽງ
      return {
        success: true,
        transcript: transcription,
        formattedTranscript: formattedTranscript,
        language: language
      };
      
    } catch (error) {
      console.error("Error transcribing audio:", error);
      return {
        success: false,
        error: String(error),
        transcript: "",
        formattedTranscript: []
      };
    }
  }
});

// ຈຳລອງການສະຫຼຸບບົດຖອດຄວາມສຽງດ້ວຍ Gemini API
export const summarizeTranscript = action({
  args: {
    transcript: v.string(), // ບົດຖອດຄວາມສຽງ
    language: v.optional(v.string()) // ພາສາຂອງບົດຖອດຄວາມສຽງ (optional)
  },
  handler: async (ctx, args) => {
    try {
      // ຕ້ອງໄດ້ຕັ້ງຄ່າ GOOGLE_API_KEY ໃນ Convex environment variables
      const apiKey = process.env.GOOGLE_API_KEY;
      
      if (!apiKey) {
        throw new Error("GOOGLE_API_KEY is not set in environment variables");
      }

      console.log("Processing transcript for summarization, length:", args.transcript.length);
      
      // ຂັ້ນຕອນແທ້ຈິງຈະມີການເຊື່ອມຕໍ່ກັບ Gemini API ຄ້າຍແບບນີ້:
      /*
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Summarize the following transcript in ${args.language === 'lo' ? 'Lao' : 'English'} language:
                  
                  ${args.transcript}`
                }
              ]
            }
          ]
        })
      });

      const result = await response.json();
      const summary = result.candidates[0].content.parts[0].text;
      */
      
      // ຈຳລອງການລໍຖ້າປະມວນຜົນ
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // ຈຳລອງບົດສະຫຼຸບ
      const language = args.language || "lo";
      let mockSummary = "";
      
      if (language === "lo") {
        mockSummary = "ນີ້ແມ່ນການສາທິດລະບົບ lao-ai-record ທີ່ສາມາດຖອດຄວາມສຽງແລະສະຫຼຸບເນື້ອຫາໄດ້. ລະບົບສາມາດເຮັດວຽກໄດ້ກັບຫຼາຍພາສາລວມທັງພາສາລາວ, ໄທ, ແລະ ອັງກິດ.";
      } else {
        mockSummary = "This is a demonstration of the lao-ai-record system that can transcribe audio and summarize content. The system works with multiple languages including Lao, Thai, and English.";
      }
      
      // ສົ່ງຄືນບົດສະຫຼຸບ
      return {
        success: true,
        summary: mockSummary,
        language: language
      };
      
    } catch (error) {
      console.error("Error summarizing transcript:", error);
      return {
        success: false,
        error: String(error),
        summary: ""
      };
    }
  }
}); 