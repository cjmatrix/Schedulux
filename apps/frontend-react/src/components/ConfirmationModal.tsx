import { useEffect, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, Loader2, Trash2, X } from 'lucide-react';

export type ConfirmationVariant = 'confirm' | 'warn' | 'warning' | 'delete' | 'danger' | 'info';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  isLoading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  variant = 'confirm',
  isLoading = false,
  icon,
  children,
  confirmButtonClassName,
  cancelButtonClassName,
  maxWidth = 'md',
}: ConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDelete = variant === 'delete' || variant === 'danger';
  const isWarn = variant === 'warn' || variant === 'warning';

 
  const resolvedConfirmText =
    confirmText || (isDelete ? 'Delete' : isWarn ? 'Proceed' : 'Confirm');

  
  const renderIcon = () => {
    if (icon) return icon;
    if (isDelete) {
      return <Trash2 className="w-5 h-5" />;
    }
    if (isWarn) {
      return <AlertTriangle className="w-5 h-5" />;
    }
    return <AlertCircle className="w-5 h-5" />;
  };

  const getIconWrapperClasses = () => {
    if (isDelete) {
      return 'bg-rose-50 border-rose-100 text-rose-600';
    }
    if (isWarn) {
      return 'bg-amber-50 border-amber-100 text-amber-600';
    }
    return 'bg-indigo-50 border-indigo-100 text-indigo-600';
  };

  const getDefaultConfirmButtonClasses = () => {
    if (confirmButtonClassName) return confirmButtonClassName;
    if (isDelete) {
      return 'bg-rose-600 hover:bg-rose-700 active:scale-98 text-white shadow-2xs';
    }
    if (isWarn) {
      return 'bg-amber-600 hover:bg-amber-700 active:scale-98 text-white shadow-2xs';
    }
    return 'bg-slate-900 hover:bg-slate-800 active:scale-98 text-white shadow-2xs';
  };

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-white rounded-3xl border border-slate-200/90 shadow-2xl ${maxWidthClasses} w-full overflow-hidden p-6 relative animate-in zoom-in-95 duration-150 space-y-4`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${getIconWrapperClasses()}`}
          >
            {renderIcon()}
          </div>
          <div className="pr-6">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            {description && (
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Custom Body / Injected Details */}
        {children && <div className="space-y-3">{children}</div>}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={
              cancelButtonClassName ||
              'px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50'
            }
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isLoading}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${getDefaultConfirmButtonClasses()}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isDelete ? 'Deleting...' : 'Processing...'}</span>
              </>
            ) : (
              <span>{resolvedConfirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

