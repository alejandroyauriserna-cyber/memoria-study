"use client";

import { CuadernoNoteEditorPro } from "@/components/cuaderno/cuaderno-note-editor-pro";
import type { CuadernoClass } from "@/types/cuaderno";
import { useState } from "react";

const mockNote: CuadernoClass = {
  id: "test-1",
  userId: "test-user",
  courseId: "course-1",
  courseName: "Derecho Constitucional I",
  cycleNumber: 1,
  cycleLabel: "Primera Parte",
  classNumber: 1,
  title: "Introducción al Derecho Constitucional",
  topic: "Constitución",
  classDate: new Date().toISOString(),
  notes: "<h2>Conceptos Fundamentales</h2><p>El derecho constitucional es la rama del derecho que estudia la Constitución...</p><ul><li>Definición</li><li>Características</li><li>Importancia</li></ul>",
  extractedConcepts: ["Constitución", "Derecho Público", "Soberanía"],
  materialId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function EditorTestPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Editor Pro - Testing</h1>
        <p className="text-gray-600 mb-8">
          Haz clic en "Abrir Editor" para probar el editor profesional tipo Word.
        </p>

        <button
          onClick={() => setIsOpen(true)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-8"
        >
          Abrir Editor
        </button>

        <CuadernoNoteEditorPro
          note={mockNote}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSave={async (content) => {
            console.log("Contenido guardado:", content);
            alert("Editor guardado (ver consola)");
          }}
        />

        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-xl font-bold mb-4">Funcionalidades a Probar:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✅ Formateo: Negrita, Cursiva, Subrayado, Tachado</li>
            <li>✅ Colores de texto con picker</li>
            <li>✅ Alineación: Izquierda, Centro, Derecha, Justificado</li>
            <li>✅ Listas: Viñetas, Numeradas, Indentación</li>
            <li>✅ Inserción: Enlaces, Imágenes, Tablas, Código</li>
            <li>✅ Tipos de papel: Blanca, Rayada, Cuadrícula, Punteada</li>
            <li>✅ Selector de tamaño de fuente</li>
            <li>✅ Estadísticas en tiempo real</li>
            <li>✅ Menú con opciones avanzadas</li>
            <li>✅ Guardar cambios</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
