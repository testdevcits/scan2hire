import { useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiMinimize2, FiSend, FiX, FiZap } from "react-icons/fi";
import API from "../api/axios";

const welcomeMessage = { id: "welcome", role: "assistant", text: "Hi! Ask me about an employee, candidate, or leave summary. I only show data that your current access allows." };

export default function HrAssistantChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, open, sending]);

  const send = async (text = draft) => {
    const message = String(text || "").trim();
    if (!message || sending) return;
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text: message }]);
    setDraft("");
    setSending(true);
    try {
      const response = await API.post("/assistant/chat", { message });
      const answer = response.data?.data?.answer || "I could not prepare an answer for that request.";
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", text: answer }]);
    } catch (error) {
      setMessages((current) => [...current, { id: `error-${Date.now()}`, role: "assistant", error: true, text: error.response?.data?.message || "Assistant is unavailable. Please try again." }]);
    } finally { setSending(false); }
  };

  const clear = () => { setMessages([welcomeMessage]); setDraft(""); };

  return (
    <div className="fixed bottom-5 right-5 z-[60] font-montserrat">
      {open && <section className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[18px] border border-[#ffd8cf] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
        <header className="flex items-center gap-3 border-b border-[#df3e23] bg-gradient-to-r from-[#f84525] to-[#ff765c] px-4 py-3.5 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-[#f84525] shadow-sm"><FiZap /></span>
          <div className="min-w-0 flex-1"><h2 className="text-sm font-bold">Scan2Hire Assistant</h2><p className="mt-0.5 text-[11px] text-white/85"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-300" />Secure HR &amp; Admin support</p></div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/20" aria-label="Minimize assistant"><FiMinimize2 /></button>
          <button type="button" onClick={() => { setOpen(false); clear(); }} className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/20" aria-label="Close and clear assistant"><FiX /></button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto bg-[#fffaf8] p-3.5">
          {messages.map((message) => <div key={message.id} className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>{message.role === "assistant" && <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffe1d9] text-xs text-[#f84525]"><FiZap /></span>}<p className={`max-w-[82%] whitespace-pre-wrap rounded-[14px] px-3.5 py-2.5 text-sm leading-5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] ${message.role === "user" ? "rounded-br-sm bg-[#f84525] text-white" : message.error ? "rounded-bl-sm border border-red-200 bg-red-50 text-red-700" : "rounded-bl-sm border border-[#ffe0d8] bg-white text-gray-700"}`}>{message.text}</p></div>)}
          {sending && <div className="flex items-end gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffe1d9] text-xs text-[#f84525]"><FiZap /></span><p className="rounded-[14px] rounded-bl-sm border border-[#ffe0d8] bg-white px-3.5 py-2.5 text-sm text-gray-500 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">Looking that up securely…</p></div>}
          <div ref={endRef} />
        </div>
        <div className="border-t border-[#ffe4dd] bg-white p-3.5">
          <form onSubmit={(event) => { event.preventDefault(); send(); }} className="flex items-end gap-2 rounded-[12px] border border-[#e6e8ec] bg-[#fafafa] p-1.5 focus-within:border-[#f84525] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#f84525]/15">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 1000))} rows={1} placeholder="Ask about an employee, candidate, or leaves…" className="max-h-24 min-h-8 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none" />
            <button type="submit" disabled={sending || !draft.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f84525] text-white shadow-sm transition hover:bg-[#d9361b] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><FiSend size={15} /></button>
          </form>
          <p className="mt-2 text-center text-[10px] text-gray-400">Read-only assistant · Access is checked for every result</p>
        </div>
      </section>}
      {!open && <button type="button" onClick={() => setOpen(true)} className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#f84525] text-xl text-white shadow-[0_10px_26px_rgba(248,69,37,0.36)] transition hover:scale-105 hover:bg-[#d9361b]" aria-label="Open Scan2Hire Assistant"><FiMessageCircle /></button>}
    </div>
  );
}
