import { useCallback, useContext, useEffect, useState } from "react";
import { FiBell, FiCheck, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api";
import Button from "../components/common/Button";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); const response = await authApi.getNotifications(); setItems(response.data.data || []); }
    catch (error) { toast.error(error.response?.data?.message || "Unable to load notifications"); }
    finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const openNotification = async (item) => {
    if (!item.isRead) {
      setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, isRead: true } : entry));
      await authApi.markNotificationRead(item._id).catch(() => {});
    }
    const employeeId = item.meta?.employeeId;
    if (employeeId) {
      if (user?.role === "employee") {
        navigate(`/employee/dashboard?notification=${item._id}`);
      } else {
        const base = user?.role === "superadmin" ? "/admin" : "/hr";
        navigate(`${base}/employees/${employeeId}?tab=${item.meta?.leaveId ? "leaves" : "details"}`);
      }
    }
  };

  const remove = async (event, id) => {
    event.stopPropagation();
    try { await authApi.deleteNotification(id); setItems((current) => current.filter((item) => item._id !== id)); }
    catch (error) { toast.error(error.response?.data?.message || "Unable to delete notification"); }
  };

  if (user?.role === "hr" && user?.moduleAccess?.notifications?.view !== true) return <section className="rounded-sm border border-red-200 bg-white p-6 text-sm text-red-600">You do not have notification view access.</section>;
  return <section className="mx-auto max-w-5xl space-y-4">
    <div className="rounded-sm border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><FiBell className="text-[#f84525]" /><div><h1 className="text-xl font-semibold">Notifications</h1><p className="text-sm text-gray-500">Updates and alerts related to your account and employees.</p></div></div></div>
    <div className="overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm">
      {loading ? <p className="p-6 text-sm text-gray-500">Loading notifications...</p> : items.length === 0 ? <p className="p-6 text-sm text-gray-500">No notifications</p> : items.map((item) => <article key={item._id} onClick={() => openNotification(item)} className={`flex cursor-pointer items-start gap-4 border-b p-4 last:border-b-0 hover:bg-[#fff8f5] ${item.isRead ? "bg-white" : "bg-[#fff5f3]"}`}><div className="mt-1 rounded-full bg-orange-100 p-2 text-[#f84525]"><FiBell /></div><div className="min-w-0 flex-1"><h2 className="font-semibold text-gray-900">{item.title}</h2><p className="mt-1 text-sm text-gray-600">{item.message}</p><p className="mt-2 text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</p></div><div className="flex items-center gap-2">{!item.isRead && <FiCheck className="text-green-600" title="Unread" />}{["hr", "superadmin", "teamlead"].includes(user?.role) && <Button variant="secondary" className="p-2" onClick={(event) => remove(event, item._id)} aria-label="Delete notification"><FiTrash2 /></Button>}</div></article>)}
    </div>
  </section>;
};

export default Notifications;
