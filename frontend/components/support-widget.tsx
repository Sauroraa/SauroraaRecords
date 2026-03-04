"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Headset, MessageCircle, Plus, Send, X } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import {
  createSupportTicket,
  fetchMySupportTickets,
  fetchSupportTicket,
  sendSupportMessage
} from "@/lib/api";

function statusLabel(value: string) {
  switch (value) {
    case "OPEN":
      return "Open";
    case "IN_PROGRESS":
      return "In progress";
    case "WAITING_USER":
      return "Waiting you";
    case "RESOLVED":
      return "Resolved";
    case "CLOSED":
      return "Closed";
    default:
      return value;
  }
}

export function SupportWidget() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [newMode, setNewMode] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [draftReply, setDraftReply] = useState("");

  const ticketsQuery = useQuery({
    queryKey: ["support", "mine"],
    queryFn: fetchMySupportTickets,
    enabled: open && !!user,
    refetchInterval: open ? 15000 : false
  });

  const selectedFallbackId = useMemo(
    () => selectedTicketId ?? ticketsQuery.data?.[0]?.id ?? null,
    [selectedTicketId, ticketsQuery.data]
  );

  const ticketQuery = useQuery({
    queryKey: ["support", "ticket", selectedFallbackId],
    queryFn: () => fetchSupportTicket(selectedFallbackId!),
    enabled: open && !!user && !!selectedFallbackId,
    refetchInterval: open ? 8000 : false
  });

  const createTicketMutation = useMutation({
    mutationFn: (payload: { subject: string; message: string }) =>
      createSupportTicket({
        subject: payload.subject,
        message: payload.message,
        category: "GENERAL",
        priority: "NORMAL"
      }),
    onSuccess: (ticket) => {
      if (!ticket) return;
      setSubject("");
      setMessage("");
      setNewMode(false);
      setSelectedTicketId(ticket.id);
      void queryClient.invalidateQueries({ queryKey: ["support", "mine"] });
      void queryClient.invalidateQueries({ queryKey: ["support", "ticket", ticket.id] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (payload: { ticketId: string; body: string }) =>
      sendSupportMessage(payload.ticketId, payload.body),
    onSuccess: (ticket) => {
      if (!ticket) return;
      setDraftReply("");
      void queryClient.invalidateQueries({ queryKey: ["support", "mine"] });
      void queryClient.setQueryData(["support", "ticket", ticket.id], ticket);
    }
  });

  return (
    <div className="fixed bottom-32 right-6 z-50">
      {open && (
        <div className="mb-3 h-[520px] w-[360px] overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-bg shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Headset className="h-4 w-4 text-violet-light" />
              <p className="text-sm font-semibold text-cream">Support Sauroraa</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 text-cream/45 hover:bg-white/5 hover:text-cream/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!user ? (
            <div className="flex h-[468px] flex-col items-center justify-center gap-3 px-6 text-center">
              <Bot className="h-8 w-8 text-violet-light" />
              <p className="text-sm text-cream/70">Connecte-toi pour ouvrir un ticket support.</p>
            </div>
          ) : newMode ? (
            <div className="space-y-3 p-4">
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Sujet du ticket"
                className="w-full rounded-[10px] border border-[rgba(255,255,255,0.12)] bg-surface px-3 py-2 text-sm text-cream outline-none focus:border-violet/60"
              />
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Explique ton probleme (URL, etapes, capture...)"
                rows={8}
                className="w-full resize-none rounded-[10px] border border-[rgba(255,255,255,0.12)] bg-surface px-3 py-2 text-sm text-cream outline-none focus:border-violet/60"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setNewMode(false)}
                  className="flex-1 rounded-[10px] border border-[rgba(255,255,255,0.12)] py-2 text-sm text-cream/70 hover:text-cream transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => {
                    if (!subject.trim() || !message.trim()) return;
                    createTicketMutation.mutate({ subject: subject.trim(), message: message.trim() });
                  }}
                  className="flex-1 rounded-[10px] bg-violet py-2 text-sm font-medium text-white hover:bg-violet-hover transition-colors"
                >
                  Creer ticket
                </button>
              </div>
            </div>
          ) : (
            <div className="grid h-[468px] grid-cols-[140px_1fr]">
              <div className="border-r border-[rgba(255,255,255,0.08)]">
                <button
                  onClick={() => setNewMode(true)}
                  className="m-2 flex w-[124px] items-center justify-center gap-1 rounded-[8px] border border-violet/40 bg-violet/10 px-2 py-1.5 text-xs text-violet-light hover:bg-violet/20 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nouveau
                </button>

                <div className="h-[410px] overflow-y-auto px-2 pb-2">
                  {(ticketsQuery.data ?? []).map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`mb-2 w-full rounded-[8px] border px-2 py-2 text-left transition-colors ${
                        selectedFallbackId === ticket.id
                          ? "border-violet/60 bg-violet/10"
                          : "border-[rgba(255,255,255,0.08)] bg-surface hover:border-[rgba(255,255,255,0.18)]"
                      }`}
                    >
                      <p className="line-clamp-2 text-[11px] font-medium text-cream">{ticket.subject}</p>
                      <p className="mt-1 text-[10px] text-cream/45">{statusLabel(ticket.status)}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                <div className="border-b border-[rgba(255,255,255,0.08)] px-3 py-2">
                  <p className="line-clamp-1 text-xs font-medium text-cream">
                    {ticketQuery.data?.subject ?? "Selectionne un ticket"}
                  </p>
                  <p className="text-[10px] text-cream/45">
                    {ticketQuery.data ? statusLabel(ticketQuery.data.status) : "Chatbot virtuel + equipe support"}
                  </p>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {ticketQuery.data?.messages?.map((messageItem) => {
                    const mine = messageItem.authorType === "USER";
                    const bot = messageItem.authorType === "BOT";
                    return (
                      <div key={messageItem.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[88%] rounded-[10px] px-3 py-2 text-xs leading-relaxed ${
                            mine
                              ? "bg-violet text-white"
                              : bot
                                ? "border border-violet/30 bg-violet/10 text-cream"
                                : "bg-surface text-cream/85"
                          }`}
                        >
                          {messageItem.body}
                        </div>
                      </div>
                    );
                  })}

                  {ticketQuery.data && ticketQuery.data.messages.length === 0 && (
                    <p className="text-xs text-cream/40">Aucun message.</p>
                  )}
                </div>

                <div className="border-t border-[rgba(255,255,255,0.08)] p-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={draftReply}
                      onChange={(event) => setDraftReply(event.target.value)}
                      placeholder="Ecris un message..."
                      className="flex-1 rounded-[8px] border border-[rgba(255,255,255,0.12)] bg-surface px-2.5 py-1.5 text-xs text-cream outline-none focus:border-violet/60"
                      disabled={!selectedFallbackId}
                    />
                    <button
                      onClick={() => {
                        if (!selectedFallbackId || !draftReply.trim()) return;
                        sendMessageMutation.mutate({
                          ticketId: selectedFallbackId,
                          body: draftReply.trim()
                        });
                      }}
                      className="rounded-[8px] bg-violet p-2 text-white hover:bg-violet-hover transition-colors disabled:opacity-50"
                      disabled={!selectedFallbackId}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-violet text-white shadow-violet hover:bg-violet-hover transition-colors"
        aria-label="Open support widget"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}

