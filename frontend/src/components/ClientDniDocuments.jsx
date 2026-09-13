import React, { useEffect, useMemo, useState } from 'react';
import { Eye, FileImage, Loader2, Trash2, Upload, X } from 'lucide-react';
import api from '../api';
import { fetchClientDni, uploadClientDni } from '../services/clientDniApi';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

const validateFile = (file) => {
  if (!file) return 'Selecciona una imagen.';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Formato no permitido. Usa JPG, PNG o WEBP.';
  if (file.size > MAX_BYTES) return 'La imagen supera el máximo de 5 MB.';
  return null;
};

const DniCard = ({
  label,
  side,
  imageUrl,
  busy,
  canUpload,
  canDelete,
  onSelect,
  onDelete,
  onPreview,
}) => (
  <div className="rounded-2xl border border-[#E6DCD2] bg-[#FAF8F5] p-3 space-y-2">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-extrabold text-[#2C221E] flex items-center gap-1.5">
        <FileImage className="w-4 h-4 text-[#D96B27]" />
        {label}
      </span>
      {busy && <Loader2 className="w-4 h-4 animate-spin text-[#D96B27]" />}
    </div>

    {imageUrl ? (
      <button
        type="button"
        onClick={onPreview}
        className="w-full h-32 overflow-hidden rounded-xl border border-[#E6DCD2] bg-white relative group"
        title={`Ver ${label}`}
      >
        <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
          <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
        </span>
      </button>
    ) : (
      <div className="h-32 rounded-xl border border-dashed border-[#D7C8BD] bg-white flex items-center justify-center text-[11px] text-[#6E615A]">
        Sin imagen
      </div>
    )}

    {(canUpload || (canDelete && imageUrl)) && (
      <div className="flex items-center gap-2">
        {canUpload && (
          <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E6DCD2] text-[11px] font-bold text-[#D96B27] hover:bg-[#FDF3ED]">
            <Upload className="w-3.5 h-3.5" />
            {imageUrl ? 'Cambiar' : 'Subir imagen'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                onSelect(side, file);
                event.target.value = '';
              }}
            />
          </label>
        )}

        {canDelete && imageUrl && (
          <button
            type="button"
            onClick={() => onDelete(side)}
            disabled={busy}
            className="px-3 py-2 rounded-xl border border-[#C84B31]/30 bg-[#FDF2F0] text-[#C84B31] text-[11px] font-bold hover:bg-[#FBE8E4] disabled:opacity-50"
            title="Eliminar imagen"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )}
  </div>
);

export function ClientDniDocuments({
  clientId,
  user,
  readOnly = false,
  staged = false,
  frontFile = null,
  backFile = null,
  onFrontFileChange,
  onBackFileChange,
}) {
  const role = String(user?.role || '').toUpperCase();
  const canView = ['ADMIN', 'COBRADOR'].includes(role);
  const canUpload = !readOnly && ['ADMIN', 'COBRADOR'].includes(role);
  const canDelete = !readOnly && role === 'ADMIN';

  const [documents, setDocuments] = useState({
    front: { exists: false, url: null },
    back: { exists: false, url: null },
  });
  const [busySide, setBusySide] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const stagedFrontUrl = useMemo(() => (frontFile ? URL.createObjectURL(frontFile) : null), [frontFile]);
  const stagedBackUrl = useMemo(() => (backFile ? URL.createObjectURL(backFile) : null), [backFile]);

  useEffect(() => () => {
    if (stagedFrontUrl) URL.revokeObjectURL(stagedFrontUrl);
    if (stagedBackUrl) URL.revokeObjectURL(stagedBackUrl);
  }, [stagedFrontUrl, stagedBackUrl]);

  const loadDocuments = async () => {
    if (!clientId || staged || !canView) return;
    try {
      setError('');
      const data = await fetchClientDni(clientId);
      setDocuments({
        front: data?.front || { exists: false, url: null },
        back: data?.back || { exists: false, url: null },
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'No se pudieron cargar las fotos del DNI.');
    }
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, staged, canView]);

  if (!canView) return null;

  const handleSelect = async (side, file) => {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    if (staged) {
      if (side === 'front') onFrontFileChange?.(file);
      if (side === 'back') onBackFileChange?.(file);
      return;
    }

    if (!clientId) return;
    try {
      setBusySide(side);
      await uploadClientDni(clientId, side, file);
      await loadDocuments();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'No se pudo subir la imagen.');
    } finally {
      setBusySide(null);
    }
  };

  const handleDelete = async (side) => {
    if (!clientId || role !== 'ADMIN') return;
    if (!window.confirm('¿Eliminar esta foto del DNI?')) return;

    try {
      setBusySide(side);
      setError('');
      await api.delete(`/clients/${clientId}/dni/${side}`);
      await loadDocuments();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'No se pudo eliminar la imagen.');
    } finally {
      setBusySide(null);
    }
  };

  const frontUrl = staged ? stagedFrontUrl : documents.front?.url;
  const backUrl = staged ? stagedBackUrl : documents.back?.url;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-extrabold text-[#2C221E]">Fotos del DNI</h4>
          <p className="text-[10px] text-[#6E615A]">JPG, PNG o WEBP. Máximo 5 MB por imagen.</p>
        </div>
      </div>

      {error && (
        <div className="text-[11px] font-semibold text-[#C84B31] bg-[#FDF2F0] border border-[#C84B31]/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DniCard
          label="DNI Frontal"
          side="front"
          imageUrl={frontUrl}
          busy={busySide === 'front'}
          canUpload={canUpload}
          canDelete={canDelete}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onPreview={() => setPreview({ label: 'DNI Frontal', url: frontUrl })}
        />
        <DniCard
          label="DNI Reverso"
          side="back"
          imageUrl={backUrl}
          busy={busySide === 'back'}
          canUpload={canUpload}
          canDelete={canDelete}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onPreview={() => setPreview({ label: 'DNI Reverso', url: backUrl })}
        />
      </div>

      {preview?.url && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="max-w-3xl w-full relative" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-white text-[#2C221E]"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={preview.url} alt={preview.label} className="w-full max-h-[80vh] object-contain rounded-2xl bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}
