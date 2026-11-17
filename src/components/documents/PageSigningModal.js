import { useCallback, useEffect, useRef, useState } from 'react';
import API from '../../api/axios';
import CommonModal from '../common/CommonModal';
import CommonLoader from '../common/CommonLoader';
import Button from '../common/Button';
import CustomDropdown from '../common/CustomDropdown';
import PdfPageCanvas from './PdfPageCanvas';
import SignaturePad from './SignaturePad';
import { useToast } from '../../contexts/ToastContext';

export default function PageSigningModal({ document, managed, canDelete = false, onDelete, onClose, onChanged }) {
  const toast = useToast();
  const [doc, setDoc] = useState(null), [original, setOriginal] = useState(null), [pageBytes, setPageBytes] = useState(null);
  const [page, setPage] = useState(1), [placements, setPlacements] = useState([]), [visited, setVisited] = useState([]);
  const [signature, setSignature] = useState(null), [accepted, setAccepted] = useState(false), [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [reason, setReason] = useState('');
  const [refresh, setRefresh] = useState(0);
  const pageArea = useRef(null), draggingBox = useRef(false);
  const fetchMetadata = useCallback(async () => {
    const res = await API.get(`/documents/${document._id}/signing`);
    setDoc(res.data.data); return res.data.data;
  }, [document._id]);
  useEffect(() => {
    let active = true;
    Promise.all([API.get(`/documents/${document._id}/signing`), API.get(`/documents/${document._id}/file`, { responseType: 'arraybuffer' })]).then(([meta, pdf]) => {
      if (!active) return;
      setDoc(meta.data.data); setPlacements(meta.data.data.placements); setOriginal(pdf.data);
    }).catch(err => { if (active) setError(err.response?.data?.message || 'Unable to load document'); });
    return () => { active = false; };
  }, [document._id]);
  const setup = managed && doc?.status === 'draft';
  const signing = !managed && ['pending', 'needs_correction'].includes(doc?.status);
  const reviewing = managed && doc?.status === 'awaiting_verification';
  const count = doc?.pages?.length || 0;
  const signedPages = doc?.signedPages || [];
  const pageSigned = signedPages.includes(page);
  const currentSize = doc?.pages?.[page - 1];
  const placement = placements[page - 1];
  const hasDoc = Boolean(doc);
  useEffect(() => {
    setReady(false); setSignature(null); setAccepted(false); setPageBytes(null);
    if (!hasDoc || setup) return;
    let active = true;
    API.get(`/documents/${document._id}/page`, { params: { page }, responseType: 'arraybuffer' }).then(res => { if (active) setPageBytes(res.data); }).catch(() => { if (active) setError('Unable to load page. Close and reopen to retry.'); });
    return () => { active = false; };
  }, [page, setup, document._id, refresh, hasDoc]); // Metadata updates do not discard the current page.
  const version = () => ({ originalHash: doc.originalHash, revision: doc.revision || 1, round: doc.signingRound || 1 });
  const rendered = () => { setReady(true); setVisited(current => current.includes(page) ? current : [...current, page]); };
  const changePlacement = update => setPlacements(current => current.map(item => item.page === page ? { ...item, ...update } : item));
  const changePage = next => { setReady(false); setPage(next); };
  const savePage = async () => {
    if (!ready || !signature || !accepted) return;
    setBusy(true);
    try {
      await API.post(`/documents/${doc._id}/sign-page`, { ...version(), page, accepted, signature });
      const updated = await fetchMetadata();
      await onChanged();
      setRefresh(value => value + 1);
      const next = updated.pages.find(p => !updated.signedPages.includes(p.page));
      if (next) changePage(next.page);
      toast.success(next ? 'Page signed. Continue with the next page.' : 'All pages signed. Submit for verification.');
    } catch (err) { toast.error(err.response?.data?.message || 'Unable to save page signature'); }
    finally { setBusy(false); }
  };
  const sendLayout = async () => {
    setBusy(true);
    try { await API.post(`/documents/${doc._id}/layout`, { ...version(), placements }); toast.success('Document sent for page-wise signing'); await onChanged(); onClose(); }
    catch (err) { toast.error(err.response?.data?.message || 'Unable to save placements'); }
    finally { setBusy(false); }
  };
  const submit = async () => {
    setBusy(true);
    try { await API.post(`/documents/${doc._id}/submit`, version()); toast.success('Submitted. HR or Admin will verify your signed pages.'); await onChanged(); onClose(); }
    catch (err) { toast.error(err.response?.data?.message || 'Unable to submit'); }
    finally { setBusy(false); }
  };
  const review = async action => {
    setBusy(true);
    try {
      await API.post(`/documents/${doc._id}/review`, { ...version(), action, reason, reviewedPages: visited, signedHash: doc.signedHash });
      toast.success(action === 'approve' ? 'Approved and marked Done' : 'Correction requested'); await onChanged(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Unable to review document'); }
    finally { setBusy(false); }
  };
  const pointBox = () => {
    if (!currentSize || !placement) return null;
    const totalHeight = currentSize.height + (placement.mode === 'strip' ? 96 : 0);
    return { left: `${(placement.mode === 'strip' ? Math.max(12, currentSize.width - 244) : placement.x) / currentSize.width * 100}%`, top: `${(placement.mode === 'strip' ? currentSize.height + 20 : placement.y) / totalHeight * 100}%`, width: `${220 / currentSize.width * 100}%`, height: `${80 / totalHeight * 100}%` };
  };
  const label = document.type === 'hr_policy' ? 'HR Policy' : 'Appointment Letter';
  return <CommonModal title={label} subtitle={setup ? 'Set a fixed signature box on each page, then send to the employee.' : reviewing ? 'Review every signed page before approving or requesting correction.' : 'Read and sign each page. HR/Admin approval is required for Done.'} className="max-w-5xl" onClose={() => { if (!busy) onClose(); }} bodyClassName="space-y-3" footer={<>
    {canDelete && <Button text="Delete" variant="danger" disabled={busy} onClick={onDelete} className="mr-auto" />}
    <Button text="Close" variant="secondary" disabled={busy} onClick={onClose} />
    {doc && setup && <Button text="Save Placements & Send" disabled={visited.length !== count || !ready} loading={busy} onClick={sendLayout} />}
    {signing && !pageSigned && <Button text="Sign This Page" disabled={!signature || !accepted || !ready} loading={busy} onClick={savePage} />}
    {signing && count > 0 && signedPages.length === count && <Button text="Submit for Verification" loading={busy} onClick={submit} />}
    {reviewing && <><Button text="Request Correction" variant="secondary" disabled={visited.length !== count || !reason.trim()} loading={busy} onClick={() => review('correction')} /><Button text="Approve & Mark Done" disabled={visited.length !== count || !ready} loading={busy} onClick={() => review('approve')} /></>}
  </>}>
    {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : !doc ? <CommonLoader compact text="Loading document…" /> : <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-gray-50 p-2 dark:bg-gray-800">
        <div className="flex items-center gap-2"><Button text="Previous" variant="secondary" disabled={busy || page === 1} onClick={() => changePage(page - 1)} className="text-xs" /><span className="text-sm font-semibold">Page {page} / {count}</span><Button text="Next" variant="secondary" disabled={busy || page === count || !ready} onClick={() => changePage(page + 1)} className="text-xs" /></div>
        <span className="text-xs">{setup || reviewing ? `${visited.length}/${count} pages viewed` : `${signedPages.length}/${count} pages signed`}</span>
      </div>
      <div className="flex flex-wrap gap-1">{doc.pages.map(p => <Button key={p.page} text={`${p.page}${signedPages.includes(p.page) ? ' ✓' : ''}`} variant={page === p.page ? 'primary' : 'secondary'} disabled={busy} onClick={() => changePage(p.page)} className="!px-2 !py-1 text-xs" />)}</div>
      {doc.correctionReason && <p className="rounded-sm bg-amber-50 p-3 text-sm text-amber-900">Correction requested: {doc.correctionReason}. Please read and sign all pages again.</p>}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 overflow-hidden rounded-sm border border-gray-200 bg-gray-100 p-2 dark:border-gray-700 dark:bg-gray-800">
          <div ref={pageArea} className="relative" style={{ backgroundColor: '#ffffff' }} onClick={event => {
            if (!setup || !ready || placement.mode !== 'overlay' || busy) return;
            const rect = pageArea.current.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width * currentSize.width - 70;
            const y = (event.clientY - rect.top) / rect.height * currentSize.height - 25;
            changePlacement({ x: Math.max(0, Math.min(currentSize.width - 220, x)), y: Math.max(0, Math.min(currentSize.height - 80, y)) });
          }}>
            {setup ? <><PdfPageCanvas bytes={original} page={page} onRendered={rendered} />{placement?.mode === 'strip' && <div style={{ aspectRatio: `${currentSize.width} / 96`, background: '#fff' }} />}</> : pageBytes ? <PdfPageCanvas bytes={pageBytes} onRendered={rendered} /> : <CommonLoader compact text="Loading page…" />}
            {ready && setup && <div onClick={event => event.stopPropagation()} onPointerDown={event => { if (placement.mode !== 'overlay' || busy) return; event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); draggingBox.current = true; }} onPointerMove={event => {
              if (!draggingBox.current) return;
              const rect = pageArea.current.getBoundingClientRect();
              changePlacement({ x: Math.max(0, Math.min(currentSize.width - 220, (event.clientX - rect.left) / rect.width * currentSize.width - 110)), y: Math.max(0, Math.min(currentSize.height - 80, (event.clientY - rect.top) / rect.height * currentSize.height - 40)) });
            }} onPointerUp={() => { draggingBox.current = false; }} onPointerCancel={() => { draggingBox.current = false; }} className="absolute flex touch-none cursor-move items-center justify-center border-2 border-[#f84525] bg-orange-100/40 text-center text-[9px] font-semibold text-orange-900" style={pointBox()}>Signature 220 × 80 pt</div>}
            {ready && signing && !pageSigned && signature && <div className="pointer-events-none absolute" style={{ ...pointBox(), background: "#ffffff" }}><img src={signature} alt="Final fixed-size signature preview" className="h-full w-full object-contain" /></div>}
          </div>
        </div>
        <div className="space-y-4 rounded-sm border border-gray-200 p-3 dark:border-gray-700">
          {setup ? <>
            <h3 className="text-sm font-semibold">Signature placement · Page {page}</h3>
            <CustomDropdown label="Placement" showPlaceholder={false} value={placement?.mode || 'strip'} disabled={busy} onChange={mode => changePlacement({ mode, x: 20, y: 20 })} options={[{ value: 'strip', label: 'Add space below page' }, { value: 'overlay', label: 'Use blank space on page' }]} />
            <p className="text-xs text-gray-500">{placement?.mode === 'strip' ? 'Adds a white strip below this page. Original text stays uncovered.' : 'Click a blank area on the page to position the box. You can drag the box to adjust it.'}</p>
            {placement?.mode === 'overlay' && <div className="flex gap-2">{['x', 'y'].map(axis => <label key={axis} className="min-w-0 flex-1 text-xs">{axis.toUpperCase()} (pt)<input type="number" min="0" step="1" disabled={busy} value={Math.round(placement[axis])} onChange={event => changePlacement({ [axis]: Math.max(0, Math.min((axis === 'x' ? currentSize.width - 220 : currentSize.height - 80), Number(event.target.value) || 0)) })} className="mt-1 w-full rounded-sm border bg-white p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white" /></label>)}</div>}
            <p className="text-xs text-gray-500">Box size is fixed on every page. Review all {count} pages to enable Send.</p>
          </> : signing ? <>
            {pageSigned ? <><p className="text-sm font-semibold text-green-600">Page {page} signed ✓</p><p className="text-xs text-gray-500">Your signature is saved. Continue to the next unsigned page.</p>{signedPages.length === count && <p className="text-sm">All pages are signed. Submit below for verification.</p>}</> : <>
              <SignaturePad key={`${page}-${refresh}`} disabled={busy || !ready} onChange={setSignature} />
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-[#f84525]" checked={accepted} disabled={busy || !ready} onChange={event => setAccepted(event.target.checked)} />I have read page {page} and agree to its contents. I consent to signing this page electronically.</label>
              <p className="text-xs text-gray-500">Your final signature is previewed in its fixed position on the page.</p>
            </>}
          </> : reviewing ? <>
            <h3 className="text-sm font-semibold">HR / Admin Verification</h3><p className="text-xs text-gray-500">Check the signature and content on each page. Only approval marks this document Done.</p>
            <label className="block text-sm">Correction reason<textarea maxLength={1000} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} placeholder="Required when requesting correction" className="mt-2 min-h-28 w-full rounded-sm border p-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white" /></label>
          </> : <p className="text-sm">{doc.status === 'awaiting_verification' ? 'Submitted successfully. Waiting for HR/Admin verification.' : `Status: ${doc.status}`}</p>}
        </div>
      </div>
    </>}
  </CommonModal>;
}
