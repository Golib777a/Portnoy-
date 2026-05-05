import { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { Camera, Image as ImageIcon, Scissors, Loader2, Upload, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      
      // Extract base64 without the data:image/... prefix
      const base64 = dataUrl.split(',')[1];
      setBase64Data(base64);
      setMimeType(file.type);
    };
    reader.onerror = () => {
      setError("Не удалось загрузить изображение.");
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!base64Data || !mimeType) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Не найден ключ API (GEMINI_API_KEY). Пожалуйста, задайте его в настройках или в переменных окружения при сборке.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Ты опытный профессиональный портной и конструктор одежды. Я отправляю тебе фотографию одежды. 
Твоя задача:
1. Проанализировать фасон, ткань и детали одежды на фото (воротники, рукава, силуэт, карманы, вытачки и т.д.).
2. Написать, какие ткани лучше всего подойдут для пошива этой модели, и какой метраж понадобится (примерно).
3. Составить подробную схему раскроя (какие детали кроя нужны, их количество, особенности конструкции).
4. Описать пошаговую инструкцию по пошиву этой вещи от начала до конца, как если бы это шил профессионал в ателье.

Отвечай на русском языке, используй профессиональную терминологию портных, но объясняй так, чтобы было понятно. Будь максимально подробным. Форматируй свой ответ красиво с помощью Markdown (используй заголовки, списки, выделения).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Data } }
          ]
        }
      });
      
      setResult(response.text || "Извините, не удалось сгенерировать инструкции.");
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('API')) {
        setError(err.message);
      } else {
        setError("Произошла ошибка при анализе изображения. Пожалуйста, попробуйте еще раз.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImagePreview(null);
    setBase64Data(null);
    setMimeType(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-atelier-bg)] text-[var(--color-atelier-fg)] pb-20">
      {/* Header */}
      <header className="pt-12 pb-8 px-6 text-center max-w-4xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full border border-[var(--color-atelier-accent)] flex items-center justify-center bg-[var(--color-atelier-surface)] shadow-sm">
            <Scissors className="w-8 h-8 text-[var(--color-atelier-accent)]" />
          </div>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--color-atelier-fg)] mb-3 leading-tight tracking-tight">
          Личный Портной
        </h1>
        <p className="font-sans text-base md:text-lg text-[var(--color-atelier-muted)] max-w-lg mx-auto leading-relaxed">
          Загрузите фотографию любой одежды, и мы создадим для вас полный процесс пошива и раскроя.
        </p>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {!imagePreview ? (
            <motion.div 
              key="upload-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-atelier-surface)] rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.05)] text-center"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* File input (Camera) */}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                />
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="group relative flex flex-col items-center justify-center p-8 h-48 rounded-2xl border-2 border-dashed border-[var(--color-atelier-muted)] hover:border-[var(--color-atelier-accent)] hover:bg-[rgba(139,90,43,0.02)] transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--color-atelier-bg)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-[var(--color-atelier-accent)]" />
                  </div>
                  <span className="font-medium text-lg">Сделать фото</span>
                  <span className="text-sm text-[var(--color-atelier-muted)] mt-1">Камера устройства</span>
                </button>

                {/* File input (Gallery) */}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex flex-col items-center justify-center p-8 h-48 rounded-2xl border-2 border-dashed border-[var(--color-atelier-muted)] hover:border-[var(--color-atelier-accent)] hover:bg-[rgba(139,90,43,0.02)] transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--color-atelier-bg)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-[var(--color-atelier-accent)]" />
                  </div>
                  <span className="font-medium text-lg">Загрузить фото</span>
                  <span className="text-sm text-[var(--color-atelier-muted)] mt-1">Из галереи</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <button 
                  onClick={reset}
                  className="flex items-center text-sm font-medium text-[var(--color-atelier-muted)] hover:text-[var(--color-atelier-fg)] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Другое фото
                </button>
              </div>

              {/* Image Preview Card */}
              <div className="bg-[var(--color-atelier-surface)] p-2 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.05)] flex flex-col md:flex-row gap-6 items-center md:items-start group">
                <div className="relative w-full md:w-1/3 aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 flex-shrink-0">
                  <img 
                    src={imagePreview} 
                    alt="Clothing item" 
                    className="w-full h-full object-cover"
                  />
                  {!result && !isProcessing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-black px-4 py-2 rounded-full font-medium text-sm flex items-center"
                      >
                        <Upload className="w-4 h-4 mr-2" /> Заменить
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="w-full md:w-2/3 py-4 pr-4">
                  {!result && !isProcessing && (
                    <div className="h-full flex flex-col justify-center text-center md:text-left">
                      <h2 className="font-serif text-2xl mb-2">Начать анализ?</h2>
                      <p className="text-[var(--color-atelier-muted)] mb-6">
                        Наш искусственный интеллект проанализирует это изделие и составит подробную схему его создания.
                      </p>
                      <button 
                        onClick={processImage}
                        className="self-center md:self-start bg-[var(--color-atelier-fg)] hover:bg-black text-white px-8 py-3 rounded-full font-medium transition-transform active:scale-95 flex items-center shadow-lg"
                      >
                        <Scissors className="w-4 h-4 mr-2" />
                        Создать выкройку и инструкцию
                      </button>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="h-full flex flex-col justify-center items-center text-center py-12 md:py-0">
                      <Loader2 className="w-10 h-10 text-[var(--color-atelier-accent)] animate-spin mb-4" />
                      <h3 className="font-serif text-xl mb-2">В мастерской...</h3>
                      <p className="text-[var(--color-atelier-muted)] animate-pulse">
                        Снимаем мерки, подбираем ткань, готовим выкройки...
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="h-full flex flex-col justify-center items-center md:items-start text-center md:text-left text-red-500 py-6">
                      <p>{error}</p>
                      <button 
                        onClick={processImage}
                        className="mt-4 px-6 py-2 border border-red-500 rounded-full hover:bg-red-50 transition-colors"
                      >
                        Попробовать снова
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Results */}
              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[var(--color-atelier-surface)] rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.05)]"
                >
                  <div className="markdown-body">
                    <Markdown>{result}</Markdown>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

