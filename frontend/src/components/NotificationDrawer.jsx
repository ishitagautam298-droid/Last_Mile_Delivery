import React, { useState } from 'react';
import { Mail, MessageSquare, ExternalLink, Bell, CheckCircle2, ChevronRight, X } from 'lucide-react';

const NotificationDrawer = ({ notifications = [], isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Dispatched Notifications</h3>
              <p className="text-xs text-slate-500">Live Email & SMS Audit Logs ({notifications.length})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No notifications dispatched yet for this order.
            </div>
          ) : (
            notifications.map((notif) => {
              const isEmail = notif.channel === 'email';

              return (
                <div
                  key={notif._id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isEmail ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {isEmail ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                      <span className="uppercase">{notif.channel}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(notif.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 mb-1">
                    {notif.subject || notif.type}
                  </h4>

                  {isEmail ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-slate-600 line-clamp-2">
                        Recipient: <strong className="text-slate-800">{notif.recipient?.email}</strong>
                      </p>
                      {notif.previewUrl ? (
                        <a
                          href={notif.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline bg-blue-50 px-2.5 py-1 rounded-md"
                        >
                          <span>Open Live Email Preview</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Delivered to Inbox
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                      {notif.message}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <p className="text-xs text-slate-500">
            Powered by Automated Nodemailer & Multi-Carrier SMS Gateway
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
