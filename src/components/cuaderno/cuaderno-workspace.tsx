"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookMarked, ChevronRight, Loader2, Plus, Sparkles } from "lucide-react";
import { buildCuadernoTree, flattenCuadernoCourses } from "@/lib/cuaderno/cuaderno-tree";
import type { CuadernoClass } from "@/types/cuaderno";

export function CuadernoWorkspace({ initialClasses }: { initialClasses: CuadernoClass[] }) {
  const router = useRouter();
  const [classes, setClasses] = useState(initialClasses);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const courses = useMemo(() => flattenCuadernoCourses(), []);
  const tree = useMemo(() => buildCuadernoTree(classes), [classes]);

  const [form, setForm] = useState({
    courseId: courses[0]?.courseId ?? "",
    title: "",
    topic: "",
    classNumber: "",
  });

  const selectedCourse = courses.find((c) => c.courseId === form.courseId);

  async function handleCreateClass() {
    if (!selectedCourse || !form.title.trim()) {
      setError("Selecciona un curso y escribe el título de la clase.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/cuaderno/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse.courseId,
          courseName: selectedCourse.courseName,
          cycleNumber: selectedCourse.cycleNumber,
          cycleLabel: selectedCourse.cycleLabel,
          title: form.title.trim(),
          topic: form.topic.trim() || undefined,
          classNumber: form.classNumber ? Number(form.classNumber) : undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo crear la clase.");

      const created = payload.cuadernoClass as CuadernoClass;
      setClasses((prev) => [created, ...prev]);
      setShowForm(false);
      router.push(`/cuaderno/${created.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al crear clase.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="ms-page mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="ms-panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
          Cuaderno Inteligente
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#F5F7FA]">Tus apuntes de clase</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Apunta lo que explica el profesor, consulta el diccionario jurídico y genera organizadores sin
          depender de un PDF.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="tron-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            <Plus size={16} />
            Nueva clase
          </button>
        </div>
      </header>

      {showForm ? (
        <section className="ms-panel space-y-4 p-6">
          <h2 className="text-lg font-semibold text-[#F5F7FA]">Crear clase</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-muted-foreground">Curso</span>
              <select
                value={form.courseId}
                onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                className="ms-input w-full rounded-xl px-3 py-2.5 text-sm"
              >
                {courses.map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.cycleLabel} · {course.courseName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Título de clase</span>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej.: Clase 01"
                className="ms-input w-full rounded-xl px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Tema</span>
              <input
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                placeholder="Ej.: Acto Jurídico"
                className="ms-input w-full rounded-xl px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Número (opcional)</span>
              <input
                type="number"
                min={1}
                value={form.classNumber}
                onChange={(e) => setForm((f) => ({ ...f, classNumber: e.target.value }))}
                placeholder="1"
                className="ms-input w-full rounded-xl px-3 py-2.5 text-sm"
              />
            </label>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="button"
            disabled={creating}
            onClick={handleCreateClass}
            className="tron-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Crear y abrir apuntes
          </button>
        </section>
      ) : null}

      {tree.length === 0 ? (
        <section className="ms-panel flex flex-col items-center px-6 py-16 text-center">
          <BookMarked size={40} className="text-[#00FFD5]/60" />
          <p className="mt-4 text-lg font-semibold text-[#F5F7FA]">Aún no tienes clases</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Crea tu primera clase para el curso que estés cursando. Ej.: Ciclo III → Derecho Civil II →
            Clase 01 Acto Jurídico.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {tree.map((cycle) => (
            <section key={cycle.cycleNumber} className="ms-panel p-5 md:p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#00FFD5]">
                {cycle.cycleLabel}
              </h2>
              <div className="mt-4 space-y-5">
                {cycle.courses.map((course) => (
                  <div key={course.courseId}>
                    <h3 className="text-base font-semibold text-[#F5F7FA]">{course.courseName}</h3>
                    <ul className="mt-2 space-y-1">
                      {course.classes.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={`/cuaderno/${item.id}`}
                            className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition hover:border-[#00FFD5]/30 hover:bg-[#00FFD5]/5"
                          >
                            <div>
                              <p className="text-sm font-medium text-[#F5F7FA]">{item.title}</p>
                              {item.topic ? (
                                <p className="text-xs text-muted-foreground">{item.topic}</p>
                              ) : null}
                            </div>
                            <ChevronRight
                              size={16}
                              className="text-muted-foreground transition group-hover:text-[#00FFD5]"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
