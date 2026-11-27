/* eslint-disable */
import { useApi } from "../../contexts/ApiContext";
import { useEffect, useState } from "react";
import { FiMail, FiCalendar } from "react-icons/fi";

import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useToast } from "../../contexts/ToastContext";

const inputClass =
  "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f84525]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";
const parseEmails = (value) => [
  ...new Set(
    value
      .split(/[,;\n]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  ),
];
const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-5 py-4 dark:border-gray-700">
    <span className="text-sm font-medium">{label}</span>
    <span className="relative inline-flex shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="h-6 w-10 rounded-full bg-gray-300 transition-colors peer-checked:bg-[#f84525]" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
    </span>
  </label>
);

export default function LeaveSettings() {
  const { authApi } = useApi();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [hrs, setHrs] = useState([]);
  const [form, setForm] = useState({
    enabled: false,
    to: "",
    cc: "",
    allowLeaveBeyondBalance: false,
    earnedLeave: 12,
  });
  const [mailEnabled, setMailEnabled] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.all([authApi.getSettings(), authApi.getHrs()])
      .then(([settings, users]) => {
        if (!active) return;
        const data = settings.data.data || {};
        const email = data.leaveRequestEmail || {};
        setForm({
          enabled: Boolean(email.enabled),
          to: (email.to || []).join(", "),
          cc: (email.cc || []).join(", "),
          allowLeaveBeyondBalance: Boolean(data.allowLeaveBeyondBalance),
          earnedLeave: data.leaveEntitlements?.earned_leave ?? 12,
        });
        setMailEnabled(data.mailEnabled !== false);
        setHrs((users.data.data || []).filter((user) => user.isActive && user.email));
      })
      .catch((error) => {
        if (active) {
          setLoadError(true);
          toast.error(error.response?.data?.message || "Unable to load leave settings");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);
  const save = async (event) => {
    event.preventDefault();
    const to = parseEmails(form.to);
    const cc = parseEmails(form.cc);
    if ([...to, ...cc].some((email) => !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)))
      return toast.error("Enter valid recipient and CC email addresses.");
    if (form.enabled && !to.length) return toast.error("Add at least one HR recipient.");
    setSaving(true);
    try {
      const response = await authApi.updateSettings({
        leaveRequestEmail: { enabled: form.enabled, to, cc },
        allowLeaveBeyondBalance: form.allowLeaveBeyondBalance,
        leaveEntitlements: { earned_leave: Number(form.earnedLeave) },
      });
      const saved = response.data.data.leaveRequestEmail;
      setForm((current) => ({ ...current, to: saved.to.join(", "), cc: saved.cc.join(", ") }));
      toast.success("Leave settings saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save leave settings");
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <CommonLoader text="Loading settings..." />;
  if (loadError)
    return (
      <p className="rounded-sm border bg-white p-5">
        Unable to load leave settings. Refresh to try again.
      </p>
    );
  return (
    <div className="space-y-5 text-gray-900 dark:text-gray-100">
      <header className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-2xl font-semibold">Leave Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage leave request emails, recipients, and leave policies.
        </p>
      </header>
      <form onSubmit={save} className="space-y-5">
        <fieldset disabled={saving} className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-700">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffe9e5] text-[#f84525]">
                <FiMail className="h-5 w-5" />
              </span>
              <h2 className="text-base font-semibold">Leave Request Emails</h2>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <Toggle
                label="Send email when an employee submits a leave request"
                checked={form.enabled}
                onChange={(enabled) => setForm((current) => ({ ...current, enabled }))}
              />
              <p className="mt-2 text-xs leading-6 text-gray-400">
                Turning this off stops leave request emails. Employees can still submit requests.
              </p>
              {!mailEnabled && (
                <p className="rounded-xl bg-[#fff1df] px-5 py-4 text-sm leading-6 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                  System emails are off. Enable “Allow mails from system” in General Settings to
                  send emails.
                </p>
              )}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                    HR recipients (To)
                    <textarea
                      rows={3}
                      value={form.to}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, to: event.target.value }))
                      }
                      placeholder="hr@company.com, hr2@company.com"
                      className={inputClass}
                    />
                  </label>
                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    Separate email addresses with commas or new lines.
                  </p>
                  {hrs.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {hrs.map((hr) => (
                        <label
                          key={hr._id}
                          className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-4 text-sm break-words dark:border-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={parseEmails(form.to).includes(hr.email.toLowerCase())}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                to: (event.target.checked
                                  ? [
                                      ...new Set([
                                        ...parseEmails(current.to),
                                        hr.email.toLowerCase(),
                                      ]),
                                    ]
                                  : parseEmails(current.to).filter(
                                      (email) => email !== hr.email.toLowerCase()
                                    )
                                ).join(", "),
                              }))
                            }
                            className="h-4 w-4 shrink-0 accent-[#f84525]"
                          />
                          {hr.name} ({hr.email})
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                    CC recipients
                    <textarea
                      rows={3}
                      value={form.cc}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, cc: event.target.value }))
                      }
                      placeholder="admin@company.com, manager@company.com"
                      className={inputClass}
                    />
                  </label>
                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    Add the admin and anyone else who should receive a copy.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-700">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffe9e5] text-[#f84525]">
                <FiCalendar className="h-5 w-5" />
              </span>
              <h2 className="text-base font-semibold">Leave Policy</h2>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <Toggle
                label="Allow employees to request more leave days than they have available"
                checked={form.allowLeaveBeyondBalance}
                onChange={(allowLeaveBeyondBalance) =>
                  setForm((current) => ({ ...current, allowLeaveBeyondBalance }))
                }
              />
              <p className="text-xs leading-6 text-gray-400">
                When disabled, requests beyond the available balance are rejected.
              </p>
              <label className="block max-w-sm text-sm font-medium">
                Earned Leave (days per year)
                <input
                  type="number"
                  min="0"
                  max="365"
                  step="0.5"
                  required
                  value={form.earnedLeave}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, earnedLeave: event.target.value }))
                  }
                  className={inputClass}
                />
              </label>
              <p className="text-xs leading-6 text-gray-400">
                Earned Leave accrues monthly and carries forward, capped by the annual allocation.
                Sick Leave accrues at 0.5 day per completed month, up to 6 days per year. Optional
                Leave adds one day in January, May, and September. Urgent Leave, Half Day, and Full
                Day use the Earned Leave balance.
              </p>
            </div>
          </section>
        </fieldset>
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={saving}
            disabled={saving}
            text="Save Leave Settings"
            variant="secondary"
            className="!rounded-xl !border !border-gray-300 !bg-transparent !px-6 !py-3 !text-gray-900 dark:!text-gray-100"
          />
        </div>
      </form>
    </div>
  );
}
